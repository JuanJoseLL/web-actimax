/**
 * Decidir qué invalidar cuando llega un webhook de Shopify.
 *
 * Lógica pura y sin dependencias de servidor, para poder probarla: la ruta
 * /api/revalidar solo la orquesta.
 */

import type { Product } from "@/lib/taxonomia";

/**
 * Qué etiquetas de caché toca cada tema de webhook.
 *
 * Ojo con `catalog`: no alcanza solo a las páginas de producto. El layout
 * raíz lee getAllProducts() para la paleta de búsqueda y el upsell del
 * carrito, así que la etiqueta viaja al prerender de casi todas las rutas
 * del sitio —los ~90 artículos del blog incluidos—. Se puede comprobar en
 * la cabecera `x-next-cache-tags` de cualquier .meta de .next/server/app.
 * Separar `blog` de `catalog` acá no reduce ese alcance; lo único que lo
 * reduce de verdad es no invalidar cuando no hace falta.
 */
export function tagsPorTopic(topic: string): string[] {
  if (topic.startsWith("articles/") || topic.startsWith("blogs/")) return ["blog"];
  if (topic.startsWith("products/") || topic.startsWith("collections/")) return ["catalog"];
  return ["catalog", "blog"];
}

/**
 * Handle del producto que viene en el cuerpo del webhook, si lo trae.
 *
 * Devuelve null ante cualquier duda (cuerpo que no es JSON, sin `handle`):
 * quien llama debe interpretarlo como "no sé de qué producto hablas" e
 * invalidar igual. Equivocarse hacia el lado caro es recuperable; dejar la
 * web mostrando un precio viejo, no.
 */
export function handleDelPayload(body: string): string | null {
  try {
    const payload: unknown = JSON.parse(body);
    if (typeof payload !== "object" || payload === null) return null;
    const { handle } = payload as { handle?: unknown };
    return typeof handle === "string" && handle !== "" ? handle : null;
  } catch {
    return null;
  }
}

/**
 * JSON con las claves ordenadas, para que dos objetos con los mismos datos
 * den la misma cadena aunque se hayan construido en distinto orden (el
 * respaldo local de catalog.ts arma los productos campo por campo, no con el
 * mismo literal que el mapeo de Shopify).
 */
function estable(valor: unknown): string {
  if (Array.isArray(valor)) return `[${valor.map(estable).join(",")}]`;
  if (typeof valor === "object" && valor !== null) {
    const pares = Object.entries(valor as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([clave, v]) => `${JSON.stringify(clave)}:${estable(v)}`);
    return `{${pares.join(",")}}`;
  }
  return JSON.stringify(valor) ?? "null";
}

/**
 * Huella de todo lo que la web dibuja de un producto.
 *
 * Se compara el objeto Product entero a propósito, en vez de una lista de
 * campos elegidos a mano: Product es exactamente lo que consumen las páginas,
 * así que cualquier campo que se agregue mañana entra solo en la comparación.
 * Una lista a mano se queda desactualizada en silencio y el fallo sería el
 * peor posible —no invalidar algo que sí cambió—.
 */
export function huellaProducto(producto: Product | undefined): string {
  return producto === undefined ? "" : estable(producto);
}

/**
 * ¿Cambió algo de lo que la web muestra de este producto?
 *
 * `cacheado` es lo que están dibujando las páginas ahora mismo; `fresco`, lo
 * que Shopify acaba de responder. Ambos tienen que salir del mismo mapeo
 * (mapShopifyProduct) o la comparación no significa nada.
 */
export function cambioVisible(
  cacheado: Product | undefined,
  fresco: Product | undefined,
): boolean {
  return huellaProducto(cacheado) !== huellaProducto(fresco);
}
