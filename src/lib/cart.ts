export interface CartLineIdentity {
  variantId: string | null;
  handle: string;
}

/** Shopify distingue líneas por variante; el respaldo local solo tiene handle. */
export function cartLineId(line: CartLineIdentity): string {
  return line.variantId ?? line.handle;
}
