import { describe, expect, it } from "vitest";
import { cartSurface, trackableText } from "./analytics";

describe("cartSurface", () => {
  it("distingue el catálogo de una ficha de producto", () => {
    expect(cartSurface("/productos/")).toBe("catalogo");
    /* Las fichas canónicas llevan la categoría heredada en el medio. */
    expect(cartSurface("/productos/geles-energeticos/gel-energetico-24-con-cafeina/")).toBe(
      "pagina-producto",
    );
  });

  it("reconoce el comparador antes que la ficha", () => {
    expect(cartSurface("/productos/comparar/")).toBe("comparador");
  });

  it("nombra las demás superficies de la tienda", () => {
    expect(cartSurface("/")).toBe("home");
    expect(cartSurface("/mi-plan/")).toBe("mi-plan");
    expect(cartSurface("/blog/electrolitos/")).toBe("blog");
    expect(cartSurface("/preguntas-frecuentes/")).toBe("otra");
  });
});

describe("trackableText", () => {
  it("respeta el límite de 255 caracteres de Vercel", () => {
    expect(trackableText("a".repeat(400))).toHaveLength(255);
    expect(trackableText("gel con cafeína")).toBe("gel con cafeína");
  });
});
