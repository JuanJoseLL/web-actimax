import { cacheLife, cacheTag } from "next/cache";
import localCatalog from "@/data/catalog.json";
import { descriptionFields, sinListaDeContenido } from "./description";
import {
  DEPORTE_LABELS,
  isMomento,
  isProductType,
  type Product,
  type ProductOption,
  type ProductOptionValue,
  type ProductVariant,
} from "@/lib/taxonomia";
import { contenidoDelPack, parseGuiaUso } from "@/lib/pack";
import { initialProductVariant } from "@/lib/product-variants";
import { localReviewSummary, shopifyReviewSummary } from "@/lib/reviews";

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
        reviewRating: metafield(namespace: "reviews", key: "rating") {
          value
        }
        reviewCount: metafield(namespace: "reviews", key: "rating_count") {
          value
        }
        contenido: metafield(namespace: "custom", key: "contenido") {
          value
        }
        guiaUso: metafield(namespace: "custom", key: "guia_uso") {
          value
        }
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
  reviewRating: { value: string } | null;
  reviewCount: { value: string } | null;
  /* Metafields de los packs (docs/metafields-packs.md). Llegan null mientras
     Operaciones no los cargue o si la definición no tiene acceso Storefront. */
  contenido: { value: string } | null;
  guiaUso: { value: string } | null;
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

function contenidoHtml(shortDescriptionHtml: string, contenido: string[]): string {
  return contenido.length > 0 ? sinListaDeContenido(shortDescriptionHtml) : shortDescriptionHtml;
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
  const descripcion = descriptionFields(node.descriptionHtml ?? "");
  /* La lista de la descripción solo sirve de respaldo en los kits: en un
     gel el primer <ul> son sabores o beneficios, no contenido. */
  const contenido = contenidoDelPack(
    node.contenido?.value,
    type === "kits" ? descripcion.shortDescriptionHtml : "",
  );

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
    ...descripcion,
    /* Con el bloque "Qué trae el pack" en la ficha, la misma lista dentro
       del texto corto quedaba repetida a cuatro líneas de distancia. */
    shortDescriptionHtml: contenidoHtml(descripcion.shortDescriptionHtml, contenido),
    contenido,
    guiaUso: parseGuiaUso(node.guiaUso?.value),
    images: node.images.nodes.map((img) => img.url),
    options: node.options,
    variants,
    reviewSummary: shopifyReviewSummary(
      node.reviewRating?.value,
      node.reviewCount?.value,
    ),
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

interface LocalProduct extends Omit<Product, "id" | "variantId" | "type" | "momentos" | "options" | "variants" | "descriptionKind" | "faqs" | "reviewSummary" | "contenido" | "guiaUso"> {
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
    const type = isProductType(p.type) ? p.type : null;
    /* El JSON local guarda la partición vieja (solo por marcador);
       re-partir el cuerpo completo aplica las mismas reglas que Shopify. */
    const descripcion = descriptionFields(p.shortDescriptionHtml + p.descriptionHtml);
    const contenido = contenidoDelPack(null, type === "kits" ? descripcion.shortDescriptionHtml : "");

    return {
      ...p,
      ...descripcion,
      shortDescriptionHtml: contenidoHtml(descripcion.shortDescriptionHtml, contenido),
      contenido,
      guiaUso: [],
      id: String(p.id),
      variantId: variant?.id ?? null,
      type,
      momentos: p.momentos.filter(isMomento),
      price: variant?.price ?? p.price,
      regularPrice: variant?.regularPrice ?? p.regularPrice,
      onSale: variant?.onSale ?? p.onSale,
      inStock: variant?.inStock ?? p.inStock,
      options: p.options ?? [],
      variants,
      reviewSummary: localReviewSummary(p.handle),
    };
  });
}

/**
 * Catálogo completo, cacheado con stale-while-revalidate.
 *
 * La frescura la da el webhook de Shopify (products/create|update|delete →
 * /api/revalidar), que invalida el tag `catalog` en el momento del cambio.
 * Esta ventana de 24 h es solo la red de seguridad por si una entrega del
 * webhook se pierde; no es el mecanismo principal. Para forzarlo a mano:
 * GET /api/revalidar/?clave=…
 *
 * `expire` queda por encima de `revalidate` a propósito: igualarlos elimina la
 * ventana de stale-while-revalidate y la primera visita tras vencer el plazo
 * tendría que esperar a Shopify en vez de recibir lo cacheado al instante.
 *
 * Estaba en 30 s: 2.880 revalidaciones diarias de una respuesta de ~136 KB,
 * o sea ~17 unidades de escritura ISR cada vez que el resultado cambiaba.
 * Esa era la fuga que tenía el proyecto al 90% de la cuota de Hobby.
 */
export async function getAllProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 86400, revalidate: 86400, expire: 604800 });

  const fromShopify = await fetchShopifyProducts();
  if (fromShopify === null) {
    /* Respaldo local: que no quede cacheado mucho tiempo, reintenta pronto.
       Next se queda con el mínimo de cada campo entre todas las llamadas a
       cacheLife del mismo scope, así que esta segunda solo puede acortar la
       ventana de arriba, nunca alargarla. */
    cacheLife({ stale: 10, revalidate: 10, expire: 60 });
    return localProducts();
  }
  /* Shopify es la fuente de verdad: lo que la tienda despublique (borradores,
     productos retirados) desaparece también de acá. Mezclar el catálogo local
     por handle revivía justo esos productos despublicados. */
  return fromShopify;
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((p) => p.handle === handle);
}

/**
 * El producto tal como está en Shopify ahora mismo, saltándose la caché.
 *
 * Solo lo usa /api/revalidar para decidir si un webhook trae algo que la web
 * necesite redibujar. Reusa fetchShopifyProducts() a propósito en vez de una
 * consulta más chica por handle: comparar contra getProduct() únicamente
 * tiene sentido si los dos lados pasan por el mismo mapeo y por el mismo
 * filtro de etiquetas, y a 6 webhooks al día el ahorro de traer un producto
 * en vez del catálogo no compensa el riesgo de que las dos consultas se
 * separen con el tiempo.
 *
 * Devuelve undefined tanto si el producto no existe como si Shopify falló;
 * quien llama lo interpreta como "cambió" e invalida, que es el lado seguro.
 */
export async function getProductoFresco(
  handle: string,
): Promise<Product | undefined> {
  const productos = await fetchShopifyProducts();
  return productos?.find((p) => p.handle === handle);
}

export async function getProducts(handles: string[]): Promise<Product[]> {
  const all = await getAllProducts();
  const byHandle = new Map(all.map((p) => [p.handle, p]));
  return handles
    .map((h) => byHandle.get(h))
    .filter((p): p is Product => p !== undefined);
}
