/**
 * Umbral de envío gratis en COP. Política comercial vigente: envío gratis
 * por compras iguales o superiores a $120.000 (igual que en las políticas
 * de la tienda y la barra de anuncio del header).
 */
export const ENVIO_GRATIS_UMBRAL = 120_000;

/**
 * Tiempos de entrega que ve el comprador debajo del botón de compra.
 *
 * Operaciones confirmó el 31 de agosto de 2026 que en Medellín y el área
 * metropolitana el pedido se despacha el mismo día y se entrega en 1 a 2
 * días hábiles; el resto del país sigue en los 3 a 5 días hábiles que
 * publica la política de envíos de la tienda (Shopify → Configuración →
 * Políticas), sobre un despacho dentro de los 2 días hábiles siguientes.
 *
 * La política de Shopify es la que manda legalmente y todavía dice solo "3 a
 * 5 días" y "despacho en 2 días hábiles": mientras Operaciones no le agregue
 * el tramo de Medellín, la web promete algo más rápido que el documento. Los
 * dos textos se cambian juntos, nunca uno solo.
 */
export const TIEMPO_ENTREGA =
  "Envío a toda Colombia · Medellín 1–2 días hábiles · resto 3–5";

/**
 * El "cómo" detrás del tramo rápido, en segunda línea bajo el tiempo de
 * entrega: es lo que hace creíble que un pedido de Medellín llegue a tiempo
 * para una carrera del fin de semana. Sin hora de corte porque Operaciones
 * no la ha fijado; si la fija, va aquí ("antes de las 2 p. m.").
 */
export const DESPACHO_MISMO_DIA =
  "Despacho el mismo día en el área metropolitana de Medellín";
