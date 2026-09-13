#!/usr/bin/env node
/**
 * Crea en Shopify las unidades sueltas que va a ofrecer el armador "Arma tu
 * Kit": los mismos geles, sobres y barras que hoy solo se venden por caja,
 * pero de a uno.
 *
 *   pnpm unidades:plan       imprime qué haría, sin escribir nada (por defecto)
 *   pnpm unidades:aplicar    crea o actualiza los productos en la tienda
 *   pnpm unidades:verificar  comprueba que quedaron como deben
 *
 * Tres decisiones que no son obvias y que sostienen todo lo demás:
 *
 * 1. NO SON CATÁLOGO. Cada producto lleva la etiqueta `unidad`, que es lo
 *    único que `getAllProducts()` mira para dejarlos fuera de la tienda
 *    (ver el comentario de TAG_SOLO_EN_KIT en src/lib/taxonomia.ts). Sin esa
 *    etiqueta aparecen en el listado, en las landings, en el sitemap y con
 *    ficha propia. Por eso además se publican SOLO en el canal headless: si
 *    algún día alguien les quita la etiqueta, todavía quedan fuera de la
 *    tienda online de Shopify y de Google.
 *
 * 2. NACEN SIN STOCK. Se crean con inventario rastreado en cero, así que
 *    existen pero no se pueden comprar hasta que Operaciones cargue
 *    unidades. Es el lado seguro: un error acá no vende algo que no hay.
 *
 * 3. ES IDEMPOTENTE. `productSet` con el handle como identificador crea la
 *    primera vez y actualiza las siguientes, así que se puede correr de
 *    nuevo sin duplicar nada. Ojo: `productSet` reemplaza la lista completa
 *    de variantes, o sea que este archivo es la fuente de verdad de qué
 *    sabores existen por unidad. Un sabor que se borre de acá se borra de
 *    la tienda.
 *
 * Los códigos de barras son los EAN-13 reales que pasó Operaciones; van al
 * campo `barcode` porque es el que Shopify usa como GTIN.
 */

const STORE = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET.");
}

/** La etiqueta que esconde estos productos del catálogo. Igual que TAG_SOLO_EN_KIT. */
const TAG_UNIDAD = "unidad";

/** El único canal donde deben vivir: el que lee la web con la Storefront API. */
const CANAL_HEADLESS = "Actimax Headless";

const VENDOR = "Actimax";

/**
 * Qué se vende por unidad, con el precio y el EAN-13 de cada sabor.
 *
 * El precio unitario está por encima del precio que da la caja (entre +9% y
 * +44%) a propósito: armar un kit suelto tiene que salir más caro que
 * comprar el Energy Pack equivalente, o el armador se come el margen de los
 * packs, que es el producto que mejor deja.
 */
const UNIDADES = [
  {
    handle: "unidad-gel-energetico-90g",
    title: "Gel Energético 90 g — unidad",
    productType: "Geles energéticos",
    tags: [TAG_UNIDAD, "geles", "durante"],
    descripcion: "Un gel energético de 90 g. Se vende suelto solo dentro de «Arma tu Kit».",
    precio: 15000,
    sabores: [
      { nombre: "Fresa-Banano (sin cafeína)", barcode: "7709990576641", sku: "UNI-GEL90-FRBA" },
      { nombre: "Fresa con cafeína", barcode: "7709990576696", sku: "UNI-GEL90-FRE-CAF" },
      { nombre: "Manzana con cafeína", barcode: "7709990576627", sku: "UNI-GEL90-MAN-CAF" },
      { nombre: "Mango con cafeína", barcode: "7709990576658", sku: "UNI-GEL90-MAG-CAF" },
    ],
  },
  {
    handle: "unidad-gel-energetico-30g",
    title: "Gel Energético 30 g — unidad",
    productType: "Geles energéticos",
    tags: [TAG_UNIDAD, "geles", "durante"],
    descripcion: "Un sachet de gel energético de 30 g. Se vende suelto solo dentro de «Arma tu Kit».",
    precio: 9000,
    sabores: [
      { nombre: "Fresa-Banano (sin cafeína)", barcode: "7709028226838", sku: "UNI-GEL30-FRBA" },
      { nombre: "Fresa con cafeína", barcode: "7709811410888", sku: "UNI-GEL30-FRE-CAF" },
      /* Manzana y Mango llegaron de Operaciones sin el "CAF" que sí traen sus
         hermanos de 90 g. Confirmado el 12 de septiembre de 2026: los dos son
         con cafeína. Importa porque /mi-plan pregunta por tolerancia a la
         cafeína y no puede equivocarse en esto. */
      { nombre: "Manzana con cafeína", barcode: "7709990569124", sku: "UNI-GEL30-MAN-CAF" },
      { nombre: "Mango con cafeína", barcode: "7709028226869", sku: "UNI-GEL30-MAG-CAF" },
    ],
  },
  {
    handle: "unidad-energy-gel-30g",
    title: "Energy Gel 30 g — unidad",
    productType: "Geles energéticos",
    tags: [TAG_UNIDAD, "geles", "durante"],
    descripcion: "Un Energy Gel de 30 g. Se vende suelto solo dentro de «Arma tu Kit».",
    precio: 10000,
    sabores: [
      { nombre: "Kiwi", barcode: "7709682806483", sku: "UNI-EGEL30-KIWI" },
      { nombre: "Durazno", barcode: "7709682806476", sku: "UNI-EGEL30-DURA" },
      { nombre: "Cookies and Cream", barcode: "7709997169174", sku: "UNI-EGEL30-COOK" },
    ],
  },
  {
    handle: "unidad-sobre-pre-race",
    title: "Sobre Pre Race 36 g — unidad",
    productType: "Bebidas deportivas",
    tags: [TAG_UNIDAD, "bebidas", "antes"],
    descripcion: "Un sobre de Pre Race de 36 g. Se vende suelto solo dentro de «Arma tu Kit».",
    precio: 12000,
    sabores: [
      { nombre: "Fresa Natural", barcode: "7709811410833", sku: "UNI-PRERACE-FRE" },
      { nombre: "Vainilla Italiana", barcode: "7709811410826", sku: "UNI-PRERACE-VAI" },
      { nombre: "Caramelo Inglés", barcode: "7709028226883", sku: "UNI-PRERACE-CAR" },
    ],
  },
  {
    handle: "unidad-sobre-recovery-pro",
    title: "Sobre Recovery Pro 37 g — unidad",
    productType: "Bebidas deportivas",
    tags: [TAG_UNIDAD, "bebidas", "despues"],
    descripcion: "Un sobre de Recovery Pro de 37 g. Se vende suelto solo dentro de «Arma tu Kit».",
    precio: 15000,
    sabores: [
      { nombre: "Vainilla Italiana", barcode: "7709028226845", sku: "UNI-RECPRO-VAI" },
      { nombre: "Fresa", barcode: "7709028226807", sku: "UNI-RECPRO-FRE" },
    ],
  },
  {
    handle: "unidad-sachet-bebida-elite-cafeina",
    title: "Sachet Bebida Élite con cafeína 30 g — unidad",
    productType: "Bebidas deportivas",
    tags: [TAG_UNIDAD, "bebidas", "durante"],
    /* No hay sachet de Élite sin cafeína: sin cafeína solo existe el tarro.
       El armador tiene que cubrir a quien no tolera cafeína con geles y agua,
       igual que ya hace /mi-plan. */
    descripcion: "Un sachet de Bebida Élite con cafeína de 30 g. Se vende suelto solo dentro de «Arma tu Kit».",
    precio: 7000,
    sabores: [
      { nombre: "Naranja", barcode: "7709682806445", sku: "UNI-ELITE-NAR-CAF" },
      { nombre: "Uva", barcode: "7709682806414", sku: "UNI-ELITE-UVA-CAF" },
      { nombre: "Tutti Fruti", barcode: "7709682806490", sku: "UNI-ELITE-TUT-CAF" },
      { nombre: "Limón", barcode: "7709682806438", sku: "UNI-ELITE-LIM-CAF" },
    ],
  },
  {
    handle: "unidad-protein-bar",
    title: "Protein Bar — unidad",
    productType: "Barras de proteína",
    tags: [TAG_UNIDAD, "barras", "despues"],
    descripcion: "Una barra de proteína Protein Bar. Se vende suelta solo dentro de «Arma tu Kit».",
    precio: 15000,
    /* Sin sabores: Shopify igual exige una opción, y la de un producto de
       variante única se llama "Title" / "Default Title". Es lo mismo que
       tienen hoy los Energy Packs. */
    sabores: [{ nombre: null, barcode: "7709803786489", sku: "UNI-PROTEINBAR" }],
  },
];

/* ------------------------------------------------------------------ */
/* Comprobaciones sobre los datos de arriba, antes de tocar la tienda. */
/* ------------------------------------------------------------------ */

/** Dígito de control del EAN-13: un barcode malo lo rechaza Google, no Shopify. */
function ean13Valido(codigo) {
  if (!/^\d{13}$/.test(codigo)) return false;
  let suma = 0;
  for (let i = 0; i < 12; i += 1) suma += Number(codigo[i]) * (i % 2 ? 3 : 1);
  return (10 - (suma % 10)) % 10 === Number(codigo[12]);
}

function revisarDatos() {
  const problemas = [];
  const vistos = new Map();
  for (const producto of UNIDADES) {
    if (!producto.tags.includes(TAG_UNIDAD)) {
      problemas.push(`${producto.handle}: sin la etiqueta "${TAG_UNIDAD}"; aparecería en el catálogo.`);
    }
    for (const sabor of producto.sabores) {
      if (!ean13Valido(sabor.barcode)) {
        problemas.push(`${producto.handle} / ${sabor.nombre ?? "única"}: EAN-13 inválido (${sabor.barcode}).`);
      }
      const previo = vistos.get(sabor.barcode);
      if (previo !== undefined) {
        problemas.push(`EAN-13 ${sabor.barcode} repetido en ${previo} y ${producto.handle}.`);
      }
      vistos.set(sabor.barcode, producto.handle);
    }
  }
  return problemas;
}

/* ------------------------------------------------------------------ */
/* Shopify                                                             */
/* ------------------------------------------------------------------ */

async function token() {
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
  return json.access_token;
}

const accessToken = await token();

async function graphql(query, variables = {}) {
  const response = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

const PUBLICACIONES = /* GraphQL */ `
  {
    publications(first: 25) {
      nodes {
        id
        name
        catalog {
          title
        }
      }
    }
  }
`;

const PRODUCT_SET = /* GraphQL */ `
  mutation CrearUnidad($input: ProductSetInput!, $identifier: ProductSetIdentifiers) {
    productSet(synchronous: true, input: $input, identifier: $identifier) {
      product {
        id
        handle
        status
        variants(first: 20) {
          nodes {
            id
            title
            barcode
            price
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PUBLICAR = /* GraphQL */ `
  mutation Publicar($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

const DESPUBLICAR = /* GraphQL */ `
  mutation Despublicar($id: ID!, $input: [PublicationInput!]!) {
    publishableUnpublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

const ESTADO = /* GraphQL */ `
  query Estado($handle: String!) {
    productByIdentifier(identifier: { handle: $handle }) {
      id
      handle
      tags
      resourcePublications(first: 25) {
        nodes {
          isPublished
          publication {
            id
            name
            catalog {
              title
            }
          }
        }
      }
      variants(first: 20) {
        nodes {
          title
          barcode
          price
          inventoryQuantity
        }
      }
    }
  }
`;

/** El producto tal como lo quiere Shopify. */
function entrada(producto) {
  const conSabores = producto.sabores[0].nombre !== null;
  const nombreOpcion = conSabores ? "Sabores" : "Title";
  const valor = (sabor) => sabor.nombre ?? "Default Title";

  return {
    handle: producto.handle,
    title: producto.title,
    descriptionHtml: `<p>${producto.descripcion}</p>`,
    productType: producto.productType,
    vendor: VENDOR,
    status: "ACTIVE",
    tags: producto.tags,
    productOptions: [
      {
        name: nombreOpcion,
        values: producto.sabores.map((sabor) => ({ name: valor(sabor) })),
      },
    ],
    variants: producto.sabores.map((sabor) => ({
      optionValues: [{ optionName: nombreOpcion, name: valor(sabor) }],
      price: String(producto.precio),
      barcode: sabor.barcode,
      /* Rastreado y sin cantidades: nace agotado y Operaciones decide cuándo
         se puede vender. `inventoryQuantities` se deja fuera a propósito para
         no pisar el stock real en las corridas siguientes. */
      inventoryItem: { sku: sabor.sku, tracked: true },
      inventoryPolicy: "DENY",
    })),
  };
}

/**
 * Cómo se llama un canal, solo para imprimirlo.
 *
 * Nunca para decidir: los dos campos disponibles dan nombres distintos para
 * el mismo canal. En `publications` el headless es "Actimax Headless"
 * (`name`; `catalog` llega null porque los catálogos son cosa de B2B y
 * mercados), pero en `resourcePublications` el mismo canal se presenta como
 * "Channel Catalog <id> for Actimax Headless" (`catalog.title`). Comparar
 * por nombre hacía que el paso defensivo retirara los productos del canal
 * que acababa de publicarlos. La identidad de un canal es su id.
 */
function nombreCanal(publicacion) {
  return publicacion.name ?? publicacion.catalog?.title ?? publicacion.id;
}

async function publicaciones() {
  const data = await graphql(PUBLICACIONES);
  const porNombre = new Map(
    data.publications.nodes.map((p) => [nombreCanal(p), p.id]),
  );
  const headless = porNombre.get(CANAL_HEADLESS);
  if (headless === undefined) {
    throw new Error(
      `No existe el canal "${CANAL_HEADLESS}". Canales: ${[...porNombre.keys()].join(", ")}`,
    );
  }
  return { headless, todas: porNombre };
}

const COP = new Intl.NumberFormat("es-CO");

function plan() {
  let variantes = 0;
  for (const producto of UNIDADES) {
    console.log(`\n  ${producto.title}`);
    console.log(`    handle ${producto.handle}  ·  $${COP.format(producto.precio)} c/u`);
    console.log(`    etiquetas: ${producto.tags.join(", ")}  ·  tipo: ${producto.productType}`);
    for (const sabor of producto.sabores) {
      console.log(`      · ${(sabor.nombre ?? "variante única").padEnd(30)} ${sabor.barcode}  ${sabor.sku}`);
      variantes += 1;
    }
  }
  console.log(`\n  ${UNIDADES.length} productos, ${variantes} variantes.`);
  console.log(`  Se publicarían solo en "${CANAL_HEADLESS}" y nacerían con stock 0.`);
}

async function aplicar() {
  const { headless } = await publicaciones();
  for (const producto of UNIDADES) {
    const data = await graphql(PRODUCT_SET, {
      input: entrada(producto),
      identifier: { handle: producto.handle },
    });
    const errores = data.productSet.userErrors;
    if (errores.length > 0) {
      throw new Error(`${producto.handle}: ${JSON.stringify(errores)}`);
    }
    const creado = data.productSet.product;

    await graphql(PUBLICAR, {
      id: creado.id,
      input: [{ publicationId: headless }],
    });

    /* Cinturón además del tirante: si Shopify o alguien lo publicó en otro
       canal, se retira. El catálogo de la tienda online y el feed de Google
       son justo las dos superficies donde una unidad suelta no debe salir. */
    const estado = await graphql(ESTADO, { handle: producto.handle });
    const sobrantes = estado.productByIdentifier.resourcePublications.nodes
      .filter((rp) => rp.isPublished && rp.publication.id !== headless)
      .map((rp) => ({ id: rp.publication.id, nombre: nombreCanal(rp.publication) }));
    if (sobrantes.length > 0) {
      await graphql(DESPUBLICAR, {
        id: creado.id,
        input: sobrantes.map((canal) => ({ publicationId: canal.id })),
      });
      console.log(`  ${producto.handle}: retirado de ${sobrantes.map((c) => c.nombre).join(", ")}`);
    }

    console.log(
      `  ✓ ${producto.handle} · ${creado.variants.nodes.length} variantes · solo ${CANAL_HEADLESS}`,
    );
  }
}

async function verificar() {
  const problemas = [];
  const { headless } = await publicaciones();
  for (const producto of UNIDADES) {
    const data = await graphql(ESTADO, { handle: producto.handle });
    const p = data.productByIdentifier;
    if (p === null) {
      problemas.push(`${producto.handle}: no existe en Shopify.`);
      continue;
    }

    if (!p.tags.map((t) => t.toLowerCase().trim()).includes(TAG_UNIDAD)) {
      problemas.push(`${producto.handle}: SIN la etiqueta "${TAG_UNIDAD}" — saldría en el catálogo.`);
    }

    const canales = p.resourcePublications.nodes.filter((rp) => rp.isPublished);
    const otros = canales.filter((rp) => rp.publication.id !== headless);
    if (!canales.some((rp) => rp.publication.id === headless)) {
      problemas.push(`${producto.handle}: no está en "${CANAL_HEADLESS}"; el armador no lo verá.`);
    }
    if (otros.length > 0) {
      problemas.push(
        `${producto.handle}: publicado también en ${otros.map((rp) => nombreCanal(rp.publication)).join(", ")}.`,
      );
    }

    const esperados = new Map(producto.sabores.map((s) => [s.barcode, producto.precio]));
    for (const variante of p.variants.nodes) {
      const precio = esperados.get(variante.barcode);
      if (precio === undefined) {
        problemas.push(`${producto.handle}: variante "${variante.title}" con barcode inesperado (${variante.barcode}).`);
      } else if (Math.round(Number(variante.price)) !== precio) {
        problemas.push(`${producto.handle} / ${variante.title}: $${variante.price} en vez de $${precio}.`);
      }
      esperados.delete(variante.barcode);
    }
    for (const barcode of esperados.keys()) {
      problemas.push(`${producto.handle}: falta la variante con barcode ${barcode}.`);
    }

    const stock = p.variants.nodes.reduce((a, v) => a + (v.inventoryQuantity ?? 0), 0);
    console.log(
      `  ${p.handle.padEnd(38)} ${String(p.variants.nodes.length).padStart(2)} var · ${canales.map((rp) => nombreCanal(rp.publication)).join(", ") || "SIN CANAL"} · stock ${stock}`,
    );
  }

  /* La otra mitad: lo que ve la web. Las unidades tienen que llegar por la
     Storefront API (si no, el armador se queda sin nada que ofrecer) y todas
     tienen que traer la etiqueta que las esconde del catálogo. */
  if (STOREFRONT_TOKEN) {
    const res = await fetch(`https://${STORE}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: "{products(first:250){nodes{handle tags}}}" }),
    });
    const json = await res.json();
    const nodos = json.data?.products?.nodes ?? [];
    const handles = new Set(UNIDADES.map((u) => u.handle));
    const vistas = nodos.filter((n) => handles.has(n.handle));
    const sinEtiqueta = vistas.filter(
      (n) => !n.tags.map((t) => t.toLowerCase().trim()).includes(TAG_UNIDAD),
    );
    console.log(
      `\n  Storefront API: ${vistas.length}/${UNIDADES.length} unidades visibles para el armador, ${nodos.length} productos en total.`,
    );
    if (vistas.length !== UNIDADES.length) {
      problemas.push("Alguna unidad no llega por la Storefront API; el armador no podría venderla.");
    }
    for (const n of sinEtiqueta) {
      problemas.push(`${n.handle}: la web lo vería como producto de catálogo.`);
    }
  } else {
    console.log("\n  (Sin SHOPIFY_STOREFRONT_TOKEN: no se comprobó lo que ve la web.)");
  }

  return problemas;
}

/* ------------------------------------------------------------------ */

const modo = process.argv[2] ?? "plan";

const problemasDatos = revisarDatos();
if (problemasDatos.length > 0) {
  console.error("Los datos del script están mal, no se tocó la tienda:");
  for (const p of problemasDatos) console.error(`  · ${p}`);
  process.exit(1);
}

if (modo === "plan") {
  console.log(`Plan para ${STORE} (no se escribe nada):`);
  plan();
  console.log("\n  Para aplicarlo: pnpm unidades:aplicar");
} else if (modo === "aplicar") {
  console.log(`Creando las unidades en ${STORE}:`);
  await aplicar();
  console.log("\nListo. Falta que Operaciones cargue stock y fotos: hasta entonces salen agotadas.");
  console.log("Comprobar con: pnpm unidades:verificar");
} else if (modo === "verificar") {
  console.log(`Estado en ${STORE}:`);
  const problemas = await verificar();
  if (problemas.length === 0) {
    console.log("\n✓ Todo en orden: existen, están solo en el canal headless y la web las esconde del catálogo.");
  } else {
    console.error(`\n✗ ${problemas.length} problema(s):`);
    for (const p of problemas) console.error(`  · ${p}`);
    process.exit(1);
  }
} else {
  console.error(`Modo desconocido "${modo}". Usa: plan | aplicar | verificar`);
  process.exit(1);
}
