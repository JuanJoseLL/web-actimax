/**
 * Exporta las reseñas de productos de WooCommerce al sitio nuevo.
 *
 * Usa el Store API público (sin credenciales) del sitio viejo, que sigue
 * vivo hasta el cutover de DNS. Correr antes del apagón de WordPress:
 *
 *   node scripts/export-woo-reviews.mjs
 *
 * Escribe dos archivos:
 *  - shopify-import/woo-reviews-export.json  → crudo, tal cual el API
 *  - src/data/reviews.json                   → por handle de Shopify, lo que
 *                                              renderiza la página de producto
 */
import { readFile, writeFile } from "node:fs/promises";

const WP_BASE_URL = (process.env.WP_BASE_URL ?? "https://actimax.com.co").replace(/\/$/, "");
const PER_PAGE = 100;

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchAllReviews() {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wc/store/v1/products/reviews?per_page=${PER_PAGE}&page=${page}`,
    );
    if (!res.ok) throw new Error(`Store API respondió ${res.status} en la página ${page}`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < PER_PAGE) return all;
  }
}

const reviews = await fetchAllReviews();
await writeFile(
  new URL("../shopify-import/woo-reviews-export.json", import.meta.url),
  JSON.stringify(reviews, null, 2),
);

const identities = JSON.parse(
  await readFile(new URL("../src/data/product-identities.json", import.meta.url), "utf8"),
);
const handleByWpId = new Map(identities.map((p) => [p.wordpressId, p.shopifyHandle]));

const sinProducto = new Map();
const mapeadas = [];
for (const r of reviews) {
  const handle = handleByWpId.get(r.product_id);
  if (handle === undefined) {
    sinProducto.set(r.product_id, r.product_name);
    continue;
  }
  const rating = Number(r.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) continue;
  mapeadas.push({
    handle,
    reviewer: r.reviewer,
    rating,
    /* GMT y en ISO: el componente la formatea en es-CO. */
    date: `${r.date_created_gmt}Z`,
    text: stripTags(r.review ?? ""),
    verified: r.verified === true,
  });
}
mapeadas.sort((a, b) => (a.date < b.date ? 1 : -1));

await writeFile(
  new URL("../src/data/reviews.json", import.meta.url),
  JSON.stringify(mapeadas, null, 2) + "\n",
);

console.log(`Reseñas en Woo: ${reviews.length} · mapeadas al sitio nuevo: ${mapeadas.length}`);
if (sinProducto.size > 0) {
  console.log("Sin producto equivalente (quedan solo en el export crudo):");
  for (const [id, nombre] of sinProducto) console.log(`  - wpId ${id}: ${nombre}`);
}
