/**
 * Partición de la descripción de un producto en intro (arriba del botón de
 * compra) y resto (la sección inferior de la página de producto), más la
 * extracción del bloque "Preguntas Frecuentes" que Woo dejó como texto plano.
 */
/* Import relativo: vitest no resuelve el alias "@/" y este módulo
   tiene test propio (description.test.ts). */
import type { FaqItem } from "../data/faq";

const RECOMENDACIONES_MARKER = /<h3>\s*Recomendaciones de uso\s*<\/h3>|<p>\s*<b>\s*Recomendaciones de uso/i;

export function stripTags(htmlStr: string): string {
  return htmlStr
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Preguntas frecuentes incrustadas en la descripción.                  */
/* Woo dejó tres formatos distintos: texto suelto + <p> alternando      */
/* pregunta/respuesta, pregunta y respuesta en el mismo <p> separadas   */
/* por <br>, y <h2> + <a> (el acordeón viejo sin su JS). Se parsean     */
/* sobre el texto plano: toda pregunta empieza con "¿" y termina en "?" */
/* ------------------------------------------------------------------ */

const FAQ_MARKER =
  /(?:<(?:h[1-6]|p|strong|b)[^>]*>\s*)*Preguntas\s+Frecuentes:?\s*(?:<\/(?:h[1-6]|p|strong|b)>)*/i;

const FAQ_QUESTION = /¿[^?¿]{3,220}\?+/g;

export interface FaqExtraction {
  body: string;
  faqs: FaqItem[];
}

/**
 * Separa el bloque "Preguntas Frecuentes" del final de la descripción y lo
 * convierte en pares pregunta/respuesta para el acordeón del producto. Si el
 * marcador no encabeza un bloque real de Q/A (preámbulo largo o cero
 * preguntas), la descripción queda intacta.
 */
export function extractFaqs(body: string): FaqExtraction {
  const marker = body.match(FAQ_MARKER);
  if (marker?.index === undefined) return { body, faqs: [] };

  const plain = stripTags(body.slice(marker.index + marker[0].length));
  const questions = [...plain.matchAll(FAQ_QUESTION)];
  if (questions.length === 0 || plain.slice(0, questions[0].index).trim().length > 120) {
    return { body, faqs: [] };
  }

  const faqs: FaqItem[] = [];
  for (let i = 0; i < questions.length; i++) {
    const start = questions[i].index + questions[i][0].length;
    const end = questions[i + 1]?.index ?? plain.length;
    let answer = plain
      .slice(start, end)
      .replace(/\s+/g, " ")
      /* Woo trae typos de puntuación ("músculos.." ) que ensucian el FAQPage. */
      .replace(/\.{2,}/g, ".")
      .trim();
    if (answer === "") continue;
    /* Varias respuestas de Woo quedaron sin punto final; el acordeón y el
       FAQPage publican frases completas. */
    if (!/[.!?…]$/.test(answer)) answer += ".";
    faqs.push({ question: questions[i][0].replace(/\s+/g, " ").trim(), answer });
  }
  if (faqs.length === 0) return { body, faqs: [] };
  return { body: body.slice(0, marker.index), faqs };
}

/* Etiquetas de la ficha ("Descripción detallada…", "Sabores de…",
   "Información nutricional…") que Woo dejó en cuatro formatos distintos:
   <strong>/<b> huérfano entre bloques, <p> que es solo la etiqueta, texto
   suelto pegado al bloque siguiente, y <h2><strong>…</strong></h2>. Todas
   terminan como <h3> para destacar bajo el H2 de la sección. Solo se
   promueven en borde de bloque para no incrustar un <h3> dentro de un
   párrafo con más contenido. */
const LABEL = String.raw`(?:Descripci[oó]n detallada|Informaci[oó]n nutricional|Sabor(?:es)?)\b[^<>]{0,120}?`;
const BLOCK_EDGE = String.raw`(^|<\/(?:p|ul|ol|h[1-6]|div)>\s*)`;

const STRONG_LABEL = new RegExp(
  `${BLOCK_EDGE}<(?:strong|b)>\\s*(${LABEL})\\s*:?\\s*<\\/(?:strong|b)>`,
  "gi",
);
const H2_LABEL = new RegExp(
  `<h2>\\s*(?:<strong>)?\\s*(${LABEL})\\s*:?\\s*(?:<\\/strong>)?\\s*<\\/h2>`,
  "gi",
);
const P_LABEL = new RegExp(`${BLOCK_EDGE}<p>\\s*(${LABEL})\\s*:\\s*<\\/p>`, "gi");
const TEXT_LABEL = new RegExp(
  `${BLOCK_EDGE}(${LABEL})\\s*:\\s*(?=<(?:p|ul|ol)\\b)`,
  "gi",
);
/* Etiqueta con su contenido pegado en el mismo nodo: el contenido baja a
   párrafo propio para que la etiqueta pueda ser subtítulo. */
const H2_LABEL_CONTENIDO = new RegExp(
  `<h2>\\s*<strong>\\s*(${LABEL})\\s*:?\\s*<\\/strong>\\s*([^<]+?)\\s*<\\/h2>`,
  "gi",
);
const TEXT_LABEL_CONTENIDO = new RegExp(
  `${BLOCK_EDGE}(${LABEL})\\s*:\\s+([^<]{2,400}?)\\s*(?=<|$)`,
  "gi",
);

export function promoteLabelHeadings(html: string): string {
  return html
    .replace(STRONG_LABEL, "$1<h3>$2</h3>")
    .replace(H2_LABEL_CONTENIDO, "<h3>$1</h3><p>$2</p>")
    .replace(H2_LABEL, "<h3>$1</h3>")
    .replace(P_LABEL, "$1<h3>$2</h3>")
    .replace(TEXT_LABEL, "$1<h3>$2</h3>")
    .replace(TEXT_LABEL_CONTENIDO, "$1<h3>$2</h3><p>$3</p>");
}

/* Residuos de plugins de Woo que viajaron en la migración: el texto del
   widget de cuenta regresiva quedó como párrafo suelto. */
function limpiarResiduosWoo(html: string): string {
  return html.replace(/<p>\s*D[ií]as?\s+Horas?\s+Minutos?\s+Segundos?\s*<\/p>/gi, "");
}

/* La sección inferior ya imprime su propio H2 "Recomendaciones de uso";
   el marcador dentro del HTML lo duplicaba justo debajo. */
function stripRedundantRecomendaciones(html: string): string {
  return html
    .replace(/^\s*<h3>\s*Recomendaciones de uso:?\s*<\/h3>\s*/i, "")
    .replace(/^(\s*<p>)\s*<b>\s*Recomendaciones de uso[^<]*<\/b>:?\s*/i, "$1")
    .replace(/^\s*<p>\s*<\/p>\s*/i, "");
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

/* ------------------------------------------------------------------ */
/* Lista de contenido de un kit.                                        */
/* ------------------------------------------------------------------ */

/** Promesas comerciales con fecha de caducidad: no van en datos estructurados ni en bloques fijos. */
export const PROMO_PATTERN =
  /oferta|tiempo limitado|unidades limitadas|agotar existencia|precio de una|promoci|2x1|gratis!|black friday/i;

function limpiarItem(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/, "");
}

/**
 * Solo la lista de contenido del kit: <li> cuando los hay, y si no, las
 * viñetas "•" que algunos kits usan en <div>/<p> planos. El resto del HTML
 * corto es copy de marketing y no responde "¿qué incluye?".
 */
export function itemsDeLista(html: string): string[] {
  /* "*Pack con unidades limitadas…" y similares viajan pegados al último
     item: fuera el asterisco promocional y fuera el item si es pura promo. */
  const depurar = (items: string[]): string[] =>
    items
      .map((item) => item.replace(/\*.*$/, "").trim().replace(/[.\s]+$/, ""))
      .filter((item) => item.length > 0 && !PROMO_PATTERN.test(item));

  const lis = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => limpiarItem(m[1]));
  if (lis.length > 0) return depurar(lis);

  const plano = limpiarItem(html);
  if (!plano.includes("•")) return [];
  /* Tras la última viñeta puede seguir el resto de la descripción: cada
     item termina en su primera frase ("1 Termo plegable (250 ml)."). */
  return depurar(
    plano
      .split("•")
      .slice(1)
      .map((item) => {
        const puntoFinal = item.indexOf(".");
        return puntoFinal === -1 ? item : item.slice(0, puntoFinal);
      }),
  );
}

/* La etiqueta que antecede a la lista ("El Energy Pack 15K incluye:", "El kit
   consta de:"), como párrafo propio o como <strong> suelto. */
const ETIQUETA_CONTENIDO = String.raw`(?:<p>\s*)?(?:<(?:b|strong)>)?\s*[^<•]{0,80}?(?:incluye|consta de|contiene)[^<•]{0,30}?:?\s*(?:<\/(?:b|strong)>)?\s*:?\s*(?:<\/p>)?\s*`;
const LISTA_UL = String.raw`<ul[^>]*>[\s\S]*?<\/ul>`;
/* Viñetas "•" dentro de un <p> o sueltas en texto plano (Pura Candela).
   Cada viñeta termina en su primera frase: en texto plano nada más separa
   el último item del párrafo que le sigue pegado. */
const LISTA_VINETAS = String.raw`(?:<p>\s*)?(?:•[^•<.]*\.?\s*(?:<br\s*\/?>)?\s*)+(?:<\/p>)?`;
const LISTA_DE_CONTENIDO = new RegExp(
  `(?:${ETIQUETA_CONTENIDO})?(?:${LISTA_UL}|${LISTA_VINETAS})`,
  "i",
);

/**
 * Descripción corta sin la lista de contenido del kit: cuando la ficha la
 * pinta como bloque propio ("Qué trae el pack"), dejarla también en el texto
 * la duplicaba a cuatro líneas de distancia.
 */
export function sinListaDeContenido(html: string): string {
  return html
    .replace(LISTA_DE_CONTENIDO, "")
    .replace(/<p>\s*<\/p>/g, "")
    .trim();
}

export function descriptionFields(
  body: string,
): DescriptionSplit & { excerpt: string; faqs: FaqItem[] } {
  const { body: sinFaqs, faqs } = extractFaqs(limpiarResiduosWoo(body));
  const split = splitDescription(promoteLabelHeadings(sinFaqs));
  const descriptionHtml =
    split.descriptionKind === "recomendaciones"
      ? stripRedundantRecomendaciones(split.descriptionHtml)
      : split.descriptionHtml;
  const excerptSource =
    split.shortDescriptionHtml !== "" ? split.shortDescriptionHtml : sinFaqs;
  return {
    ...split,
    descriptionHtml,
    excerpt: stripTags(excerptSource).slice(0, 280),
    faqs,
  };
}
