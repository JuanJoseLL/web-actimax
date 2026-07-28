import { describe, expect, it } from "vitest";
import { cartLineId } from "./cart";

describe("cartLineId", () => {
  it("distinguishes two variants of the same product", () => {
    expect(cartLineId({ variantId: "gid://shopify/ProductVariant/1", handle: "gel" }))
      .not.toBe(
        cartLineId({ variantId: "gid://shopify/ProductVariant/2", handle: "gel" }),
      );
  });

  it("falls back to the handle for local catalog products", () => {
    expect(cartLineId({ variantId: null, handle: "gel" })).toBe("gel");
  });
});
