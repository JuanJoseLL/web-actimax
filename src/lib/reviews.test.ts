import { afterEach, describe, expect, it, vi } from "vitest";
import {
  judgeMePage,
  reviewsAverage,
  shopifyProductId,
  type ProductReview,
} from "./reviews";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

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

describe("judgeMePage", () => {
  it("reintenta una vez cuando Judge.me limita temporalmente la solicitud", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 429, headers: { "Retry-After": "1" } }))
      .mockResolvedValueOnce(
        Response.json({ reviews: [], total_pages: 1, current_page: 1, per_page: 30 }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = judgeMePage("123", 1, "shop.myshopify.com", "public-token");
    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toMatchObject({ reviews: [], total_pages: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      headers: { "X-Api-Token": "public-token" },
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("public-token");
  });
});
