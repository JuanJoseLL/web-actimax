import { describe, expect, it } from "vitest";
import {
  cambioVisible,
  handleDelPayload,
  huellaProducto,
  tagsPorTopic,
} from "./revalidacion";
import type { Product } from "./taxonomia";

function producto(cambios: Partial<Product> = {}): Product {
  return {
    id: "gid://shopify/Product/1",
    variantId: "gid://shopify/ProductVariant/10",
    handle: "gel-energetico-actimax-caja-x8",
    title: "Gel Energético Actimax caja x8",
    type: "geles",
    momentos: ["durante"],
    deportes: ["running"],
    price: 72000,
    regularPrice: 80000,
    onSale: true,
    inStock: true,
    excerpt: "Gel con 25 g de carbohidratos.",
    shortDescriptionHtml: "<p>Gel con 25 g de carbohidratos.</p>",
    descriptionHtml: "<p>Modo de uso.</p>",
    descriptionKind: "detalle",
    faqs: [],
    images: ["https://cdn.shopify.com/1.jpg"],
    options: [{ name: "Sabor", values: ["Mora", "Limón"] }],
    variants: [
      {
        id: "gid://shopify/ProductVariant/10",
        title: "Mora",
        options: [{ name: "Sabor", value: "Mora" }],
        price: 72000,
        regularPrice: 80000,
        onSale: true,
        inStock: true,
        image: null,
      },
    ],
    reviewSummary: { rating: 4.8, count: 12 },
    ...cambios,
  };
}

describe("tagsPorTopic", () => {
  it("los temas de producto y colección solo tocan el catálogo", () => {
    expect(tagsPorTopic("products/update")).toEqual(["catalog"]);
    expect(tagsPorTopic("products/create")).toEqual(["catalog"]);
    expect(tagsPorTopic("products/delete")).toEqual(["catalog"]);
    expect(tagsPorTopic("collections/update")).toEqual(["catalog"]);
  });

  it("los temas de blog solo tocan el blog", () => {
    expect(tagsPorTopic("articles/update")).toEqual(["blog"]);
    expect(tagsPorTopic("blogs/update")).toEqual(["blog"]);
  });

  it("un tema desconocido invalida todo, que es el lado seguro", () => {
    expect(tagsPorTopic("orders/create")).toEqual(["catalog", "blog"]);
    expect(tagsPorTopic("")).toEqual(["catalog", "blog"]);
  });
});

describe("handleDelPayload", () => {
  it("saca el handle del cuerpo del webhook", () => {
    const body = JSON.stringify({ id: 123, handle: "recovery-pro-caja-x12" });
    expect(handleDelPayload(body)).toBe("recovery-pro-caja-x12");
  });

  it("devuelve null si no hay handle utilizable", () => {
    expect(handleDelPayload(JSON.stringify({ id: 123 }))).toBeNull();
    expect(handleDelPayload(JSON.stringify({ handle: "" }))).toBeNull();
    expect(handleDelPayload(JSON.stringify({ handle: 5 }))).toBeNull();
  });

  it("no revienta con un cuerpo que no es un objeto JSON", () => {
    expect(handleDelPayload("no soy json")).toBeNull();
    expect(handleDelPayload("")).toBeNull();
    expect(handleDelPayload("null")).toBeNull();
    expect(handleDelPayload("[1,2,3]")).toBeNull();
  });
});

describe("cambioVisible", () => {
  it("dos lecturas del mismo producto no cuentan como cambio", () => {
    expect(cambioVisible(producto(), producto())).toBe(false);
  });

  it("el orden en que se armó el objeto no cuenta como cambio", () => {
    const alReves = Object.fromEntries(
      Object.entries(producto()).reverse(),
    ) as unknown as Product;
    expect(cambioVisible(producto(), alReves)).toBe(false);
  });

  it("detecta un cambio de precio", () => {
    expect(cambioVisible(producto(), producto({ price: 69000 }))).toBe(true);
  });

  it("detecta que el producto se agotó", () => {
    expect(cambioVisible(producto(), producto({ inStock: false }))).toBe(true);
  });

  it("detecta un cambio dentro de una variante", () => {
    const agotada = producto();
    expect(
      cambioVisible(
        agotada,
        producto({
          variants: [{ ...agotada.variants[0], inStock: false }],
        }),
      ),
    ).toBe(true);
  });

  it("detecta una imagen nueva y un título nuevo", () => {
    expect(
      cambioVisible(producto(), producto({ images: ["https://cdn.shopify.com/2.jpg"] })),
    ).toBe(true);
    expect(cambioVisible(producto(), producto({ title: "Otro nombre" }))).toBe(true);
  });

  it("detecta que cambió el resumen de reseñas", () => {
    expect(
      cambioVisible(producto(), producto({ reviewSummary: { rating: 4.9, count: 13 } })),
    ).toBe(true);
  });

  it("un producto que aparece o desaparece siempre es un cambio", () => {
    expect(cambioVisible(undefined, producto())).toBe(true);
    expect(cambioVisible(producto(), undefined)).toBe(true);
  });

  it("dos ausencias no son un cambio", () => {
    expect(cambioVisible(undefined, undefined)).toBe(false);
  });

  /* La comparación es sobre el Product entero justamente para no tener que
     mantener una lista de campos. Este test falla si alguien la reemplaza por
     una selección a mano y se olvida de un campo nuevo. */
  it("cualquier campo del modelo entra en la huella", () => {
    const base = producto();
    for (const clave of Object.keys(base) as Array<keyof Product>) {
      const mutado = { ...base, [clave]: null } as unknown as Product;
      expect(huellaProducto(mutado), clave).not.toBe(huellaProducto(base));
    }
  });
});
