import { describe, expect, it } from "vitest";
import { getBlogPageParams, POSTS_PER_PAGE } from "./blog-pagination";
import { isFeaturedBlogTag, prioritizeFeaturedBlogPost } from "./blog-types";

describe("getBlogPageParams", () => {
  it.each([0, 3, POSTS_PER_PAGE])(
    "devuelve un placeholder con %i publicaciones",
    (postCount) => {
      expect(getBlogPageParams(postCount)).toEqual([{ numero: "__placeholder__" }]);
    },
  );

  it("devuelve las paginas reales a partir de la pagina 2", () => {
    expect(getBlogPageParams(POSTS_PER_PAGE * 3)).toEqual([
      { numero: "2" },
      { numero: "3" },
    ]);
  });
});

describe("artículo destacado", () => {
  it.each(["destacado", "Destacado", " DESTACADO "])(
    "reconoce la etiqueta %j",
    (tag) => {
      expect(isFeaturedBlogTag(tag)).toBe(true);
    },
  );

  it("lo mueve al inicio sin duplicar ni alterar el orden restante", () => {
    const posts = [
      { id: "nuevo", featured: false },
      { id: "segundo", featured: false },
      { id: "elegido", featured: true },
      { id: "antiguo", featured: false },
    ];

    expect(prioritizeFeaturedBlogPost(posts).map((post) => post.id)).toEqual([
      "elegido",
      "nuevo",
      "segundo",
      "antiguo",
    ]);
  });
});
