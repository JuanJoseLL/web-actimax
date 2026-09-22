/**
 * La promo que abre el home.
 *
 * Marketing pide de vez en cuando subir una oferta puntual por encima del
 * catálogo ("que la gente pueda acceder a ella"). En vez de tocar el home
 * cada vez, la banda se configura acá: un handle de Shopify, el copy y la
 * fecha en que la promo deja de existir.
 *
 * Dos frenos independientes la bajan sola cuando se acaba, porque una promo
 * vencida en portada es peor que no tenerla:
 *  1. `hasta`, la fecha que fija Marketing (se revisa en horario de Colombia).
 *  2. El precio de Shopify: la banda solo se dibuja si el producto sigue
 *     publicado, con stock y con precio comparativo (o sea, en oferta).
 *     Quitar el descuento en la tienda la apaga al siguiente webhook.
 *
 * Para retirarla a mano antes de tiempo basta con dejar `PROMO_DESTACADA`
 * en `null`.
 */
export interface PromoDestacada {
  /** Handle del producto en Shopify. */
  handle: string;
  kicker: string;
  titulo: string;
  texto: string;
  cta: string;
  /** Último día de la promo en Colombia, inclusive (YYYY-MM-DD). */
  hasta: string;
  /** Cómo se lee esa fecha en la banda. */
  hastaLabel: string;
}

export const PROMO_DESTACADA: PromoDestacada | null = {
  handle: "combo-de-bebida-elite",
  kicker: "Promo de septiembre",
  titulo: "Dos Bebidas Élite, un solo precio.",
  texto:
    "Hay duplas que siempre funcionan: llévate dos tarros de Bebida Deportiva Élite con descuento y asegura la hidratación de todo el mes de entrenos.",
  cta: "Ver el combo",
  hasta: "2026-09-30",
  hastaLabel: "Hasta el 30 de septiembre",
};

/**
 * Hoy en Colombia (YYYY-MM-DD).
 *
 * El servidor corre en UTC: comparar contra la fecha del servidor apagaría la
 * promo a las 7 p. m. del último día, que es justo cuando la gente compra.
 * "en-CA" da el formato ISO ya ordenable como texto.
 */
export function hoyEnColombia(ahora: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

/** ¿La promo sigue viva hoy? El último día cuenta entero. */
export function promoVigente(
  promo: PromoDestacada | null,
  ahora: Date,
): promo is PromoDestacada {
  return promo !== null && hoyEnColombia(ahora) <= promo.hasta;
}

/**
 * Días que le quedan a la promo contando hoy: 1 es "último día".
 * Devuelve 0 si ya venció, para que quien la dibuje no muestre urgencias
 * falsas si se le olvidó consultar promoVigente().
 */
export function diasRestantes(promo: PromoDestacada, ahora: Date): number {
  const hoy = Date.parse(`${hoyEnColombia(ahora)}T00:00:00Z`);
  const fin = Date.parse(`${promo.hasta}T00:00:00Z`);
  if (Number.isNaN(fin) || fin < hoy) return 0;
  return Math.round((fin - hoy) / 86_400_000) + 1;
}
