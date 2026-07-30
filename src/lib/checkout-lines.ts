/**
 * Shopify no trata el stock insuficiente como error al crear un carrito:
 * descarta la línea agotada (quantity 0) o la recorta al inventario
 * disponible, y aun así devuelve un checkoutUrl válido. Comparar lo pedido
 * contra lo concedido es la única forma de no mandar al cliente a pagar un
 * pedido distinto al que armó.
 */

export interface CheckoutLine {
  merchandiseId: string;
  quantity: number;
}

export interface ShortedLine {
  merchandiseId: string;
  requested: number;
  granted: number;
}

function totalsById(lines: CheckoutLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    totals.set(line.merchandiseId, (totals.get(line.merchandiseId) ?? 0) + line.quantity);
  }
  return totals;
}

/** Líneas que Shopify devolvió con menos unidades de las pedidas (0 = descartada). */
export function findShortedLines(
  requested: CheckoutLine[],
  granted: CheckoutLine[],
): ShortedLine[] {
  const grantedTotals = totalsById(granted);
  const shorted: ShortedLine[] = [];
  for (const [merchandiseId, want] of totalsById(requested)) {
    const got = grantedTotals.get(merchandiseId) ?? 0;
    if (got < want) shorted.push({ merchandiseId, requested: want, granted: got });
  }
  return shorted;
}

export function isShortedLine(value: unknown): value is ShortedLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.merchandiseId === "string" &&
    typeof line.requested === "number" &&
    typeof line.granted === "number"
  );
}

/** Mensaje para el comprador explicando qué no alcanzó a cubrir el inventario. */
export function shortedCartMessage(
  shorted: ShortedLine[],
  titleFor: (merchandiseId: string) => string | undefined,
): string {
  const parts = shorted.map((line) => {
    const title = titleFor(line.merchandiseId) ?? "un producto del carrito";
    if (line.granted === 0) return `${title} está agotado`;
    return `de ${title} solo ${
      line.granted === 1 ? "queda 1 unidad" : `quedan ${line.granted} unidades`
    }`;
  });
  return `No pudimos iniciar el pago: ${parts.join("; ")}. Ajusta las cantidades e inténtalo de nuevo.`;
}
