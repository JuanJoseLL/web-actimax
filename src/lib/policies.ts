import { cacheLife, cacheTag } from "next/cache";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";

/**
 * Ranuras de política que Shopify expone por Storefront API. No hay ninguna
 * para cookies —ni para el aviso legal, que solo existe en la Admin API—, así
 * que ese texto vive en el repo (ver src/data/politicas.ts).
 */
export type PolicySlot =
  | "refundPolicy"
  | "privacyPolicy"
  | "shippingPolicy"
  | "termsOfService";

export interface StorePolicy {
  title: string;
  bodyHtml: string;
}

const POLICIES_QUERY = /* GraphQL */ `
  query ShopPolicies {
    shop {
      refundPolicy { title body }
      privacyPolicy { title body }
      shippingPolicy { title body }
      termsOfService { title body }
    }
  }
`;

interface PolicyNode {
  title: string;
  body: string;
}

type PoliciesResponse = {
  data?: { shop?: Record<PolicySlot, PolicyNode | null> };
};

const SLOTS: PolicySlot[] = [
  "refundPolicy",
  "privacyPolicy",
  "shippingPolicy",
  "termsOfService",
];

/** Las políticas se administran en Shopify (Configuración → Políticas). */
export async function getStorePolicies(): Promise<Partial<Record<PolicySlot, StorePolicy>>> {
  "use cache";
  cacheTag("policies");
  /* Una política se edita dos veces al año, y ahora son cinco páginas las que
     se reescribirían en cada revalidación. Con /api/revalidar para adelantar
     un cambio, una hora de ventana solo gastaría escrituras de ISR. */
  cacheLife({ stale: 86400, revalidate: 86400, expire: 604800 });

  if (STORE_DOMAIN === undefined || STOREFRONT_TOKEN === undefined) return {};

  try {
    const response = await fetch(`https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: POLICIES_QUERY }),
    });
    if (!response.ok) return {};

    const result: PoliciesResponse = await response.json();
    const shop = result.data?.shop;
    if (shop === undefined) return {};

    const policies: Partial<Record<PolicySlot, StorePolicy>> = {};
    for (const slot of SLOTS) {
      const node = shop[slot];
      if (node === null || node === undefined) continue;
      /* La política autogestionada por Shopify llega como plantilla Liquid
         sin renderizar ({{ shop_name }}); no es contenido publicable. */
      if (node.body.trim() === "" || node.body.includes("{{")) continue;
      policies[slot] = { title: node.title, bodyHtml: node.body };
    }
    return policies;
  } catch {
    return {};
  }
}

/**
 * Una sola política. Comparte la petición cacheada de getStorePolicies, así
 * que las cinco páginas legales no son cinco viajes a Shopify.
 */
export async function getStorePolicy(slot: PolicySlot): Promise<StorePolicy | undefined> {
  return (await getStorePolicies())[slot];
}
