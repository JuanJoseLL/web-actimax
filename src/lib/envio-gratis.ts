/**
 * Qué producto sugerir para completar el envío gratis.
 *
 * El carrito ya dice cuánto falta; esto responde la otra mitad: con qué se
 * cierra esa brecha. La regla es "lo más barato que la cierra", con una
 * excepción deliberada: si un producto de otra categoría cuesta casi lo
 * mismo, gana ese. A quien ya lleva un Energy Pack le sirve más una bebida
 * que un segundo pack.
 */
/* Imports relativos: vitest no resuelve el alias "@/" y este módulo tiene
   test propio (envio-gratis.test.ts). */
import type { ProductOption, ProductType, ProductVariant } from "./taxonomia";

/**
 * Producto candidato a completar el pedido. Lleva variantes porque en el
 * carrito se elige el sabor sin salir del cajón; `price` es el de la
 * variante disponible más barata (hoy todos los sabores cuestan igual).
 */
export interface UpsellProduct {
  variantId: string | null;
  handle: string;
  title: string;
  type: ProductType | null;
  price: number;
  image: string | null;
  options: ProductOption[];
  variants: ProductVariant[];
}

/**
 * Hasta cuánto más caro puede ser un producto de otra categoría para que
 * todavía se prefiera sobre el más barato. Un 25% sobre el más barato es la
 * diferencia entre "te propongo la bebida en vez del pack" y "te propongo
 * algo del doble de precio".
 */
const MARGEN_COMPLEMENTO = 1.25;

/**
 * El producto que completa el envío gratis, o undefined si ninguno lo hace
 * (el carrito entonces solo muestra cuánto falta, sin prometer nada).
 *
 * Solo se proponen productos que cierran la brecha ellos solos: sugerir algo
 * que deja el pedido igual de corto es peor que no sugerir nada.
 */
export function sugerenciaEnvioGratis(
  productos: UpsellProduct[],
  handlesEnCarrito: string[],
  falta: number,
): UpsellProduct | undefined {
  if (falta <= 0) return undefined;

  const enCarrito = new Set(handlesEnCarrito);
  const candidatos = productos
    .filter((producto) => !enCarrito.has(producto.handle) && producto.price >= falta)
    .sort((a, b) => a.price - b.price || a.handle.localeCompare(b.handle));

  const masBarato = candidatos[0];
  if (masBarato === undefined) return undefined;

  const tiposEnCarrito = new Set(
    productos
      .filter((producto) => enCarrito.has(producto.handle))
      .map((producto) => producto.type),
  );
  const techo = masBarato.price * MARGEN_COMPLEMENTO;
  const complemento = candidatos.find(
    (producto) =>
      producto.price <= techo &&
      producto.type !== null &&
      !tiposEnCarrito.has(producto.type),
  );

  return complemento ?? masBarato;
}
