#!/usr/bin/env node

/**
 * Reemplaza las fotos de producto en Shopify por la sesion nueva conservando
 * el SEO de las imagenes viejas.
 *
 * Las URL de `/wp-content/uploads/...` que quedaron indexadas apuntan (via
 * `legacy-image-redirects.json`) a los MISMOS archivos que Shopify usa como
 * media de producto. Borrar esa media rompe esos 301, asi que el paso final
 * reapunta cada redireccion a la foto nueva equivalente del mismo producto.
 *
 *   pnpm photos:plan     Muestra que se subiria, se conservaria y se borraria.
 *   pnpm photos:apply    Sube, reordena y borra en Shopify + sincroniza el repo.
 *   pnpm photos:verify   Comprueba que Shopify y el repo quedaron consistentes.
 */

import { existsSync } from "node:fs";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST_FILE = path.join(ROOT, "shopify-import/product-photos-manifest.json");
const STATE_FILE = path.join(ROOT, "shopify-import/product-photos-state.json");
const CATALOG_FILE = path.join(ROOT, "src/data/catalog.json");
const IMAGE_REDIRECTS_FILE = path.join(ROOT, "src/data/legacy-image-redirects.json");
const PUBLIC_PRODUCTS = path.join(ROOT, "public/products");

const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
const STORE = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const command = process.argv[2] ?? "plan";

/* ------------------------------------------------------------------ */
/* Shopify Admin API                                                    */
/* ------------------------------------------------------------------ */

let token = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertConfiguration() {
  if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Falta SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET en .env.local.",
    );
  }
}

async function getToken() {
  if (token !== null) return token;
  const response = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const json = await response.json();
  if (!response.ok || typeof json.access_token !== "string") {
    throw new Error(`No se pudo autenticar con ${STORE}: ${JSON.stringify(json)}`);
  }
  const scopes = new Set(String(json.scope ?? "").split(","));
  const missing = ["write_products", "write_files"].filter((s) => !scopes.has(s));
  if (missing.length > 0) {
    throw new Error(`La app no tiene los permisos: ${missing.join(", ")}`);
  }
  token = json.access_token;
  return token;
}

async function graphql(query, variables = {}) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getToken(),
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    const throttled =
      response.status === 429 ||
      json.errors?.some((error) => error.extensions?.code === "THROTTLED");
    if (throttled) {
      await sleep(attempt * 1000);
      continue;
    }
    if (!response.ok || json.errors) {
      throw new Error(`Error GraphQL: ${JSON.stringify(json.errors ?? json)}`);
    }
    return json.data;
  }
  throw new Error("Shopify siguio limitando la tasa despues de varios reintentos.");
}

function assertNoUserErrors(payload, operation) {
  if (payload?.userErrors?.length > 0) {
    throw new Error(`${operation}: ${JSON.stringify(payload.userErrors)}`);
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                           */
/* ------------------------------------------------------------------ */

/** `.../files/Pre-Race.jpg?v=123` -> `Pre-Race.jpg` */
function cdnFileName(url) {
  return decodeURIComponent(new URL(url).pathname.split("/").pop());
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function writeJson(file, value) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function readState() {
  try {
    return await readJson(STATE_FILE);
  } catch (error) {
    if (error.code === "ENOENT") return { store: STORE, products: {} };
    throw error;
  }
}

const PRODUCT_MEDIA_QUERY = /* GraphQL */ `
  query ($handle: String!) {
    productByHandle(handle: $handle) {
      id
      title
      media(first: 50) {
        nodes {
          id
          ... on MediaImage {
            image {
              url
            }
          }
        }
      }
    }
  }
`;

async function fetchProduct(handle) {
  const data = await graphql(PRODUCT_MEDIA_QUERY, { handle });
  const product = data.productByHandle;
  if (product === null) throw new Error(`No existe el producto "${handle}" en Shopify.`);
  return {
    id: product.id,
    title: product.title,
    media: product.media.nodes
      .filter((node) => node.image?.url !== undefined)
      .map((node) => ({ id: node.id, url: node.image.url, name: cdnFileName(node.image.url) })),
  };
}

/* ------------------------------------------------------------------ */
/* Subida                                                               */
/* ------------------------------------------------------------------ */

async function stageUpload(fileName, size) {
  const data = await graphql(
    /* GraphQL */ `
      mutation ($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            url
            resourceUrl
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      input: [
        {
          filename: fileName,
          mimeType: "image/webp",
          resource: "IMAGE",
          httpMethod: "POST",
          fileSize: String(size),
        },
      ],
    },
  );
  assertNoUserErrors(data.stagedUploadsCreate, "stagedUploadsCreate");
  return data.stagedUploadsCreate.stagedTargets[0];
}

async function uploadToStagedTarget(target, bytes, fileName) {
  const form = new FormData();
  for (const { name, value } of target.parameters) form.append(name, value);
  form.append("file", new Blob([bytes], { type: "image/webp" }), fileName);
  const response = await fetch(target.url, { method: "POST", body: form });
  if (!response.ok) {
    throw new Error(`Fallo la subida de ${fileName}: ${response.status} ${await response.text()}`);
  }
  return target.resourceUrl;
}

async function createMedia(productId, entries) {
  const data = await graphql(
    /* GraphQL */ `
      mutation ($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            ... on MediaImage {
              id
            }
          }
          mediaUserErrors {
            field
            message
          }
        }
      }
    `,
    {
      productId,
      media: entries.map((entry) => ({
        alt: entry.alt,
        mediaContentType: "IMAGE",
        originalSource: entry.resourceUrl,
      })),
    },
  );
  if (data.productCreateMedia.mediaUserErrors.length > 0) {
    throw new Error(`productCreateMedia: ${JSON.stringify(data.productCreateMedia.mediaUserErrors)}`);
  }
  return data.productCreateMedia.media.map((m) => m.id);
}

/** Shopify procesa la imagen en segundo plano; sin URL no se puede reapuntar. */
async function waitForMedia(handle, mediaIds) {
  const pending = new Set(mediaIds);
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const product = await fetchProduct(handle);
    const ready = new Map(product.media.map((m) => [m.id, m.url]));
    const resolved = [...pending].filter((id) => ready.has(id));
    for (const id of resolved) pending.delete(id);
    if (pending.size === 0) return new Map(mediaIds.map((id) => [id, ready.get(id)]));
    await sleep(2000);
  }
  throw new Error(`Shopify no termino de procesar la media de "${handle}".`);
}

/** El reorder de Shopify es un job asincrono: hay que esperar a que el orden
 *  publicado coincida antes de dar el producto por listo. */
async function reorderMedia(handle, productId, orderedNames) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const product = await fetchProduct(handle);
    if (product.media.map((m) => m.name).join("|") === orderedNames.join("|")) return;

    const byName = new Map(product.media.map((m) => [m.name, m.id]));
    const data = await graphql(
      /* GraphQL */ `
        mutation ($id: ID!, $moves: [MoveInput!]!) {
          productReorderMedia(id: $id, moves: $moves) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        id: productId,
        moves: orderedNames
          .filter((name) => byName.has(name))
          .map((name, index) => ({ id: byName.get(name), newPosition: String(index) })),
      },
    );
    assertNoUserErrors(data.productReorderMedia, "productReorderMedia");
    await sleep(attempt * 1000);
  }
  throw new Error(`El orden de la media de "${handle}" no quedo como se esperaba.`);
}

async function deleteMedia(productId, mediaIds) {
  if (mediaIds.length === 0) return;
  const data = await graphql(
    /* GraphQL */ `
      mutation ($productId: ID!, $mediaIds: [ID!]!) {
        productDeleteMedia(productId: $productId, mediaIds: $mediaIds) {
          deletedMediaIds
          mediaUserErrors {
            field
            message
          }
        }
      }
    `,
    { productId, mediaIds },
  );
  if (data.productDeleteMedia.mediaUserErrors.length > 0) {
    throw new Error(`productDeleteMedia: ${JSON.stringify(data.productDeleteMedia.mediaUserErrors)}`);
  }
}

/* ------------------------------------------------------------------ */
/* Comandos                                                             */
/* ------------------------------------------------------------------ */

/** Reparte las fotos viejas entre las nuevas para no colapsar todos los 301
 *  en una sola imagen: la vieja n-esima apunta a la nueva n-esima. */
function redirectTargetFor(index, newImages) {
  return newImages[Math.min(index, newImages.length - 1)];
}

async function plan() {
  const manifest = await readJson(MANIFEST_FILE);
  const imageRedirects = await readJson(IMAGE_REDIRECTS_FILE);

  let totalNew = 0;
  let totalDeleted = 0;
  let totalRedirects = 0;

  for (const product of manifest.products) {
    const live = await fetchProduct(product.handle);
    const keep = new Set(product.keep);
    const unknownKeep = product.keep.filter((name) => !live.media.some((m) => m.name === name));
    const doomed = live.media.filter((m) => !keep.has(m.name));

    const affected = doomed.flatMap((m) =>
      Object.entries(imageRedirects).filter(([, target]) => cdnFileName(target) === m.name),
    );

    console.log(`\n=== ${product.handle} — ${live.title}`);
    console.log(`  + ${product.images.length} fotos nuevas: ${product.images.map((i) => i.file).join(", ")}`);
    console.log(`  = conserva ${keep.size}: ${product.keep.join(", ") || "(ninguna)"}`);
    console.log(`  - borra ${doomed.length}: ${doomed.map((m) => m.name).join(", ") || "(ninguna)"}`);
    if (unknownKeep.length > 0) {
      console.log(`  !! el manifiesto conserva media inexistente: ${unknownKeep.join(", ")}`);
    }
    if (affected.length > 0) {
      console.log(`  ~ reapunta ${affected.length} redirecciones legadas`);
    }

    totalNew += product.images.length;
    totalDeleted += doomed.length;
    totalRedirects += affected.length;
  }

  console.log(
    `\nTotal: ${totalNew} fotos nuevas, ${totalDeleted} borradas, ${totalRedirects} redirecciones reapuntadas.`,
  );
}

async function apply() {
  const manifest = await readJson(MANIFEST_FILE);
  const state = await readState();
  state.store = STORE;
  state.products ??= {};

  for (const product of manifest.products) {
    const live = await fetchProduct(product.handle);
    const keep = new Set(product.keep);
    const previous = state.products[product.handle];

    /* Idempotencia: si las fotos nuevas ya son la media del producto, no
       vuelve a subirlas (el script se puede reanudar tras un fallo). */
    const alreadyUploaded = product.images.every((image) =>
      live.media.some((m) => m.name === image.file),
    );

    let uploaded;
    if (alreadyUploaded) {
      console.log(`= ${product.handle}: las fotos nuevas ya estan en Shopify`);
      uploaded = product.images.map((image) => {
        const media = live.media.find((m) => m.name === image.file);
        return { ...image, id: media.id, url: media.url };
      });
    } else {
      const staged = [];
      for (const image of product.images) {
        const local = path.join(PUBLIC_PRODUCTS, image.file);
        const bytes = await readFile(local);
        const target = await stageUpload(image.file, bytes.byteLength);
        const resourceUrl = await uploadToStagedTarget(target, bytes, image.file);
        staged.push({ ...image, resourceUrl });
      }
      const mediaIds = await createMedia(live.id, staged);
      const urls = await waitForMedia(product.handle, mediaIds);
      uploaded = staged.map((image, i) => ({
        ...image,
        id: mediaIds[i],
        url: urls.get(mediaIds[i]),
      }));
      console.log(`+ ${product.handle}: ${uploaded.length} fotos subidas`);
    }

    /* El orden lo manda el manifiesto, no el que traiga Shopify. */
    const kept = product.keep
      .map((name) => live.media.find((m) => m.name === name))
      .filter((media) => media !== undefined);
    const doomed = live.media.filter(
      (m) => !keep.has(m.name) && !uploaded.some((u) => u.id === m.id),
    );

    /* El estado guarda lo borrado ANTES de borrarlo: si el proceso muere a
       mitad, la reanudacion sigue sabiendo a donde reapuntar los 301. */
    state.products[product.handle] = {
      productId: live.id,
      images: uploaded.map(({ file, alt, url }) => ({ file, alt, url })),
      kept: kept.map(({ name, url }) => ({ name, url })),
      removed: [...(previous?.removed ?? []), ...doomed.map(({ name, url }) => ({ name, url }))]
        .filter((entry, i, all) => all.findIndex((e) => e.name === entry.name) === i),
    };
    await writeJson(STATE_FILE, state);

    await deleteMedia(live.id, doomed.map((m) => m.id));
    if (doomed.length > 0) console.log(`- ${product.handle}: ${doomed.length} fotos viejas borradas`);

    await reorderMedia(product.handle, live.id, [
      ...uploaded.map((u) => u.file),
      ...kept.map((m) => m.name),
    ]);
  }

  await syncRepository(manifest, state);
}

/** Deja el respaldo local y las redirecciones de imagen alineados con Shopify. */
async function syncRepository(manifest, state) {
  const catalog = await readJson(CATALOG_FILE);
  const imageRedirects = await readJson(IMAGE_REDIRECTS_FILE);
  let repointed = 0;

  for (const product of manifest.products) {
    const saved = state.products[product.handle];
    if (saved === undefined) continue;

    const entry = catalog.find((p) => p.handle === product.handle);
    if (entry !== undefined) {
      /* El respaldo local se sirve solo, sin depender del CDN: si la tabla
         nutricional tiene copia en public/products se usa esa. */
      entry.images = [
        ...product.images.map((image) => `/products/${image.file}`),
        ...saved.kept.map((k) =>
          existsSync(path.join(PUBLIC_PRODUCTS, k.name)) ? `/products/${k.name}` : k.url,
        ),
      ];
    }

    for (const [index, removed] of saved.removed.entries()) {
      const target = redirectTargetFor(index, saved.images);
      for (const [legacyPath, currentTarget] of Object.entries(imageRedirects)) {
        if (cdnFileName(currentTarget) === removed.name) {
          imageRedirects[legacyPath] = target.url;
          repointed += 1;
        }
      }
    }
  }

  await writeJson(CATALOG_FILE, catalog);
  await writeJson(IMAGE_REDIRECTS_FILE, imageRedirects);
  console.log(`\nRepo sincronizado: ${repointed} redirecciones de imagen reapuntadas.`);
}

async function verify() {
  const manifest = await readJson(MANIFEST_FILE);
  const catalog = await readJson(CATALOG_FILE);
  const imageRedirects = await readJson(IMAGE_REDIRECTS_FILE);
  const problems = [];

  for (const product of manifest.products) {
    const live = await fetchProduct(product.handle);
    const names = live.media.map((m) => m.name);
    const expected = [...product.images.map((i) => i.file), ...product.keep];

    if (names.join("|") !== expected.join("|")) {
      problems.push(`${product.handle}: media en Shopify es [${names}], se esperaba [${expected}]`);
    }

    const entry = catalog.find((p) => p.handle === product.handle);
    if (entry !== undefined) {
      const first = `/products/${product.images[0].file}`;
      if (entry.images[0] !== first) {
        problems.push(`${product.handle}: catalog.json empieza en ${entry.images[0]}, se esperaba ${first}`);
      }
    }
  }

  /* Ninguna redireccion legada puede apuntar a un archivo que ya no existe. */
  const liveFiles = new Set();
  for (const product of manifest.products) {
    for (const media of (await fetchProduct(product.handle)).media) liveFiles.add(media.name);
  }
  for (const [legacyPath, target] of Object.entries(imageRedirects)) {
    const name = cdnFileName(target);
    const wasProductMedia = manifest.products.some((p) =>
      (p.keep ?? []).includes(name) || p.images.some((i) => i.file === name),
    );
    if (wasProductMedia && !liveFiles.has(name)) {
      problems.push(`${legacyPath}: apunta a ${name}, que ya no existe`);
    }
  }

  if (problems.length > 0) {
    console.error(problems.map((p) => `x ${p}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log("Todo consistente: Shopify, catalog.json y las redirecciones de imagen coinciden.");
}

/* ------------------------------------------------------------------ */

/** Copia las fotos de la sesion al repo con el nombre definitivo (SEO). */
async function stage() {
  const manifest = await readJson(MANIFEST_FILE);
  let copied = 0;
  for (const product of manifest.products) {
    for (const image of product.images) {
      await copyFile(
        path.join(manifest.sourceRoot, image.source),
        path.join(PUBLIC_PRODUCTS, image.file),
      );
      copied += 1;
    }
  }
  console.log(`${copied} fotos copiadas a public/products con su nombre definitivo.`);
}

assertConfiguration();
if (command === "plan") await plan();
else if (command === "stage") await stage();
else if (command === "apply") await apply();
else if (command === "verify") await verify();
else throw new Error(`Comando desconocido: ${command}. Usa plan, stage, apply o verify.`);
