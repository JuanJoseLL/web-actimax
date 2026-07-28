import { describe, expect, it } from "vitest";
import productIdentities from "../data/product-identities.json";
import {
  canonicalProductPath,
  legacyProductRewrites,
  productAliasRedirects,
} from "./product-paths";

describe("product paths", () => {
  it("mantiene las 35 identidades historicas unicas", () => {
    expect(productIdentities).toHaveLength(35);
    expect(new Set(productIdentities.map((item) => item.wordpressId)).size).toBe(35);
    expect(new Set(productIdentities.map((item) => item.shopifyHandle)).size).toBe(35);
    expect(new Set(productIdentities.map((item) => item.legacyCanonicalPath)).size).toBe(35);
  });

  it("resuelve handles cuyo slug historico no se puede inferir", () => {
    expect(canonicalProductPath("energy-pack-de-10k")).toBe(
      "/productos/energy-pack/energy-pack-10k/",
    );
    expect(
      canonicalProductPath(
        "bebida-deportiva-elite-con-cafeina-tarro-de-500gr",
      ),
    ).toBe(
      "/productos/bebidas-deportivas/bebida-deportiva-elite-con-cafeina-500gr/",
    );
    expect(canonicalProductPath("energy-pack-black-friday")).toBe(
      "/producto/energy-pack-black-friday/",
    );
  });

  it("conserva una ruta plana para productos futuros", () => {
    expect(canonicalProductPath("producto-nuevo")).toBe(
      "/productos/producto-nuevo/",
    );
  });

  it("genera 31 rewrites y alias sin ciclos", () => {
    expect(legacyProductRewrites).toHaveLength(31);
    expect(productAliasRedirects).toHaveLength(31);
    expect(
      productAliasRedirects.every(
        (redirect) => redirect.source !== redirect.destination,
      ),
    ).toBe(true);
  });
});
