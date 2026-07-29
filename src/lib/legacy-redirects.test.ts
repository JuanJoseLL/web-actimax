import { describe, expect, it } from "vitest";
import legacyUrlRedirects from "../data/legacy-url-redirects.json";
import productIdentities from "../data/product-identities.json";
import {
  flatProductPath,
  legacyProductRewrites,
  productAliasRedirects,
  wordpressIdRedirects,
} from "./product-paths";
import { DEPORTE_LABELS, isMomento, isProductType } from "./taxonomia";

const staticRedirects = legacyUrlRedirects.filter((r) => !r.source.includes(":"));
const allSources = [...legacyUrlRedirects, ...productAliasRedirects].map((r) => r.source);

/** Rutas servidas directamente por la aplicación. */
const appRoutes = new Set([
  "/",
  "/productos/",
  "/blog/",
  "/preguntas-frecuentes/",
  "/mi-plan/",
  "/sitemap.xml",
]);

function pathOnly(destination: string): string {
  return destination.split(/[?#]/)[0] === "" ? "/" : destination.split(/[?#]/)[0];
}

describe("legacy redirects", () => {
  it("has no duplicate sources", () => {
    expect(new Set(allSources).size).toBe(allSources.length);
  });

  it("never chains one redirect into another", () => {
    const staticSources = new Set(
      [...staticRedirects, ...productAliasRedirects].map((r) => r.source),
    );
    for (const redirect of [...legacyUrlRedirects, ...productAliasRedirects]) {
      expect(staticSources.has(pathOnly(redirect.destination))).toBe(false);
    }
  });

  it("sends every destination to a real target", () => {
    const served = new Set([
      ...appRoutes,
      ...legacyProductRewrites.map((r) => r.source),
    ]);
    const startsWithBlog = (path: string) => path.startsWith("/blog/");
    for (const redirect of staticRedirects) {
      const path = pathOnly(redirect.destination);
      expect(
        served.has(path) || startsWithBlog(path),
        `${redirect.source} apunta a ${path}, que no se sirve`,
      ).toBe(true);
    }
  });

  it("uses only vocabulary values in catalog filter destinations", () => {
    for (const redirect of legacyUrlRedirects) {
      const query = redirect.destination.split("?")[1];
      if (query === undefined) continue;
      for (const pair of query.split("&")) {
        const [key, value] = pair.split("=");
        if (key === "tipo") expect(isProductType(value)).toBe(true);
        else if (key === "momento") expect(isMomento(value)).toBe(true);
        else if (key === "deporte") expect(value in DEPORTE_LABELS).toBe(true);
        else throw new Error(`Parámetro desconocido en ${redirect.destination}`);
      }
    }
  });

  it("covers every WordPress product id exactly once", () => {
    expect(wordpressIdRedirects).toHaveLength(productIdentities.length);
    const ids = wordpressIdRedirects.map((r) => r.has[0].value);
    expect(new Set(ids).size).toBe(ids.length);
    const served = new Set([
      ...legacyProductRewrites.map((r) => r.source),
      ...productIdentities.map((i) => flatProductPath(i.shopifyHandle)),
    ]);
    for (const redirect of wordpressIdRedirects) {
      expect(served.has(redirect.destination)).toBe(true);
    }
  });
});
