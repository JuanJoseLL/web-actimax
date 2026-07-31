import { describe, expect, it } from "vitest";
import catalog from "../data/catalog.json";
import { descriptionFields } from "./description";
import { productFaq } from "./product-faq";
import { isMomento, isProductType, type Product } from "./taxonomia";

interface RawProduct {
  handle: string;
  title: string;
  type: string;
  momentos?: string[];
  deportes?: string[];
  shortDescriptionHtml?: string;
  descriptionHtml?: string;
}

/** Réplica mínima de localProducts(): mismas descripciones que ve la web. */
function toProduct(p: RawProduct): Product {
  return {
    id: p.handle,
    variantId: null,
    handle: p.handle,
    title: p.title,
    type: isProductType(p.type) ? p.type : null,
    momentos: (p.momentos ?? []).filter(isMomento),
    deportes: p.deportes ?? [],
    price: 0,
    regularPrice: 0,
    onSale: false,
    inStock: true,
    ...descriptionFields((p.shortDescriptionHtml ?? "") + (p.descriptionHtml ?? "")),
    images: [],
    options: [],
    variants: [],
  };
}

const productos = (catalog as RawProduct[]).map(toProduct);

describe("productFaq contra el catálogo real", () => {
  it("ninguna respuesta queda cortada a mitad de frase", () => {
    for (const p of productos) {
      for (const f of productFaq(p)) {
        expect(f.answer, `${p.handle} → ${f.question}`).toMatch(/[.!?]$/);
      }
    }
  });

  it("sin promesas comerciales caducables en los datos estructurados", () => {
    const promo = /oferta|tiempo limitado|unidades limitadas|agotar existencia|precio de una/i;
    for (const p of productos) {
      for (const f of productFaq(p)) {
        expect(promo.test(f.answer), `${p.handle} → ${f.answer}`).toBe(false);
      }
    }
  });

  it("sin separadores colgantes ni puntos dobles", () => {
    for (const p of productos) {
      for (const f of productFaq(p)) {
        expect(f.answer, `${p.handle}`).not.toMatch(/·\s*\./);
        expect(f.answer, `${p.handle}`).not.toMatch(/\.\./);
      }
    }
  });

  it("'¿qué incluye?' solo existe cuando hay lista real de contenido", () => {
    /* Gladiadores no enumera contenido en su descripción: sin item. */
    const gladiadores = productos.find((p) => p.handle === "energy-pack-gladiadores");
    expect(productFaq(gladiadores!).some((f) => f.question.startsWith("¿Qué incluye"))).toBe(false);

    /* 15K usa <li>: la respuesta enumera y no arrastra copy de marketing. */
    const k15 = productos.find((p) => p.handle === "energy-pack-15k");
    const incluye15 = productFaq(k15!).find((f) => f.question.startsWith("¿Qué incluye"));
    expect(incluye15?.answer).toContain("1 Sobre de Pre Race");
    expect(incluye15?.answer).not.toMatch(/Rinde al máximo/);

    /* Hydrapack usa viñetas "•" en texto plano: enumera sin arrastrar el
       resto de la descripción que sigue a la última viñeta. */
    const hydra = productos.find((p) => p.handle === "hydrapack-250");
    const incluyeHydra = productFaq(hydra!).find((f) => f.question.startsWith("¿Qué incluye"));
    expect(incluyeHydra?.answer).toContain("1 Sobre de Bebida Élite");
    expect(incluyeHydra?.answer).toContain("Termo plegable");
    expect(incluyeHydra?.answer).not.toMatch(/Cómo preparar|Lleva a todas partes/);
  });

  it("la definición del producto no es una lista de contenido", () => {
    for (const handle of ["hydrapack-250", "hydrapack-500"]) {
      const p = productos.find((x) => x.handle === handle);
      const def = productFaq(p!).find((f) => f.question.startsWith("¿Qué es"));
      expect(def?.answer, handle).not.toContain("•");
      expect(def?.answer, handle).not.toMatch(/incluye:/i);
    }
  });
});
