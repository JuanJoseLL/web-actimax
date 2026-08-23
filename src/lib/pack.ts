/**
 * Datos propios de los Energy Packs que viven en metafields de Shopify:
 * qué trae el pack (`custom.contenido`) y cuándo tomar qué (`custom.guia_uso`).
 * El formato que llena Operaciones está en docs/metafields-packs.md.
 *
 * Todo parser devuelve una lista vacía ante cualquier valor raro: un
 * metafield mal cargado nunca tumba la página de producto, solo oculta el
 * bloque hasta que lo corrijan.
 */
/* Imports relativos: vitest no resuelve el alias "@/" y este módulo
   tiene test propio (pack.test.ts). */
import { itemsDeLista } from "./description";
import { isMomento, type GuiaUsoPaso } from "./taxonomia";

function textoCorto(valor: unknown, max: number): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.replace(/\s+/g, " ").trim();
  return limpio.length > 0 && limpio.length <= max ? limpio : null;
}

function parseJson(value: string | null | undefined): unknown {
  if (value === null || value === undefined || value.trim() === "") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * `custom.contenido` es `list.single_line_text_field`: la Storefront API lo
 * entrega como JSON (`["1 sobre de Pre Race", "4 Energy Gel"]`).
 */
export function parseContenido(value: string | null | undefined): string[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => textoCorto(item, 120))
    .filter((item): item is string => item !== null);
}

const MAX_PASOS = 12;

/**
 * `custom.guia_uso` es `json`: una lista de pasos `{ cuando, que, nota?, momento? }`.
 * Los pasos sin `cuando` o sin `que` se descartan; un `momento` que no sea
 * antes/durante/despues se ignora sin descartar el paso.
 */
export function parseGuiaUso(value: string | null | undefined): GuiaUsoPaso[] {
  const parsed = parseJson(value);
  if (!Array.isArray(parsed)) return [];
  const pasos: GuiaUsoPaso[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const { cuando, que, nota, momento } = item as Record<string, unknown>;
    const cuandoLimpio = textoCorto(cuando, 24);
    const queLimpio = textoCorto(que, 80);
    if (cuandoLimpio === null || queLimpio === null) continue;
    const paso: GuiaUsoPaso = { cuando: cuandoLimpio, que: queLimpio };
    const notaLimpia = textoCorto(nota, 160);
    if (notaLimpia !== null) paso.nota = notaLimpia;
    if (typeof momento === "string" && isMomento(momento)) paso.momento = momento;
    pasos.push(paso);
    if (pasos.length === MAX_PASOS) break;
  }
  return pasos;
}

/**
 * Qué trae el pack: el metafield manda; si Operaciones aún no lo llenó, la
 * lista de la descripción corta (el "<ul>" o las viñetas "•" que Woo dejó).
 */
export function contenidoDelPack(
  metafieldValue: string | null | undefined,
  shortDescriptionHtml: string,
): string[] {
  const desdeMetafield = parseContenido(metafieldValue);
  if (desdeMetafield.length > 0) return desdeMetafield;
  return itemsDeLista(shortDescriptionHtml);
}
