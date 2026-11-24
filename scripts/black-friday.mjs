#!/usr/bin/env node
/**
 * Precios de Black Friday (ver src/lib/black-friday.ts para el porqué).
 *
 *   pnpm blackfriday:plan       lee los precios de hoy, imprime la tabla y
 *                               escribe src/data/black-friday-precios.json.
 *                               No cambia nada en la tienda.
 *   pnpm blackfriday:verificar  compara la tienda contra ese archivo.
 *   pnpm blackfriday:aplicar    pone los precios de la promo YA (el cron lo
 *   pnpm blackfriday:revertir   hace solo; esto es el respaldo manual).
 *
 * Entran los productos ACTIVOS que no son kits (etiqueta `kits`) ni unidades
 * sueltas de "Arma tu kit" (etiqueta `unidad`). Los borradores no se tocan.
 *
 * Ojo: `plan` se corre ANTES de que empiece la promo. Si se corre con la
 * promo puesta, tomaría los precios rebajados como "los de antes"; por eso
 * se niega a pisar el archivo si la tienda ya está en precios de promo.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  BLACK_FRIDAY,
  armarSnapshot,
  sincronizarPrecios,
} from "../src/lib/black-friday.ts";

const STORE = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = "2026-01";
const ARCHIVO = new URL("../src/data/black-friday-precios.json", import.meta.url);

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET.");
}

let token = null;
async function graphql(query, variables = {}) {
  if (token === null) {
    const respuesta = await fetch(`https://${STORE}/admin/oauth/access_token`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });
    const json = await respuesta.json();
    if (!respuesta.ok || typeof json.access_token !== "string") {
      throw new Error(`No se pudo obtener token de Admin: ${respuesta.status}`);
    }
    token = json.access_token;
  }
  const respuesta = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await respuesta.json();
  if (!respuesta.ok || json.errors !== undefined) {
    throw new Error(`Shopify Admin: ${respuesta.status} ${JSON.stringify(json.errors ?? "")}`);
  }
  return json.data;
}

async function productosActivos() {
  const data = await graphql(/* GraphQL */ `
    {
      products(first: 250, query: "status:active", sortKey: TITLE) {
        pageInfo {
          hasNextPage
        }
        nodes {
          id
          handle
          title
          tags
          variants(first: 100) {
            nodes {
              id
              title
              price
              compareAtPrice
            }
          }
        }
      }
    }
  `);
  if (data.products.pageInfo.hasNextPage) {
    throw new Error("Hay más de 250 productos activos: este script no pagina.");
  }
  return data.products.nodes
    .filter(
      (producto) =>
        !producto.tags.some((tag) => ["kits", "unidad"].includes(tag.toLowerCase().trim())),
    )
    .map((producto) => ({ ...producto, variants: producto.variants.nodes }));
}

function leerSnapshot() {
  if (!existsSync(ARCHIVO)) {
    throw new Error("No existe src/data/black-friday-precios.json: corre `pnpm blackfriday:plan`.");
  }
  return JSON.parse(readFileSync(ARCHIVO, "utf8"));
}

const cop = (valor) => (valor === null ? "—" : `$${valor.toLocaleString("es-CO")}`);

/** Una fila por precio distinto dentro del producto, no por sabor. */
function imprimirTabla(snapshot) {
  const filas = [];
  for (const producto of snapshot) {
    const vistos = new Set();
    for (const variante of producto.variants) {
      const clave = `${variante.antes.price}|${variante.antes.compareAt}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const lista = variante.promo.compareAt;
      filas.push({
        producto: producto.title.slice(0, 52),
        hoy: cop(variante.antes.price),
        "black friday": cop(variante.promo.price),
        tachado: cop(lista),
        "se ve": `-${Math.round((1 - variante.promo.price / lista) * 100)}%`,
      });
    }
  }
  console.table(filas);
}

const comando = process.argv[2] ?? "plan";

if (comando === "plan") {
  const productos = await productosActivos();
  const snapshot = armarSnapshot(productos, BLACK_FRIDAY.porcentaje);

  if (existsSync(ARCHIVO)) {
    const anterior = new Map(
      leerSnapshot().flatMap((producto) => producto.variants.map((v) => [v.id, v.promo.price])),
    );
    const yaEnPromo = snapshot
      .flatMap((producto) => producto.variants)
      .filter((v) => anterior.get(v.id) === v.antes.price).length;
    if (yaEnPromo > 0) {
      throw new Error(
        `${yaEnPromo} variantes ya están en precio de promo: no se regenera el plan sobre precios rebajados.`,
      );
    }
  }

  imprimirTabla(snapshot);
  writeFileSync(ARCHIVO, `${JSON.stringify(snapshot, null, 2)}\n`);
  const variantes = snapshot.reduce((total, producto) => total + producto.variants.length, 0);
  console.log(`\n${snapshot.length} productos, ${variantes} variantes → src/data/black-friday-precios.json`);
  console.log("Nada cambió en la tienda.");
} else if (comando === "verificar") {
  const snapshot = leerSnapshot();
  const hoy = new Map(
    (await productosActivos()).flatMap((producto) =>
      producto.variants.map((v) => [v.id, Math.round(Number(v.price))]),
    ),
  );
  let enPromo = 0;
  let enAntes = 0;
  const raras = [];
  for (const producto of snapshot) {
    for (const variante of producto.variants) {
      const precio = hoy.get(variante.id);
      if (precio === variante.promo.price) enPromo += 1;
      else if (precio === variante.antes.price) enAntes += 1;
      else raras.push(`${producto.handle} (${variante.title}): ${precio}`);
    }
  }
  console.log(`En precio de promo: ${enPromo} · en precio normal: ${enAntes} · otro precio: ${raras.length}`);
  for (const rara of raras) console.log(`  ${rara}`);
} else if (comando === "aplicar" || comando === "revertir") {
  const resultado = await sincronizarPrecios(graphql, leerSnapshot(), comando);
  console.log(resultado);
  console.log("La web se actualiza sola con los webhooks de producto.");
} else {
  throw new Error(`Comando desconocido: ${comando}`);
}
