import productIdentities from "../data/product-identities.json";

interface ProductIdentity {
  wordpressId: number;
  shopifyHandle: string;
  legacyCanonicalPath: string;
}

const identities = productIdentities as ProductIdentity[];
const byHandle = new Map(
  identities.map((identity) => [identity.shopifyHandle, identity]),
);

export function flatProductPath(handle: string): string {
  return `/productos/${handle}/`;
}

export function canonicalProductPath(handle: string): string {
  return byHandle.get(handle)?.legacyCanonicalPath ?? flatProductPath(handle);
}

export const legacyProductRewrites = identities
  .filter(
    (identity) =>
      identity.legacyCanonicalPath !== flatProductPath(identity.shopifyHandle),
  )
  .map((identity) => ({
    source: identity.legacyCanonicalPath,
    destination: flatProductPath(identity.shopifyHandle),
  }));

export const productAliasRedirects = identities
  .filter(
    (identity) =>
      identity.legacyCanonicalPath !== flatProductPath(identity.shopifyHandle),
  )
  .map((identity) => ({
    source: flatProductPath(identity.shopifyHandle),
    destination: identity.legacyCanonicalPath,
    permanent: true,
  }));

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
  destination: identity.legacyCanonicalPath,
  permanent: true,
}));
