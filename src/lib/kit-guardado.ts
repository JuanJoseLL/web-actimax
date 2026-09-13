/**
 * El kit a medio armar, guardado en el navegador.
 *
 * Armar un kit toma varios minutos y se hace saltando entre tarjetas. Perder
 * ese trabajo por una recarga, por irse a mirar una ficha o por volver al día
 * siguiente desde el mismo teléfono es la forma más tonta de perder un
 * pedido. Sin cuentas de usuario en la web, el navegador es el único lugar
 * donde se puede dejar.
 *
 * Lo que se guarda es solo la selección (variante → cantidad). Los precios y
 * los nombres se vuelven a leer del catálogo en cada visita, para que un kit
 * guardado en agosto no reviva el precio de agosto.
 */
/* Imports relativos: vitest no resuelve el alias "@/" y este módulo tiene
   test propio (kit-guardado.test.ts). */
import type { SeleccionKit, UnidadKit } from "./arma-kit";

export const CLAVE_KIT = "actimax-kit-v1";

/**
 * Tope por sabor al restaurar.
 *
 * No es una regla de negocio —el armador no limita cantidades, de eso se
 * encarga el inventario en el checkout—, es un cortafuegos: lo que vuelve de
 * localStorage puede venir editado a mano o corrupto, y un "9999" restaurado
 * en silencio convierte el panel en un disparate.
 */
const MAX_POR_SABOR = 99;

/**
 * La selección guardada, limpia de todo lo que ya no sirve.
 *
 * Se descarta en silencio, nunca se lanza: un kit guardado es una comodidad,
 * y ninguna comodidad puede tumbar la página. Ante cualquier duda se arranca
 * en limpio, que es exactamente lo que el comprador espera si algo se dañó.
 *
 * Se cae lo que no se podría comprar hoy:
 *  - variantes que ya no existen en el catálogo (un sabor descontinuado),
 *  - variantes agotadas (restaurar algo que no se puede pagar solo frustra),
 *  - cantidades que no son enteros positivos.
 */
export function seleccionGuardadaValida(
  crudo: unknown,
  unidades: readonly UnidadKit[],
): SeleccionKit {
  if (typeof crudo !== "object" || crudo === null || Array.isArray(crudo)) return {};

  const comprables = new Set<string>();
  for (const unidad of unidades) {
    for (const sabor of unidad.sabores) {
      if (sabor.inStock) comprables.add(sabor.variantId);
    }
  }

  const limpia: Record<string, number> = {};
  for (const [variantId, cantidad] of Object.entries(crudo as Record<string, unknown>)) {
    if (!comprables.has(variantId)) continue;
    if (typeof cantidad !== "number" || !Number.isInteger(cantidad) || cantidad <= 0) continue;
    limpia[variantId] = Math.min(cantidad, MAX_POR_SABOR);
  }
  return limpia;
}

/**
 * Qué sabor debe aparecer elegido en cada tarjeta al restaurar un kit.
 *
 * Sin esto, alguien vuelve con tres geles de mango en su kit y la tarjeta le
 * muestra "Fresa-Banano" en el selector: el número y el sabor se contradicen
 * y no hay forma de saber cuál manda.
 */
export function saboresDeSeleccion(
  seleccion: SeleccionKit,
  unidades: readonly UnidadKit[],
): Record<string, string> {
  const sabores: Record<string, string> = {};
  for (const unidad of unidades) {
    const elegido = unidad.sabores.find((sabor) => (seleccion[sabor.variantId] ?? 0) > 0);
    if (elegido !== undefined) sabores[unidad.handle] = elegido.variantId;
  }
  return sabores;
}

/**
 * El kit vive en localStorage, no en un useState.
 *
 * Es el mismo montaje del carrito (CartProvider): localStorage es la fuente
 * de verdad y React se suscribe con useSyncExternalStore. Se hace así y no
 * con un efecto que restaure al montar por dos razones: la página es
 * estática, así que leer el navegador durante el primer render rompería la
 * hidratación —`getServerSnapshot` devuelve el kit vacío, que es justo lo
 * que hay en el HTML—, y el propio linter del compilador de React prohíbe
 * llamar a setState dentro de un efecto.
 */
const EVENTO_CAMBIO = "actimax-kit-change";
const VACIO = "{}";
/* Cuando localStorage no se puede leer (navegación privada), el kit vive
   igual en memoria mientras dure la visita. */
let respaldo = VACIO;

export function suscribirseAlKit(alCambiar: () => void): () => void {
  window.addEventListener("storage", alCambiar);
  window.addEventListener(EVENTO_CAMBIO, alCambiar);
  return () => {
    window.removeEventListener("storage", alCambiar);
    window.removeEventListener(EVENTO_CAMBIO, alCambiar);
  };
}

/**
 * El kit crudo, sin validar, como cadena.
 *
 * Devuelve la cadena y no el objeto a propósito: useSyncExternalStore compara
 * por identidad y un objeto nuevo en cada lectura haría render infinito.
 */
export function kitGuardadoCrudo(): string {
  try {
    return window.localStorage.getItem(CLAVE_KIT) ?? VACIO;
  } catch {
    return respaldo;
  }
}

/** En el servidor no hay kit guardado: el HTML estático sale con el vacío. */
export function kitDelServidor(): string {
  return VACIO;
}

/** Lo guardado y ya limpio, listo para dibujar. */
export function kitGuardado(crudo: string, unidades: readonly UnidadKit[]): SeleccionKit {
  try {
    return seleccionGuardadaValida(JSON.parse(crudo), unidades);
  } catch {
    return {};
  }
}

/** Guarda el kit, o lo borra cuando queda vacío. Nunca lanza. */
export function guardarKit(seleccion: SeleccionKit): void {
  const serializado = Object.keys(seleccion).length === 0 ? VACIO : JSON.stringify(seleccion);
  respaldo = serializado;
  try {
    if (serializado === VACIO) window.localStorage.removeItem(CLAVE_KIT);
    else window.localStorage.setItem(CLAVE_KIT, serializado);
  } catch {
    /* Sin dónde guardar, el armador sigue funcionando con el respaldo en
       memoria: solo no sobrevive a la recarga. No vale la pena molestar al
       comprador con eso. */
  }
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}
