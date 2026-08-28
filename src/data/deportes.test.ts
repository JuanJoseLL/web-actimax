import { describe, expect, it } from "vitest";
import blogPaths from "./blog-paths.json";
import catalog from "./catalog.json";
import { CATEGORIAS } from "./categorias";
import { DEPORTES, deportePath, deportePorSlug, esProductoDe, landingParaPost } from "./deportes";
import { SEO_PRODUCTOS } from "./seo-productos";
import { DEPORTE_LABELS } from "../lib/taxonomia";

const handles = new Set(catalog.map((product) => product.handle));
const slugs = new Set(blogPaths.posts.map((post) => post.slug));

function palabras(texto: string): number {
  return texto.split(/\s+/).filter((p) => p !== "").length;
}

describe("landings por deporte", () => {
  it("usan deportes del vocabulario y rutas limpias únicas entre todas las landings", () => {
    const paths = [...CATEGORIAS, ...DEPORTES].map((l) => l.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const deporte of DEPORTES) {
      expect(deporte.deporte in DEPORTE_LABELS, deporte.deporte).toBe(true);
      expect(deporte.path).toBe(`/productos/${deporte.deporte}/`);
      expect(deporte.title.length, deporte.title).toBeLessThanOrEqual(70);
      expect(deporte.description.length, deporte.description).toBeLessThanOrEqual(200);
    }
  });

  it("traen el texto que una vista filtrada no tiene: 400 a 900 palabras y 5 a 7 preguntas", () => {
    for (const deporte of DEPORTES) {
      const texto = [
        ...deporte.intro,
        ...deporte.secciones.flatMap((s) => [s.titulo, ...s.parrafos]),
        ...deporte.retos.map((r) => `${r.reto} ${r.pauta}`),
      ].join(" ");
      expect(palabras(texto), `${deporte.path} tiene ${palabras(texto)} palabras`).toBeGreaterThanOrEqual(400);
      expect(palabras(texto), `${deporte.path} tiene ${palabras(texto)} palabras`).toBeLessThanOrEqual(900);
      expect(deporte.faqs.length).toBeGreaterThanOrEqual(5);
      expect(deporte.faqs.length).toBeLessThanOrEqual(7);
    }
  });

  it("enlazan a packs en stock y a artículos que existen", () => {
    for (const deporte of DEPORTES) {
      for (const reto of deporte.retos) {
        const pack = catalog.find((p) => p.handle === reto.handle);
        expect(pack, `${reto.handle} no está en catalog.json`).toBeDefined();
        expect(pack?.inStock, `${reto.handle} está agotado`).toBe(true);
      }
      for (const handle of deporte.incluir ?? []) {
        expect(handles.has(handle), `${handle} no está en catalog.json`).toBe(true);
      }
      for (const slug of deporte.articulos) {
        expect(slugs.has(slug), `${slug} no está en blog-paths.json`).toBe(true);
      }
    }
  });

  it("cada landing tiene productos en el catálogo local", () => {
    for (const deporte of DEPORTES) {
      const propios = catalog.filter((p) => esProductoDe(deporte, p));
      expect(propios.length, deporte.path).toBeGreaterThanOrEqual(4);
    }
    /* Los packs 10K y 15K no llevan deporte en Shopify pero son de running. */
    const running = deportePorSlug("running");
    const pack10k = catalog.find((p) => p.handle === "energy-pack-de-10k");
    expect(running !== undefined && pack10k !== undefined && esProductoDe(running, pack10k)).toBe(true);
  });

  it("resuelve la ruta de un deporte: landing si existe, filtro si no", () => {
    expect(deportePath("running")).toBe("/productos/running/");
    expect(deportePath("gym")).toBe("/productos/gym/");
    expect(deportePath("futbol")).toBe("/productos/?deporte=futbol");
  });

  it("manda el CTA del blog a la categoría primero y al deporte después", () => {
    expect(landingParaPost({ slug: "geles-energeticos-guia", title: "" })?.path).toBe(
      "/productos/geles-energeticos/",
    );
    expect(
      landingParaPost({ slug: "cuantos-geles-energeticos-necesitas-para-una-media-maraton", title: "" })?.path,
    ).toBe("/productos/geles-energeticos/");
    expect(landingParaPost({ slug: "los-15-mejores-ciclistas-de-la-historia-hazanas-y-legados", title: "" })?.path).toBe(
      "/productos/ciclismo/",
    );
    expect(landingParaPost({ slug: "maraton-de-medellin-2024", title: "" })?.path).toBe("/productos/running/");
    expect(landingParaPost({ slug: "tips-para-correr-la-maraton", title: "" })?.path).toBe("/productos/running/");
    expect(landingParaPost({ slug: "calendario-de-competencias-de-triatlon-colombia", title: "" })?.path).toBe(
      "/productos/triatlon/",
    );
    expect(landingParaPost({ slug: "talla-de-bicicleta-adecuada", title: "" })?.path).toBe("/productos/ciclismo/");
    expect(landingParaPost({ slug: "post", title: "Rutina de fuerza en el gimnasio" })?.path).toBe("/productos/gym/");
    expect(landingParaPost({ slug: "sandra-lorena-arenas-medalla", title: "Ángel del atletismo" })).toBeUndefined();
    expect(landingParaPost({ slug: "sobreentrenamiento-sintomas", title: "Sobreentrenamiento" })).toBeUndefined();
  });
});

describe("SEO de las fichas de producto", () => {
  it("solo sobrescribe productos del catálogo, con título y descripción dentro de lo que Google muestra", () => {
    for (const [handle, seo] of Object.entries(SEO_PRODUCTOS)) {
      expect(handles.has(handle), `${handle} no está en catalog.json`).toBe(true);
      expect(seo.title.length, seo.title).toBeLessThanOrEqual(70);
      expect(seo.description.length, seo.description).toBeLessThanOrEqual(200);
    }
    const titles = Object.values(SEO_PRODUCTOS).map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
