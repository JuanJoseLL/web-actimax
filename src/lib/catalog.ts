import { cacheLife, cacheTag } from "next/cache";
import localCatalog from "@/data/catalog.json";
import { descriptionFields } from "./description";
import {
  DEPORTE_LABELS,
  isMomento,
  isProductType,
  type Product,
  type ProductOption,
  type ProductOptionValue,
  type ProductVariant,
} from "@/lib/taxonomia";
import { initialProductVariant } from "@/lib/product-variants";

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
        options {
          name
          values
        }
        variants(first: 100) {
          nodes {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
            }
            compareAtPrice {
              amount
            }
            image {
              url
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
  options: ProductOption[];
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      selectedOptions: ProductOptionValue[];
      price: { amount: string };
      compareAtPrice: { amount: string } | null;
      image: { url: string } | null;
    }>;
  };
}


function prices(
  priceValue: string | number,
  compareAtValue?: string | number | null,
): Pick<ProductVariant, "price" | "regularPrice" | "onSale"> {
  const parsedPrice = Number(priceValue);
  const price = Number.isFinite(parsedPrice) ? Math.round(parsedPrice) : 0;
  const parsedCompareAt = Number(compareAtValue);
  const compareAt = Number.isFinite(parsedCompareAt)
    ? Math.round(parsedCompareAt)
    : price;
  const regularPrice = Math.max(price, compareAt);
  return { price, regularPrice, onSale: regularPrice > price };
}

function mapShopifyProduct(node: ShopifyProductNode): Product {
  const variants: ProductVariant[] = node.variants.nodes.map((variant) => ({
    id: variant.id,
    title: variant.title,
    options: variant.selectedOptions,
    ...prices(variant.price.amount, variant.compareAtPrice?.amount),
    inStock: variant.availableForSale,
    image: variant.image?.url ?? null,
  }));
  const variant = initialProductVariant(variants);
  const price = variant?.price ?? 0;
  const regularPrice = variant?.regularPrice ?? price;

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
    onSale: variant?.onSale ?? false,
    inStock: variant?.inStock ?? node.availableForSale,
    ...descriptionFields(node.descriptionHtml ?? ""),
    images: node.images.nodes.map((img) => img.url),
    options: node.options,
    variants,
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

interface LocalVariant {
  id?: string | number | null;
  title?: string;
  options?: ProductOptionValue[];
  selectedOptions?: ProductOptionValue[];
  price: number | string;
  regularPrice?: number | string;
  compareAtPrice?: number | string | null;
  onSale?: boolean;
  inStock?: boolean;
  availableForSale?: boolean;
  image?: string | null;
}

interface LocalProduct extends Omit<Product, "id" | "variantId" | "type" | "momentos" | "options" | "variants" | "descriptionKind"> {
  id: number;
  type: string;
  momentos: string[];
  options?: ProductOption[];
  variants?: LocalVariant[];
}

function localVariantId(id: LocalVariant["id"]): string | null {
  return typeof id === "string" &&
    id.startsWith("gid://shopify/ProductVariant/")
    ? id
    : null;
}

function localProducts(): Product[] {
  return (localCatalog as LocalProduct[]).map((p) => {
    const variants: ProductVariant[] =
      p.variants !== undefined && p.variants.length > 0
        ? p.variants.map((variant) => ({
            id: localVariantId(variant.id),
            title: variant.title ?? "Default Title",
            options: variant.options ?? variant.selectedOptions ?? [],
            ...prices(
              variant.price,
              variant.regularPrice ?? variant.compareAtPrice,
            ),
            inStock:
              variant.inStock ?? variant.availableForSale ?? p.inStock,
            image: variant.image ?? null,
          }))
        : [
            {
              id: null,
              title: "Default Title",
              options: [],
              price: p.price,
              regularPrice: p.regularPrice,
              onSale: p.onSale,
              inStock: p.inStock,
              image: p.images[0] ?? null,
            },
          ];
    const variant = initialProductVariant(variants);

    return {
      ...p,
      /* El JSON local guarda la partición vieja (solo por marcador);
         re-partir el cuerpo completo aplica las mismas reglas que Shopify. */
      ...descriptionFields(p.shortDescriptionHtml + p.descriptionHtml),
      id: String(p.id),
      variantId: variant?.id ?? null,
      type: isProductType(p.type) ? p.type : null,
      momentos: p.momentos.filter(isMomento),
      price: variant?.price ?? p.price,
      regularPrice: variant?.regularPrice ?? p.regularPrice,
      onSale: variant?.onSale ?? p.onSale,
      inStock: variant?.inStock ?? p.inStock,
      options: p.options ?? [],
      variants,
    };
  });
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
  const fallback = localProducts();
  if (fromShopify === null) {
    /* Respaldo local: que no quede cacheado mucho tiempo, reintenta pronto.
       Next se queda con el mínimo de cada campo entre todas las llamadas a
       cacheLife del mismo scope, así que esta segunda solo puede acortar la
       ventana de arriba, nunca alargarla. */
    cacheLife({ stale: 10, revalidate: 10, expire: 60 });
    return fallback;
  }
  const liveHandles = new Set(fromShopify.map((product) => product.handle));
  return [
    ...fromShopify,
    ...fallback.filter((product) => !liveHandles.has(product.handle)),
  ];
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
