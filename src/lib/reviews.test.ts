import { describe, expect, it } from "vitest";
import { reviewsAverage, shopifyProductId, type ProductReview } from "./reviews";

describe("shopifyProductId", () => {
  it("extrae el ID numerico de un GID de producto", () => {
    expect(shopifyProductId("gid://shopify/Product/15227256668205")).toBe("15227256668205");
  });

  it("rechaza IDs locales y GID de variantes", () => {
    expect(shopifyProductId("26240")).toBeNull();
    expect(shopifyProductId("gid://shopify/ProductVariant/123")).toBeNull();
  });
});

describe("reviewsAverage", () => {
  it("redondea el promedio a un decimal", () => {
    const base: Omit<ProductReview, "rating"> = {
      handle: "producto",
      reviewer: "Cliente",
      date: "2026-08-04T00:00:00Z",
      text: "Resena",
      verified: false,
    };
    expect(reviewsAverage([{ ...base, rating: 5 }, { ...base, rating: 4 }, { ...base, rating: 4 }])).toBe(4.3);
  });
});
