import { describe, expect, it } from "vitest";
import { findShortedLines, shortedCartMessage } from "./checkout-lines";

const gid = (n: number) => `gid://shopify/ProductVariant/${n}`;

describe("findShortedLines", () => {
  it("devuelve vacío cuando Shopify concede exactamente lo pedido", () => {
    const lines = [
      { merchandiseId: gid(1), quantity: 2 },
      { merchandiseId: gid(2), quantity: 1 },
    ];
    expect(findShortedLines(lines, lines)).toEqual([]);
  });

  it("detecta la línea descartada por agotada (quantity 0)", () => {
    const requested = [
      { merchandiseId: gid(1), quantity: 1 },
      { merchandiseId: gid(2), quantity: 3 },
    ];
    const granted = [
      { merchandiseId: gid(1), quantity: 1 },
      { merchandiseId: gid(2), quantity: 0 },
    ];
    expect(findShortedLines(requested, granted)).toEqual([
      { merchandiseId: gid(2), requested: 3, granted: 0 },
    ]);
  });

  it("detecta la línea ausente en la respuesta", () => {
    const requested = [{ merchandiseId: gid(1), quantity: 2 }];
    expect(findShortedLines(requested, [])).toEqual([
      { merchandiseId: gid(1), requested: 2, granted: 0 },
    ]);
  });

  it("detecta el recorte por stock insuficiente", () => {
    const requested = [{ merchandiseId: gid(1), quantity: 250 }];
    const granted = [{ merchandiseId: gid(1), quantity: 2 }];
    expect(findShortedLines(requested, granted)).toEqual([
      { merchandiseId: gid(1), requested: 250, granted: 2 },
    ]);
  });

  it("suma líneas duplicadas de la misma variante antes de comparar", () => {
    const requested = [
      { merchandiseId: gid(1), quantity: 1 },
      { merchandiseId: gid(1), quantity: 2 },
    ];
    const granted = [{ merchandiseId: gid(1), quantity: 3 }];
    expect(findShortedLines(requested, granted)).toEqual([]);
  });

  it("no reclama cuando Shopify concede de más", () => {
    const requested = [{ merchandiseId: gid(1), quantity: 1 }];
    const granted = [{ merchandiseId: gid(1), quantity: 2 }];
    expect(findShortedLines(requested, granted)).toEqual([]);
  });
});

describe("shortedCartMessage", () => {
  const titles = new Map([
    [gid(1), "Gel Energético 24"],
    [gid(2), "Protein Bar"],
  ]);
  const titleFor = (id: string) => titles.get(id);

  it("nombra el producto agotado", () => {
    const message = shortedCartMessage(
      [{ merchandiseId: gid(1), requested: 2, granted: 0 }],
      titleFor,
    );
    expect(message).toContain("Gel Energético 24 está agotado");
  });

  it("indica cuántas unidades quedan al recortar", () => {
    const message = shortedCartMessage(
      [{ merchandiseId: gid(2), requested: 250, granted: 2 }],
      titleFor,
    );
    expect(message).toContain("de Protein Bar solo quedan 2 unidades");
  });

  it("usa singular para una unidad y tolera títulos desconocidos", () => {
    const message = shortedCartMessage(
      [
        { merchandiseId: gid(2), requested: 3, granted: 1 },
        { merchandiseId: gid(9), requested: 1, granted: 0 },
      ],
      titleFor,
    );
    expect(message).toContain("de Protein Bar solo queda 1 unidad");
    expect(message).toContain("un producto del carrito está agotado");
  });
});
