/**
 * Las cuentas del armador de kits: cuántas unidades llevas, cuánto cuesta y
 * qué falta para la carrera completa y para el envío gratis.
 *
 * Lógica pura y sin React para poder probarla; la página solo la dibuja.
 */
/* Imports relativos: vitest no resuelve el alias "@/" y este módulo tiene
   test propio (arma-kit.test.ts). */
import { ENVIO_GRATIS_UMBRAL } from "./envio";
import { MOMENTO_LABELS, type Momento, type ProductType } from "./taxonomia";

/**
 * Una unidad suelta, tal como la necesita el armador.
 *
 * Es un Product recortado a lo que se dibuja: el armador no muestra ficha,
 * ni reseñas, ni descripción larga, y mandar el catálogo entero al cliente
 * por cada sabor no tiene sentido.
 */
export interface UnidadKit {
  handle: string;
  title: string;
  /** Qué es, en una palabra, para el encabezado de la tarjeta. */
  etiqueta: string;
  momento: Momento;
  price: number;
  /** Cómo se llama la opción que distingue las variantes ("Sabores"). */
  nombreOpcion: string;
  sabores: SaborKit[];
}

export interface SaborKit {
  variantId: string;
  /**
   * Null cuando la unidad no tiene sabores que elegir: la barra de proteína
   * existe en Shopify con una sola variante llamada "Default Title", y ese
   * nombre no puede terminar impreso en la tarjeta ni en el carrito.
   */
  nombre: string | null;
  image: string | null;
  inStock: boolean;
}

/** Cuántas unidades de cada variante lleva el kit, por id de variante. */
export type SeleccionKit = Readonly<Record<string, number>>;

/**
 * El kit que vale la pena llevar, que no es lo mismo que el kit que se
 * permite comprar.
 *
 * Seis unidades es la carrera más corta que cubre el catálogo (un 10K: pre,
 * gel y recuperación con algo de hidratación), y a ese número apunta todo lo
 * que la página sugiere. Pero es una meta, no una tranca: quien quiera probar
 * un solo gel antes de comprometerse con seis puede hacerlo, y es mejor esa
 * venta —y ese comprador que vuelve— que un carrito abandonado en la unidad
 * cinco. El envío cobrado por debajo de {@link ENVIO_GRATIS_UMBRAL} es lo que
 * sostiene el pedido pequeño.
 */
export const UNIDADES_SUGERIDAS = 6;

/** El orden en que se arma una carrera, que es el orden de la página. */
export const MOMENTOS_KIT: readonly Momento[] = ["antes", "durante", "despues"];

export const TITULO_MOMENTO: Record<Momento, string> = {
  antes: "Antes de empezar",
  durante: "Mientras entrenas",
  despues: "Para recuperarte",
};

/**
 * Qué es cada unidad, en una palabra, para el encabezado de la tarjeta.
 *
 * Los nombres del catálogo ("Bebidas deportivas", "Barras de proteína") son
 * de categoría y en plural: en una tarjeta angosta se parten en dos renglones
 * y compiten con el título del producto, que es lo que hay que leer. Acá la
 * etiqueta solo tiene que decir de qué clase de cosa se trata.
 */
export const ETIQUETA_UNIDAD: Record<ProductType, string> = {
  geles: "Gel",
  bebidas: "Bebida",
  barras: "Barra",
  kits: "Pack",
};

export const AYUDA_MOMENTO: Record<Momento, string> = {
  antes: "Prepara tu próxima salida con una bebida antes de entrenar o competir.",
  durante: "Geles y bebidas para llevar contigo. Combina sabores y guarda algunos para la próxima salida.",
  despues: "Al terminar también hay favoritos: elige tu bebida de recuperación o una barra de proteína.",
};

/**
 * El nombre de la unidad como se lee en el armador.
 *
 * Dos arreglos de presentación sobre el nombre que tiene en Shopify:
 *
 * 1. Se le quita el " — unidad" del final. Ese sufijo está para que
 *    Operaciones distinga la unidad de la caja en el listado del admin; en
 *    esta página no informa nada —todo son unidades— y mete un guion largo
 *    en titulares que ya van apretados.
 * 2. El gramaje se pega al número con un espacio duro. Las tarjetas son
 *    angostas y "Sobre Recovery Pro 37 / g" deja la "g" sola en el renglón
 *    siguiente.
 */
export function tituloUnidad(title: string): string {
  return title
    .replace(/\s*[—–-]\s*unidad(?:es)?\s*$/i, "")
    .replace(/(\d)\s+(g|ml|kg)\b/gi, "$1\u00A0$2")
    .trim();
}

export function totalUnidades(seleccion: SeleccionKit): number {
  return Object.values(seleccion).reduce((total, cantidad) => total + cantidad, 0);
}

/**
 * Cuánto cuesta el kit.
 *
 * El precio sale del catálogo, no de la selección: así una variante que ya
 * no exista suma cero en vez de arrastrar un precio viejo guardado en el
 * estado de la página.
 */
export function subtotalKit(seleccion: SeleccionKit, unidades: readonly UnidadKit[]): number {
  const precioPorVariante = new Map<string, number>();
  for (const unidad of unidades) {
    for (const sabor of unidad.sabores) {
      precioPorVariante.set(sabor.variantId, unidad.price);
    }
  }
  let subtotal = 0;
  for (const [variantId, cantidad] of Object.entries(seleccion)) {
    subtotal += (precioPorVariante.get(variantId) ?? 0) * cantidad;
  }
  return subtotal;
}

/** Cuántas unidades faltan para la carrera completa. Cero si ya la cubre. */
export function faltanParaSugerido(seleccion: SeleccionKit): number {
  return Math.max(0, UNIDADES_SUGERIDAS - totalUnidades(seleccion));
}

/** Cuánta plata falta para el envío gratis. Cero si ya lo alcanzó. */
export function faltaParaEnvioGratis(subtotal: number): number {
  return Math.max(0, ENVIO_GRATIS_UMBRAL - subtotal);
}

/**
 * Las unidades repartidas por momento de carrera, en el orden de la página.
 *
 * Se agrupa por momento y no por tipo de producto a propósito: quien arma un
 * kit piensa en "qué tomo antes, qué durante y qué después", no en "cuántos
 * geles y cuántas bebidas". Es el mismo vocabulario de /mi-plan.
 */
export function unidadesPorMomento(
  unidades: readonly UnidadKit[],
): Array<{ momento: Momento; unidades: UnidadKit[] }> {
  return MOMENTOS_KIT.map((momento) => ({
    momento,
    unidades: unidades.filter((unidad) => unidad.momento === momento),
  })).filter((grupo) => grupo.unidades.length > 0);
}

/**
 * El resumen en palabras de lo que lleva el kit: "7 unidades · antes,
 * durante, después".
 *
 * Lo lee el comprador en el panel del armador, que es donde confirma que
 * cubrió toda la carrera antes de pagar.
 *
 * La idea era que viajara además como atributo de cada línea, para que
 * Operaciones viera en el pedido que esas líneas sueltas son un kit armado y
 * no ocho compras independientes. No se puede todavía: el carrito manda a
 * Shopify solo `merchandiseId` y `quantity` por línea (ver CheckoutLine en
 * checkout-lines.ts) y los únicos atributos que existen son del carrito
 * entero, no de la línea.
 */
export function resumenKit(seleccion: SeleccionKit, unidades: readonly UnidadKit[]): string {
  const total = totalUnidades(seleccion);
  const momentos = new Set<Momento>();
  for (const unidad of unidades) {
    if (unidad.sabores.some((sabor) => (seleccion[sabor.variantId] ?? 0) > 0)) {
      momentos.add(unidad.momento);
    }
  }
  const partes = MOMENTOS_KIT.filter((momento) => momentos.has(momento)).map(
    (momento) => MOMENTO_LABELS[momento].toLocaleLowerCase("es"),
  );
  const unidadesTexto = `${total} ${total === 1 ? "unidad" : "unidades"}`;
  return partes.length > 0 ? `${unidadesTexto} · ${partes.join(", ")}` : unidadesTexto;
}
