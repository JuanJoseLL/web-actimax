import { cacheLife, cacheTag } from "next/cache";
import localCatalog from "@/data/catalog.json";
import {
  DEPORTE_LABELS,
  isMomento,
  isProductType,
  type Product,
} from "@/lib/taxonomia";

export * from "@/lib/taxonomia";

/* ------------------------------------------------------------------ */
/* Fuente de datos: Shopify Storefront API con respaldo local.         */
/* Si la tienda Shopify aún no tiene productos (o falla la red), el    */
/* sitio sigue funcionando con el catálogo extraído de WooCommerce.    */
/* ------------------------------------------------------------------ */

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";

const PRODUCTS_QUERY = /* GraphQL */ `
  {
    products(first: 100) {
      nodes {
        id
        handle
        title
        descriptionHtml
        availableForSale
        tags
        images(first: 12) {
          nodes {
            url
          }
        }
        variants(first: 1) {
          nodes {
            id
            price {
              amount
            }
            compareAtPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string | null;
  availableForSale: boolean;
  tags: string[];
  images: { nodes: Array<{ url: string }> };
  variants: {
    nodes: Array<{
      id: string;
      price: { amount: string };
      compareAtPrice: { amount: string } | null;
    }>;
  };
}

const RECOMENDACIONES_MARKER = /<h3>\s*Recomendaciones de uso\s*<\/h3>|<p>\s*<b>\s*Recomendaciones de uso/i;

function stripTags(htmlStr: string): string {
  return htmlStr
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapShopifyProduct(node: ShopifyProductNode): Product {
  const body = node.descriptionHtml ?? "";
  const match = body.match(RECOMENDACIONES_MARKER);
  const splitAt = match?.index ?? -1;
  const shortDescriptionHtml = splitAt >= 0 ? body.slice(0, splitAt) : body;
  const descriptionHtml = splitAt >= 0 ? body.slice(splitAt) : "";

  const variant = node.variants.nodes[0];
  const price = variant !== undefined ? Math.round(parseFloat(variant.price.amount)) : 0;
  const compareAt =
    variant?.compareAtPrice != null ? Math.round(parseFloat(variant.compareAtPrice.amount)) : price;
  const regularPrice = Math.max(price, compareAt);

  const tags = node.tags.map((t) => t.toLowerCase().trim());
  const type = tags.find(isProductType) ?? null;

  return {
    id: node.id,
    variantId: variant?.id ?? null,
    handle: node.handle,
    title: node.title,
    type,
    momentos: tags.filter(isMomento),
    deportes: tags.filter((t) => t in DEPORTE_LABELS),
    price,
    regularPrice,
    onSale: regularPrice > price,
    inStock: node.availableForSale,
    excerpt: stripTags(shortDescriptionHtml).slice(0, 280),
    shortDescriptionHtml,
    descriptionHtml,
    images: node.images.nodes.map((img) => img.url),
  };
}

async function fetchShopifyProducts(): Promise<Product[] | null> {
  if (STORE_DOMAIN === undefined || STOREFRONT_TOKEN === undefined) {
    return null;
  }
  try {
    const res = await fetch(
      `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({ query: PRODUCTS_QUERY }),
      },
    );
    if (!res.ok) {
      console.error(`Shopify respondió ${res.status}; usando catálogo local.`);
      return null;
    }
    const json: { data?: { products?: { nodes?: ShopifyProductNode[] } } } =
      await res.json();
    const nodes = json.data?.products?.nodes;
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return null;
    }
    // Solo productos etiquetados con el vocabulario de la tienda (tipo,
    // momento o deporte): deja fuera los de ejemplo que trae Shopify.
    const products = nodes
      .map(mapShopifyProduct)
      .filter((p) => p.type !== null || p.momentos.length > 0 || p.deportes.length > 0);
    return products.length > 0 ? products : null;
  } catch (err) {
    console.error("No se pudo leer de Shopify; usando catálogo local.", err);
    return null;
  }
}

interface LocalProduct extends Omit<Product, "id" | "type" | "momentos"> {
  id: number;
  type: string;
  momentos: string[];
}

function localProducts(): Product[] {
  return (localCatalog as LocalProduct[]).map((p) => ({
    ...p,
    id: String(p.id),
    variantId: null,
    type: isProductType(p.type) ? p.type : null,
    momentos: p.momentos.filter(isMomento),
  }));
}

/**
 * Catálogo completo, cacheado con stale-while-revalidate: las páginas se
 * sirven al instante y el catálogo se refresca en segundo plano cada 30 s.
 * Para forzar el refresco inmediato: GET /api/revalidar
 */
export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 30, revalidate: 30, expire: 86400 });

  const fromShopify = await fetchShopifyProducts();
  if (fromShopify === null) {
    // Respaldo local: que no quede cacheado mucho tiempo, reintenta pronto.
    cacheLife({ stale: 10, revalidate: 10, expire: 60 });
    return localProducts();
  }
  return fromShopify;
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((p) => p.handle === handle);
}

export async function getProducts(handles: string[]): Promise<Product[]> {
  const all = await getAllProducts();
  const byHandle = new Map(all.map((p) => [p.handle, p]));
  return handles
    .map((h) => byHandle.get(h))
    .filter((p): p is Product => p !== undefined);
}
