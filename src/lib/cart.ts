export interface CartLineIdentity {
  variantId: string | null;
  handle: string;
}

/** Shopify distingue líneas por variante; el respaldo local solo tiene handle. */
export function cartLineId(line: CartLineIdentity): string {
  return line.variantId ?? line.handle;
}

/** Largo máximo de la nota del pedido; la ruta de checkout recorta lo que pase. */
export const NOTA_MAX = 500;
