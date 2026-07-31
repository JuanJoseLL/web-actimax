import { describe, expect, it } from "vitest";
import { descriptionFields, splitDescription, stripTags } from "./description";

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
