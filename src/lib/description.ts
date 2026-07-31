/**
 * Partición de la descripción de un producto en intro (arriba del botón de
 * compra) y resto (la sección inferior de la página de producto).
 */

const RECOMENDACIONES_MARKER = /<h3>\s*Recomendaciones de uso\s*<\/h3>|<p>\s*<b>\s*Recomendaciones de uso/i;

export function stripTags(htmlStr: string): string {
  return htmlStr
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* La intro que cabe arriba del botón de compra sin empujarlo bajo el fold;
   las descripciones "sanas" del catálogo miden 170–370 caracteres. */
const SHORT_TARGET = 280;

/* Techo duro: antes de sumar un bloque que dejaría la intro por encima de
   esto, se corta — aunque la intro aún no llegue a SHORT_TARGET. Un único
   primer bloque gigante no se puede partir sin romper el HTML y se acepta. */
const SHORT_MAX = 600;

const BLOCK_START = /<(h[2-4]|p|ul|ol|table)\b[^>]*>/gi;

export interface DescriptionSplit {
  shortDescriptionHtml: string;
  descriptionHtml: string;
  descriptionKind: "recomendaciones" | "detalle";
}

/**
 * Nada puede dejar un bloque ilimitado sobre el botón de compra: si no
 * aparece el marcador "Recomendaciones de uso", se corta en el primer
 * encabezado ("Descripción detallada…", "Información nutricional…") o, en su
 * defecto, en el primer límite de bloque una vez la intro alcanza
 * SHORT_TARGET. Los cortes solo ocurren entre bloques para no romper el HTML.
 */
export function splitDescription(body: string): DescriptionSplit {
  const marker = body.match(RECOMENDACIONES_MARKER);
  if (marker?.index !== undefined) {
    return {
      shortDescriptionHtml: body.slice(0, marker.index),
      descriptionHtml: body.slice(marker.index),
      descriptionKind: "recomendaciones",
    };
  }
  const blocks = [...body.matchAll(BLOCK_START)];
  for (let i = 0; i < blocks.length; i++) {
    const start = blocks[i].index;
    const isHeading = blocks[i][1].toLowerCase().startsWith("h");
    const intro = stripTags(body.slice(0, start)).length;
    const blockEnd = blocks[i + 1]?.index ?? body.length;
    const blockLen = stripTags(body.slice(start, blockEnd)).length;
    if (isHeading || (intro > 0 && (intro >= SHORT_TARGET || intro + blockLen > SHORT_MAX))) {
      return {
        shortDescriptionHtml: body.slice(0, start),
        descriptionHtml: body.slice(start),
        descriptionKind: "detalle",
      };
    }
  }
  return { shortDescriptionHtml: body, descriptionHtml: "", descriptionKind: "detalle" };
}

export function descriptionFields(body: string): DescriptionSplit & { excerpt: string } {
  const split = splitDescription(body);
  const excerptSource =
    split.shortDescriptionHtml !== "" ? split.shortDescriptionHtml : body;
  return { ...split, excerpt: stripTags(excerptSource).slice(0, 280) };
}
