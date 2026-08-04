import { readFile, writeFile } from "node:fs/promises";

const reviews = JSON.parse(
  await readFile(new URL("../src/data/reviews.json", import.meta.url), "utf8"),
);
const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN;

if (storeDomain === undefined || storefrontToken === undefined) {
  throw new Error("Faltan SHOPIFY_STORE_DOMAIN y SHOPIFY_STOREFRONT_TOKEN");
}

const response = await fetch(`https://${storeDomain}/api/2026-01/graphql.json`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Shopify-Storefront-Access-Token": storefrontToken,
  },
  body: JSON.stringify({
    query: "{ products(first: 100) { nodes { handle } } }",
  }),
});
const payload = await response.json();
const products = payload.data?.products?.nodes;

if (!response.ok || !Array.isArray(products)) {
  throw new Error(`No se pudieron consultar los productos de Shopify (${response.status})`);
}

const productHandles = new Set(products.map((product) => product.handle));

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function reviewDate(isoDate) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

const headers = [
  "title",
  "body",
  "rating",
  "review_date",
  "reviewer_name",
  "reviewer_email",
  "product_handle",
  "curated",
];
const importable = reviews.filter((review) => productHandles.has(review.handle));
const rows = importable.map((review) => [
  "",
  review.text,
  review.rating,
  reviewDate(review.date),
  review.reviewer,
  "",
  review.handle,
  "ok",
]);
const csv = [headers, ...rows]
  .map((row) => row.map(csvCell).join(","))
  .join("\n");

await writeFile(
  new URL("../shopify-import/judgeme-reviews.csv", import.meta.url),
  `${csv}\n`,
);

const skipped = reviews.length - importable.length;
console.log(
  `CSV de Judge.me preparado: ${importable.length} reseñas${skipped > 0 ? ` · ${skipped} omitidas porque el producto ya no existe` : ""}`,
);
