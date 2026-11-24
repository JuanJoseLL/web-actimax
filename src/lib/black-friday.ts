/**
 * Black Friday 2026: 20% menos en los productos en caja y en tarro, del lunes
 * 23 de noviembre a las 6 p. m. hasta la medianoche del domingo 29 (hora de
 * Colombia). NO entran los kits (etiqueta `kits`) ni las unidades sueltas de
 * "Arma tu kit" (etiqueta `unidad`): así lo pidió Operaciones.
 *
 * El descuento se hace en el PRECIO de Shopify, no con un descuento
 * automático: la web, el carrito, el checkout y los feeds de Google y Meta
 * leen `price` y `compareAtPrice`, así que con eso todo queda tachado y
 * coherente sin tocar la lógica de precios. (Un descuento automático solo
 * aparece en el checkout, y la app no tiene el scope de descuentos.)
 *
 * Shopify Basic no programa precios, así que la entrada y la salida las hace
 * el cron de /api/cron/black-friday (vercel.json). Los precios de antes y de
 * la promo quedan fijados en src/data/black-friday-precios.json, que arma
 * `pnpm blackfriday:plan`: nadie recalcula nada a la hora de aplicar.
 *
 * Este módulo no importa nada del proyecto a propósito: lo usan la ruta de
 * Next y el script de Node (que carga el .ts directo, sin alias `@/`).
 */

export const BLACK_FRIDAY = {
  /** Lunes 23 de noviembre, 6:00 p. m. en Colombia. */
  inicio: "2026-11-23T18:00:00-05:00",
  /** Medianoche del domingo 29: el primer instante del lunes 30. */
  fin: "2026-11-30T00:00:00-05:00",
  porcentaje: 20,
} as const;

/**
 * Cuánto tiempo después del cierre el cron todavía se anima a devolver los
 * precios. Pasado eso no hace nada: un cron con fecha fija vuelve a dispararse
 * el año siguiente, y pisar los precios de 2027 con los de 2026 sería peor que
 * cualquier promo sin bajar.
 */
const VENTANA_REVERSION_MS = 72 * 3_600_000;

export type FaseBlackFriday = "antes" | "activa" | "revertir" | "fuera";

export function faseBlackFriday(ahora: Date): FaseBlackFriday {
  const t = ahora.getTime();
  const inicio = Date.parse(BLACK_FRIDAY.inicio);
  const fin = Date.parse(BLACK_FRIDAY.fin);
  if (t < inicio) return "antes";
  if (t < fin) return "activa";
  if (t < fin + VENTANA_REVERSION_MS) return "revertir";
  return "fuera";
}

/** Precio con el descuento, en pesos enteros. */
export function precioPromo(precio: number, porcentaje: number): number {
  return Math.round((precio * (100 - porcentaje)) / 100);
}

export interface PreciosVariante {
  price: number;
  /** null = sin precio comparativo (el producto no estaba en oferta). */
  compareAt: number | null;
}

export interface VarianteSnapshot {
  id: string;
  title: string;
  antes: PreciosVariante;
  promo: PreciosVariante;
}

export interface ProductoSnapshot {
  id: string;
  handle: string;
  title: string;
  variants: VarianteSnapshot[];
}

export interface ProductoAdmin {
  id: string;
  handle: string;
  title: string;
  variants: Array<{
    id: string;
    title: string;
    price: string;
    compareAtPrice: string | null;
  }>;
}

/**
 * Fija el antes y el después de cada variante.
 *
 * El 20% sale del precio de venta de hoy. Si el producto ya estaba en oferta
 * (casi todos los Energy Packs), conserva su precio comparativo, que es más
 * alto: el tachado muestra el precio de lista de verdad y el descuento que se
 * ve es mayor que 20%.
 */
export function armarSnapshot(
  productos: ProductoAdmin[],
  porcentaje: number,
): ProductoSnapshot[] {
  return productos.map((producto) => ({
    id: producto.id,
    handle: producto.handle,
    title: producto.title,
    variants: producto.variants.map((variante) => {
      const price = Math.round(Number(variante.price));
      const compareAt =
        variante.compareAtPrice === null ? null : Math.round(Number(variante.compareAtPrice));
      const yaEnOferta = compareAt !== null && compareAt > price;
      return {
        id: variante.id,
        title: variante.title,
        antes: { price, compareAt },
        promo: {
          price: precioPromo(price, porcentaje),
          compareAt: yaEnOferta ? compareAt : price,
        },
      };
    }),
  }));
}

export type Graphql = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;

export type ModoPrecios = "aplicar" | "revertir";

export interface ResultadoPrecios {
  modo: ModoPrecios;
  /** Variantes cuyo precio se cambió en esta corrida. */
  cambiadas: number;
  /** Ya estaban en el precio de destino: correr dos veces no hace daño. */
  yaEstaban: number;
  /** No se tocaron: ver `avisos`. */
  omitidas: number;
  avisos: string[];
}

const PRECIOS_ACTUALES = /* GraphQL */ `
  query PreciosActuales($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        variants(first: 100) {
          nodes {
            id
            price
          }
        }
      }
    }
  }
`;

const CAMBIAR_PRECIOS = /* GraphQL */ `
  mutation CambiarPrecios($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Lleva los precios de Shopify a los de la promo (`aplicar`) o a los de antes
 * (`revertir`), mirando primero cómo están hoy.
 *
 * Solo mueve una variante si está exactamente en el precio de partida que
 * dice el snapshot. Si alguien la cambió a mano entre tanto, se deja quieta y
 * se avisa: esa persona sabe algo que este archivo no.
 */
export async function sincronizarPrecios(
  graphql: Graphql,
  snapshot: ProductoSnapshot[],
  modo: ModoPrecios,
): Promise<ResultadoPrecios> {
  const resultado: ResultadoPrecios = { modo, cambiadas: 0, yaEstaban: 0, omitidas: 0, avisos: [] };

  const actuales = await graphql<{
    nodes: Array<{ id?: string; variants?: { nodes: Array<{ id: string; price: string }> } } | null>;
  }>(PRECIOS_ACTUALES, { ids: snapshot.map((producto) => producto.id) });

  const precioHoy = new Map<string, number>();
  for (const nodo of actuales.nodes) {
    for (const variante of nodo?.variants?.nodes ?? []) {
      precioHoy.set(variante.id, Math.round(Number(variante.price)));
    }
  }

  for (const producto of snapshot) {
    const cambios: Array<{ id: string; price: string; compareAtPrice: string | null }> = [];

    for (const variante of producto.variants) {
      const destino = modo === "aplicar" ? variante.promo : variante.antes;
      const partida = modo === "aplicar" ? variante.antes : variante.promo;
      const hoy = precioHoy.get(variante.id);
      const nombre = `${producto.handle} (${variante.title})`;

      if (hoy === undefined) {
        resultado.omitidas += 1;
        resultado.avisos.push(`${nombre}: la variante ya no existe en Shopify.`);
      } else if (hoy === destino.price) {
        resultado.yaEstaban += 1;
      } else if (hoy !== partida.price) {
        resultado.omitidas += 1;
        resultado.avisos.push(
          `${nombre}: está en ${hoy}, se esperaba ${partida.price}. Alguien la cambió a mano; no se tocó.`,
        );
      } else {
        cambios.push({
          id: variante.id,
          price: String(destino.price),
          compareAtPrice: destino.compareAt === null ? null : String(destino.compareAt),
        });
      }
    }

    if (cambios.length === 0) continue;

    /* Un producto que falla no frena a los demás: mejor 32 de 33 a tiempo
       que ninguno. */
    try {
      const respuesta = await graphql<{
        productVariantsBulkUpdate: { userErrors: Array<{ message: string }> };
      }>(CAMBIAR_PRECIOS, { productId: producto.id, variants: cambios });
      const errores = respuesta.productVariantsBulkUpdate.userErrors;
      if (errores.length > 0) throw new Error(errores.map((error) => error.message).join("; "));
      resultado.cambiadas += cambios.length;
    } catch (error) {
      resultado.omitidas += cambios.length;
      resultado.avisos.push(
        `${producto.handle}: Shopify rechazó el cambio (${error instanceof Error ? error.message : String(error)}).`,
      );
    }
  }

  return resultado;
}
