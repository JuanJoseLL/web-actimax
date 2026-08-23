import { describe, expect, it } from "vitest";
import {
  descriptionFields,
  extractFaqs,
  itemsDeLista,
  promoteLabelHeadings,
  sinListaDeContenido,
  splitDescription,
  stripTags,
} from "./description";

const parrafo = (chars: number) => `<p>${"palabra ".repeat(Math.ceil(chars / 8))}</p>`;

describe("splitDescription", () => {
  it("corta en el marcador 'Recomendaciones de uso' cuando existe", () => {
    const body = `<p>Intro corta.</p><h3>Recomendaciones de uso</h3><p>Tomar antes.</p>`;
    const split = splitDescription(body);
    expect(split.shortDescriptionHtml).toBe("<p>Intro corta.</p>");
    expect(split.descriptionHtml).toContain("Recomendaciones de uso");
    expect(split.descriptionKind).toBe("recomendaciones");
  });

  it("sin marcador, corta en el primer encabezado aunque la intro sea corta", () => {
    // Caso recovery-tarro-400gr: intro + "Descripción detallada…" en <h2>
    const body = `<p>Intro.</p><h2>Descripción detallada de la bebida:</h2>${parrafo(2000)}`;
    const split = splitDescription(body);
    expect(split.shortDescriptionHtml).toBe("<p>Intro.</p>");
    expect(split.descriptionHtml.startsWith("<h2>")).toBe(true);
    expect(split.descriptionKind).toBe("detalle");
  });

  it("con encabezado al inicio deja la intro vacía y todo abajo", () => {
    // Caso bebida-deportiva-elite-tarro-500gr
    const body = `<h2>Descripción detallada:</h2>${parrafo(2000)}`;
    const split = splitDescription(body);
    expect(split.shortDescriptionHtml).toBe("");
    expect(split.descriptionHtml).toBe(body);
  });

  it("sin encabezados, corta entre bloques al superar el objetivo de intro", () => {
    // Caso energy-pack-21k-sub-130: solo listas y párrafos largos
    const body = `${parrafo(150)}${parrafo(200)}${parrafo(3000)}`;
    const split = splitDescription(body);
    const visible = stripTags(split.shortDescriptionHtml).length;
    expect(visible).toBeGreaterThan(0);
    expect(visible).toBeLessThan(600);
    expect(split.shortDescriptionHtml + split.descriptionHtml).toBe(body);
  });

  it("corta antes de un bloque que dejaría la intro por encima del techo", () => {
    // Caso energy-pack-media-maraton-running-21k: lista corta del contenido
    // del pack seguida de una lista larga con el plan de uso
    const body = `<ul><li>1 Pre Race</li><li>3 Geles</li></ul><ul><li>${"plan ".repeat(120)}</li></ul>`;
    const split = splitDescription(body);
    expect(split.shortDescriptionHtml).toBe("<ul><li>1 Pre Race</li><li>3 Geles</li></ul>");
    expect(split.descriptionKind).toBe("detalle");
  });

  it("nunca corta un cuerpo corto sin marcador", () => {
    const body = `<p>Breve.</p><ul><li>Un dato.</li></ul>`;
    const split = splitDescription(body);
    expect(split.shortDescriptionHtml).toBe(body);
    expect(split.descriptionHtml).toBe("");
  });

  it("nunca parte un bloque por dentro", () => {
    const body = `${parrafo(500)}<ul><li>a</li><li>b</li></ul>`;
    const { shortDescriptionHtml, descriptionHtml } = splitDescription(body);
    for (const parte of [shortDescriptionHtml, descriptionHtml]) {
      const abre = (parte.match(/<(p|ul)\b/g) ?? []).length;
      const cierra = (parte.match(/<\/(p|ul)>/g) ?? []).length;
      expect(abre).toBe(cierra);
    }
  });
});

describe("descriptionFields", () => {
  it("saca el excerpt del cuerpo completo cuando la intro queda vacía", () => {
    const body = `<h2>Descripción detallada:</h2><p>Bebida para atletas.</p>`;
    expect(descriptionFields(body).excerpt).toContain("Bebida para atletas.");
  });
});

describe("extractFaqs", () => {
  it("separa el bloque de texto suelto con <p> alternando pregunta/respuesta", () => {
    const body =
      `<ul><li>Sin conservantes.</li></ul>\n` +
      `Preguntas Frecuentes <p>¿Cuántas porciones trae?<br> El tarro trae 400 gr y rinde para 12 vasos<br> ¿Qué contiene?</p>\n` +
      `<p>Una matriz proteica de alto valor biológico.</p>`;
    const { body: sinFaqs, faqs } = extractFaqs(body);
    expect(sinFaqs).toBe(`<ul><li>Sin conservantes.</li></ul>\n`);
    expect(faqs).toEqual([
      { question: "¿Cuántas porciones trae?", answer: "El tarro trae 400 gr y rinde para 12 vasos." },
      { question: "¿Qué contiene?", answer: "Una matriz proteica de alto valor biológico." },
    ]);
  });

  it("entiende el acordeón viejo de Woo: <h2> + <a> por pregunta", () => {
    const body =
      `<p>Intro.</p>\r\n<h2>Preguntas Frecuentes</h2>\r\n` +
      `<a rel="noopener noreferrer">¿Cómo se prepara?</a>\r\n\r\nSe coloca una porción en agua.\r\n` +
      `<a rel="noopener noreferrer">¿Qué es?</a>\r\n\r\nEs una bebida especializada.`;
    const { body: sinFaqs, faqs } = extractFaqs(body);
    expect(sinFaqs).toBe(`<p>Intro.</p>\r\n`);
    expect(faqs.map((f) => f.question)).toEqual(["¿Cómo se prepara?", "¿Qué es?"]);
  });

  it("no toca una mención de pasada sin preguntas reales", () => {
    const body = `<p>Consulta nuestras preguntas frecuentes en la página de ayuda.</p><p>Más texto del producto.</p>`;
    expect(extractFaqs(body)).toEqual({ body, faqs: [] });
  });

  it("cierra las respuestas sin punto final y colapsa puntos dobles", () => {
    const body = `Preguntas Frecuentes <p>¿Cuántas trae?</p><p>Doce unidades</p><p>¿Sirve para maratón?</p><p>Sí, claro..</p>`;
    const { faqs } = extractFaqs(body);
    expect(faqs.map((f) => f.answer)).toEqual(["Doce unidades.", "Sí, claro."]);
  });
});

describe("promoteLabelHeadings", () => {
  it("promueve los cuatro formatos de etiqueta a <h3>", () => {
    expect(
      promoteLabelHeadings(`</p>\n<strong>Sabores de Pre Race:</strong> <p>Fresa.</p>`),
    ).toBe(`</p>\n<h3>Sabores de Pre Race</h3> <p>Fresa.</p>`);
    expect(
      promoteLabelHeadings(`<p>Uso.</p>\n<p>Descripción detallada del gel:</p>`),
    ).toBe(`<p>Uso.</p>\n<h3>Descripción detallada del gel</h3>`);
    expect(
      promoteLabelHeadings(`</p>\nSabores del gel: <p>Fresa, manzana.</p>`),
    ).toBe(`</p>\n<h3>Sabores del gel</h3><p>Fresa, manzana.</p>`);
    expect(
      promoteLabelHeadings(`<h2><strong>Información nutricional del Energy Gel:</strong></h2>`),
    ).toBe(`<h3>Información nutricional del Energy Gel</h3>`);
  });

  it("baja a párrafo el contenido pegado a la etiqueta", () => {
    expect(
      promoteLabelHeadings(`<h2>\n<strong>Información nutricional de la Bebida: </strong>2 cucharadas en 500 ml.</h2>`),
    ).toBe(`<h3>Información nutricional de la Bebida</h3><p>2 cucharadas en 500 ml.</p>`);
    expect(
      promoteLabelHeadings(`</ul>\nInformación nutricional de la Bebida: 1 sachet en 500 ml.\n<p>Sigue.</p>`),
    ).toBe(`</ul>\n<h3>Información nutricional de la Bebida</h3><p>1 sachet en 500 ml.</p><p>Sigue.</p>`);
  });

  it("no incrusta un h3 dentro de un párrafo con más contenido", () => {
    const body = `<p><strong>Sabores de la bebida:</strong> naranja y uva son los favoritos.</p>`;
    expect(promoteLabelHeadings(body)).toBe(body);
  });
});

describe("descriptionFields con la ficha completa", () => {
  it("quita el bloque FAQ, promueve etiquetas y no duplica 'Recomendaciones de uso'", () => {
    const body =
      `<p>Intro corta del producto.</p>` +
      `<h3>Recomendaciones de uso</h3>` +
      `<strong>Sabores de Recovery:</strong> <p>Vainilla.</p>` +
      `<p>Dias Horas Minutos Segundos</p>` +
      `Preguntas Frecuentes <p>¿Cuántas porciones trae?</p><p>Doce.</p>`;
    const f = descriptionFields(body);
    expect(f.shortDescriptionHtml).toBe(`<p>Intro corta del producto.</p>`);
    expect(f.descriptionKind).toBe("recomendaciones");
    expect(f.descriptionHtml).toBe(`<h3>Sabores de Recovery</h3> <p>Vainilla.</p>`);
    expect(f.faqs).toEqual([{ question: "¿Cuántas porciones trae?", answer: "Doce." }]);
  });
});

describe("sinListaDeContenido", () => {
  it("retira el <ul> y la etiqueta 'incluye:' que lo antecede", () => {
    const html =
      "<p>Intro.</p><p><b>El Energy Pack 15K incluye:</b></p><ul> <li>1 Sobre de Pre Race</li>\n<li>1 Energy Gel</li>\n</ul>";
    expect(sinListaDeContenido(html)).toBe("<p>Intro.</p>");
  });

  it("retira las viñetas '•' en párrafo y deja el párrafo promocional que seguía", () => {
    const html =
      "<p>Intro.</p><p>El Energy Pack 10K incluye:</p><p>• 1 Sobre de Pre Race<br> • 1 Energy Gel<br> • 1 Sobre de Recovery Pro</p><p>*Pack con unidades limitadas.</p>";
    expect(sinListaDeContenido(html)).toBe("<p>Intro.</p>\n<p>*Pack con unidades limitadas.</p>".replace("\n", ""));
  });

  it("en texto plano cada viñeta termina en su primera frase", () => {
    const html =
      "<strong>El Energy Pack incluye:</strong>\n• 1 Sobre de Bebida Élite.\n• 1 Termo plegable (250 ml).Lleva a todas partes la hidratación.";
    expect(sinListaDeContenido(html)).toBe("Lleva a todas partes la hidratación.");
  });

  it("una lista sin etiqueta también sale; sin lista no toca nada", () => {
    expect(sinListaDeContenido("<p>Intro.</p><ul><li>1 Sobre</li></ul><p>Cierre.</p>")).toBe(
      "<p>Intro.</p><p>Cierre.</p>",
    );
    expect(sinListaDeContenido("<p>Solo texto.</p>")).toBe("<p>Solo texto.</p>");
  });
});

describe("itemsDeLista", () => {
  it("lee <li> y limpia promos pegadas al último item", () => {
    expect(itemsDeLista("<ul><li>1 Sobre</li><li>2 Geles*Oferta por tiempo limitado</li></ul>")).toEqual([
      "1 Sobre",
      "2 Geles",
    ]);
  });
});
