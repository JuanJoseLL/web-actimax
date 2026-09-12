/**
 * Identificador anónimo y estable del visitante. Viaja al pixel de Meta como
 * `external_id` y al checkout como atributo del carrito: es lo que le permite
 * a Meta unir la navegación anónima del sitio con la compra, sin que en el
 * front tengamos que guardar ni un dato personal.
 */

export const CLAVE_VISITANTE = "ax_vid";

/* El mismo cálculo de `idVisitante`, pero como fuente para incrustarlo en el
   snippet del pixel: ese corre antes que React y no puede importar módulos,
   y necesita sembrar exactamente la misma clave. Devuelve "" si no hay
   almacenamiento disponible. */
export const SNIPPET_ID_VISITANTE =
  `(function(){try{var k=${JSON.stringify(CLAVE_VISITANTE)};var v=localStorage.getItem(k);` +
  `if(!v){v=(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));` +
  `localStorage.setItem(k,v);}return v;}catch(e){return "";}})()`;

export function idVisitante(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const guardado = window.localStorage.getItem(CLAVE_VISITANTE);
    if (guardado !== null && guardado !== "") return guardado;
    const nuevo =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
    window.localStorage.setItem(CLAVE_VISITANTE, nuevo);
    return nuevo;
  } catch {
    /* Modo incógnito o almacenamiento bloqueado: nos quedamos sin id y ya,
       que el pixel siga funcionando importa más que la coincidencia. */
    return null;
  }
}
