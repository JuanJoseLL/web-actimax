import productIdentities from "../data/product-identities.json";
import retiredProducts from "../data/retired-products.json";

interface ProductIdentity {
  wordpressId: number;
  shopifyHandle: string;
  legacyCanonicalPath: string;
}

const identities = productIdentities as ProductIdentity[];
const byHandle = new Map(
  identities.map((identity) => [identity.shopifyHandle, identity]),
);

/**
 * Productos que WordPress publicaba y que en Shopify quedaron en borrador o
 * se borraron, con decisión de no volver a sacarlos (27 ago 2026). Su URL
 * histórica seguía indexada y daba 404; se manda al equivalente vigente o al
 * filtro de catálogo más cercano. Si alguno vuelve a publicarse, basta con
 * quitarlo de `retired-products.json` para que recupere su URL de siempre.
 */
const retired = new Map(Object.entries(retiredProducts as Record<string, string>));

const activeIdentities = identities.filter(
  (identity) => !retired.has(identity.shopifyHandle),
);

export function flatProductPath(handle: string): string {
  return `/productos/${handle}/`;
}

export function canonicalProductPath(handle: string): string {
  return byHandle.get(handle)?.legacyCanonicalPath ?? flatProductPath(handle);
}

export const legacyProductRewrites = activeIdentities
  .filter(
    (identity) =>
      identity.legacyCanonicalPath !== flatProductPath(identity.shopifyHandle),
  )
  .map((identity) => ({
    source: identity.legacyCanonicalPath,
    destination: flatProductPath(identity.shopifyHandle),
  }));

export const productAliasRedirects = activeIdentities
  .filter(
    (identity) =>
      identity.legacyCanonicalPath !== flatProductPath(identity.shopifyHandle),
  )
  .map((identity) => ({
    source: flatProductPath(identity.shopifyHandle),
    destination: identity.legacyCanonicalPath,
    permanent: true,
  }));

/**
 * Un retirado se redirige desde su URL histórica y desde su ruta plana, sin
 * pasar por la canónica (evita la cadena alias → canónica → destino).
 */
export const retiredProductRedirects = identities
  .filter((identity) => retired.has(identity.shopifyHandle))
  .flatMap((identity) => {
    const destination = retired.get(identity.shopifyHandle) as string;
    const flat = flatProductPath(identity.shopifyHandle);
    const sources =
      identity.legacyCanonicalPath === flat
        ? [flat]
        : [identity.legacyCanonicalPath, flat];
    return sources.map((source) => ({ source, destination, permanent: true }));
  });

/** WordPress enlazaba productos por ID (`/?p=123`, también con `post_type`). */
export const wordpressIdRedirects = identities.map((identity) => ({
  source: "/",
  has: [
    {
      type: "query" as const,
      key: "p",
      value: String(identity.wordpressId),
    },
  ],
  destination:
    retired.get(identity.shopifyHandle) ?? identity.legacyCanonicalPath,
  permanent: true,
}));
