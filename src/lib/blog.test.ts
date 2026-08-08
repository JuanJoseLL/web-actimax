import { describe, expect, it } from "vitest";
import { getBlogPageParams, POSTS_PER_PAGE } from "./blog-pagination";

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
