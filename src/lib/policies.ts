import { cacheLife, cacheTag } from "next/cache";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";

export interface StorePolicy {
  /** Ancla histórica de WordPress: el sitio viejo enlazaba #devolucion, #privacidad y #envios. */
  anchor: string;
  title: string;
  bodyHtml: string;
}

const POLICIES_QUERY = /* GraphQL */ `
  query ShopPolicies {
    shop {
      refundPolicy { title body }
      privacyPolicy { title body }
      shippingPolicy { title body }
    }
  }
`;

interface PolicyNode {
  title: string;
  body: string;
}

interface PoliciesResponse {
  data?: {
    shop?: {
      refundPolicy: PolicyNode | null;
      privacyPolicy: PolicyNode | null;
      shippingPolicy: PolicyNode | null;
    };
  };
}

/** Las políticas se administran en Shopify (Configuración → Políticas). */
export async function getStorePolicies(): Promise<StorePolicy[]> {
  "use cache";
  cacheTag("policies");
  cacheLife({ stale: 3600, revalidate: 3600, expire: 604800 });

  if (STORE_DOMAIN === undefined || STOREFRONT_TOKEN === undefined) return [];

  try {
    const response = await fetch(`https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: POLICIES_QUERY }),
    });
    if (!response.ok) return [];

    const result: PoliciesResponse = await response.json();
    const shop = result.data?.shop;
    if (shop === undefined) return [];

    return [
      { anchor: "devolucion", node: shop.refundPolicy },
      { anchor: "privacidad", node: shop.privacyPolicy },
      { anchor: "envios", node: shop.shippingPolicy },
    ]
      .filter(
        (section): section is { anchor: string; node: PolicyNode } =>
          section.node !== null &&
          section.node.body.trim() !== "" &&
          /* La política autogestionada por Shopify llega como plantilla Liquid
             sin renderizar ({{ shop_name }}); no es contenido publicable. */
          !section.node.body.includes("{{"),
      )
      .map((section) => ({
        anchor: section.anchor,
        title: section.node.title,
        bodyHtml: section.node.body,
      }));
  } catch {
    return [];
  }
}
