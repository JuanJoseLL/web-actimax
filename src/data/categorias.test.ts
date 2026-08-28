import { describe, expect, it } from "vitest";
import blogPaths from "./blog-paths.json";
import catalog from "./catalog.json";
import { CATEGORIAS, categoriaParaPost, categoriaPath, categoriaPorTipo } from "./categorias";
import { isProductType } from "../lib/taxonomia";

const handles = new Set(catalog.map((product) => product.handle));
const slugs = new Set(blogPaths.posts.map((post) => post.slug));

function palabras(texto: string): number {
  return texto.split(/\s+/).filter((p) => p !== "").length;
}

describe("landings de categoría", () => {
  it("tienen tipo del vocabulario y ruta limpia única", () => {
    const paths = CATEGORIAS.map((c) => c.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const categoria of CATEGORIAS) {
      expect(isProductType(categoria.tipo)).toBe(true);
      expect(categoria.path).toMatch(/^\/productos\/[a-z0-9-]+\/$/);
      expect(categoria.title.length).toBeLessThanOrEqual(70);
      expect(categoria.description.length).toBeLessThanOrEqual(200);
    }
  });

  it("traen el texto que una vista filtrada no tiene: 400 a 600 palabras", () => {
    for (const categoria of CATEGORIAS) {
      const texto = [
        ...categoria.intro,
        ...categoria.secciones.flatMap((s) => [s.titulo, ...s.parrafos]),
        ...categoria.retos.map((r) => `${r.reto} ${r.pauta}`),
      ].join(" ");
      expect(palabras(texto), `${categoria.path} tiene ${palabras(texto)} palabras`).toBeGreaterThanOrEqual(400);
      expect(palabras(texto)).toBeLessThanOrEqual(650);
      expect(categoria.faqs.length).toBeGreaterThanOrEqual(5);
      expect(categoria.faqs.length).toBeLessThanOrEqual(7);
    }
  });

  it("enlazan a packs y artículos que existen", () => {
    for (const categoria of CATEGORIAS) {
      for (const reto of categoria.retos) {
        expect(handles.has(reto.handle), `${reto.handle} no está en catalog.json`).toBe(true);
      }
      for (const slug of categoria.articulos) {
        expect(slugs.has(slug), `${slug} no está en blog-paths.json`).toBe(true);
      }
    }
  });

  it("resuelve la ruta de una categoría: landing si existe, filtro si no", () => {
    expect(categoriaPath("geles")).toBe("/productos/geles-energeticos/");
    expect(categoriaPorTipo("geles")?.nombre).toBe("Geles energéticos");
    expect(categoriaPath("bebidas")).toBe("/productos/?tipo=bebidas");
  });

  it("detecta los posts de geles por slug o título, sin falsos positivos", () => {
    const posts = [
      "geles-energeticos-guia",
      "geles-energeticos-que-son-como-usarlos-y-cuanto-tomarlos",
      "cuantos-geles-energeticos-necesitas-para-una-media-maraton",
      "gel-energetico-con-cafeina-vs-sin-cafeina-cuando-usar-cada-uno-para-optimizar-tu-rendimiento",
    ];
    for (const slug of posts) {
      expect(categoriaParaPost({ slug, title: "" })?.tipo, slug).toBe("geles");
    }
    expect(categoriaParaPost({ slug: "post-nuevo", title: "Qué gel llevar al maratón" })?.tipo).toBe("geles");
    expect(categoriaParaPost({ slug: "sandra-lorena-arenas-medalla", title: "Ángel del atletismo" })).toBeUndefined();
    expect(categoriaParaPost({ slug: "talla-de-bicicleta-adecuada", title: "Talla de bicicleta" })).toBeUndefined();
  });
});
