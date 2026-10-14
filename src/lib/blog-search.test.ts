import { describe, expect, it } from "vitest";
import { fallbackPosts } from "../data/blog";
import { isBlogPath, searchBlogPosts } from "./blog-search";

describe("búsqueda de contenido del blog", () => {
  it("resuelve preguntas con puntuación y palabras de enlace", () => {
    expect(searchBlogPosts(fallbackPosts, "¿Cómo consumir un gel?").map((post) => post.path))
      .toEqual([fallbackPosts[0].path]);
  });

  it("encuentra temas dentro del cuerpo, sin depender de tildes", () => {
    expect(searchBlogPosts(fallbackPosts, "absorcion cafeina")[0]?.path).toBe(fallbackPosts[0].path);
  });

  it("prioriza las guías de uso para una pregunta sobre cómo consumir", () => {
    const comparison = { ...fallbackPosts[0], path: "/comparacion/", title: "Gel con cafeína vs sin cafeína" };
    const guide = { ...fallbackPosts[0], path: "/guia/", title: "Cómo tomar geles sin malestar" };
    expect(searchBlogPosts([comparison, guide], "¿cómo consumir un gel?")[0].path).toBe("/guia/");
  });

  it("prioriza el título sobre menciones en el cuerpo y conserva la ruta canónica", () => {
    const posts = [
      { ...fallbackPosts[0], path: "/articulo-heredado/", title: "Consejos para competir", searchText: "hidratación" },
      fallbackPosts[1],
    ];
    const results = searchBlogPosts(posts, "hidratación");
    expect(results.map((post) => post.path)).toEqual([fallbackPosts[1].path, "/articulo-heredado/"]);
    expect(results[0]).not.toHaveProperty("searchText");
    expect(results[0]).not.toHaveProperty("bodyHtml");
  });

  it("no muestra artículos para temas ausentes o consultas sin tema", () => {
    expect(searchBlogPosts(fallbackPosts, "astronomía")).toEqual([]);
    expect(searchBlogPosts(fallbackPosts, "¿cómo?")).toEqual([]);
  });

  it("ofrece artículos recientes con el campo vacío", () => {
    expect(searchBlogPosts(fallbackPosts, "")).toHaveLength(fallbackPosts.length);
  });
});

describe("contexto del buscador", () => {
  it.each(["/blog", "/blog/", "/blog/pagina/2/", "/blog/guia/", "/proteina-para-corredores-cuando-y-cuanta-consumir-segun-tu-entrenamiento/"])("busca contenido desde %s", (path) => {
    expect(isBlogPath(path)).toBe(true);
  });
  it.each(["/", "/productos/", "/arma-tu-kit/", "/blog-otro/"])("mantiene productos desde %s", (path) => {
    expect(isBlogPath(path)).toBe(false);
  });
});
