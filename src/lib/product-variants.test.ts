import { describe, expect, it } from "vitest";
import type { ProductVariant } from "./taxonomia";
import {
  initialProductVariant,
  selectableProductOptions,
  selectProductVariant,
} from "./product-variants";

function variant(
  id: string,
  flavor: string,
  size: string,
  inStock = true,
): ProductVariant {
  return {
    id,
    title: `${flavor} / ${size}`,
    options: [
      { name: "Sabor", value: flavor },
      { name: "Tamaño", value: size },
    ],
    price: 10_000,
    regularPrice: 10_000,
    onSale: false,
    inStock,
    image: null,
  };
}

describe("product variant selection", () => {
  const variants = [
    variant("lemon-small", "Limón", "Pequeño", false),
    variant("lemon-large", "Limón", "Grande"),
    variant("berry-small", "Frutos rojos", "Pequeño"),
  ];

  it("starts with the first available variant", () => {
    expect(initialProductVariant(variants)?.id).toBe("lemon-large");
  });

  it("keeps an exact valid combination even when it is sold out", () => {
    const selected = selectProductVariant(
      variants,
      variants[2],
      "Sabor",
      "Limón",
    );
    expect(selected?.id).toBe("lemon-small");
    expect(selected?.inStock).toBe(false);
  });

  it("falls back to an available combination using the chosen value", () => {
    const selected = selectProductVariant(
      variants,
      variants[1],
      "Sabor",
      "Frutos rojos",
    );
    expect(selected?.id).toBe("berry-small");
  });

  it("hides Shopify's synthetic default option", () => {
    expect(
      selectableProductOptions(
        [{ name: "Title", values: ["Default Title"] }],
        [],
      ),
    ).toEqual([]);
  });
});
