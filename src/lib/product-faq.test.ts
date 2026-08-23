import { describe, expect, it } from "vitest";
import catalog from "../data/catalog.json";
import { descriptionFields } from "./description";
import { contenidoDelPack } from "./pack";
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
  const descripcion = descriptionFields((p.shortDescriptionHtml ?? "") + (p.descriptionHtml ?? ""));
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
    ...descripcion,
    contenido: p.type === "kits" ? contenidoDelPack(null, descripcion.shortDescriptionHtml) : [],
    guiaUso: [],
    images: [],
    options: [],
    variants: [],
    reviewSummary: null,
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

describe("fusión de FAQs reales con las generadas", () => {
  const base: Product = {
    ...productos[0],
    handle: "producto-prueba",
    title: "Pre Race",
    type: "bebidas",
    momentos: ["antes"],
    deportes: [],
    faqs: [
      { question: "¿Qué es Pre Race Actimax?", answer: "Es un alimento deportivo pre-entreno." },
      { question: "¿Cómo se prepara Pre Race?", answer: "Mezcla 36 gr en 250 ml de agua." },
      { question: "¿Aprovecho la oferta por tiempo limitado?", answer: "Solo por esta semana." },
      { question: "¿Qué es Pre Race Actimax?", answer: "Repetida: no debe salir dos veces." },
    ],
  };

  it("pone primero las reales, sin promos ni repetidas", () => {
    const faqs = productFaq(base);
    expect(faqs[0].question).toBe("¿Qué es Pre Race Actimax?");
    expect(faqs[0].answer).toBe("Es un alimento deportivo pre-entreno.");
    expect(faqs[1].question).toBe("¿Cómo se prepara Pre Race?");
    const preguntas = faqs.map((f) => f.question);
    expect(preguntas.filter((q) => q === "¿Qué es Pre Race Actimax?")).toHaveLength(1);
    expect(preguntas.join(" ")).not.toMatch(/oferta/i);
  });

  it("silencia las plantillas cuyo tema ya cubren las reales, no las demás", () => {
    const preguntas = productFaq(base).map((f) => f.question);
    expect(preguntas).not.toContain("¿Qué es Pre Race y para qué sirve?");
    expect(preguntas).not.toContain("¿Cuándo y cómo se toma Pre Race?");
    expect(preguntas).toContain("¿Hacen envíos a toda Colombia y cómo se paga?");
  });

  it("sin FAQs reales, las plantillas quedan como estaban", () => {
    const faqs = productFaq({ ...base, faqs: [] });
    expect(faqs.map((f) => f.question)).toContain("¿Cuándo y cómo se toma Pre Race?");
  });
});
