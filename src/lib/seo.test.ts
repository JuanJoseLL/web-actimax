import { describe, expect, it } from "vitest";
import type { Product } from "./taxonomia";
import {
  organizationJsonLd,
  productJsonLd,
  storeJsonLd,
} from "./seo";

describe("structured data", () => {
  it("publishes the verified NAP, policy links and Saturday handling", () => {
    const organization = organizationJsonLd() as {
      telephone: string;
      hasMerchantReturnPolicy: { merchantReturnLink: string };
      hasShippingService: {
        handlingTime: { businessDays: string[] };
        shippingConditions: Array<{ shippingRate?: unknown }>;
      };
    };

    expect(organization.telephone).toBe("+57 304 658 0298");
    expect(organization.hasMerchantReturnPolicy.merchantReturnLink).toBe(
      "https://actimax.com.co/cambios-garantia-retracto/",
    );
    expect(organization.hasShippingService.handlingTime.businessDays).toContain(
      "https://schema.org/Saturday",
    );
    /* Google no soporta excepciones regionales para Colombia. Omitir la
       tarifa evita anunciar envío gratis por error a San Andrés. */
    expect(
      organization.hasShippingService.shippingConditions[0],
    ).not.toHaveProperty("shippingRate");
  });

  it("connects the store with its Google Maps location and coordinates", () => {
    const store = storeJsonLd() as {
      hasMap: string;
      geo: { latitude: number; longitude: number };
    };
    expect(store.hasMap).toBe("https://maps.app.goo.gl/bQSETyu5QLjXa4Hz6");
    expect(store.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 6.1739427,
      longitude: -75.5888404,
    });
  });

  it("uses real SKU and GTIN without claiming unsupported flavor URLs", () => {
    const product: Product = {
      id: "gid://shopify/Product/1",
      variantId: "gid://shopify/ProductVariant/11",
      handle: "gel-prueba",
      title: "Gel prueba",
      type: "geles",
      soloEnKit: false,
      momentos: ["durante"],
      deportes: ["running"],
      price: 10_000,
      regularPrice: 10_000,
      onSale: false,
      inStock: true,
      excerpt: "Gel para el esfuerzo.",
      shortDescriptionHtml: "",
      descriptionHtml: "",
      descriptionKind: "detalle",
      faqs: [],
      contenido: [],
      guiaUso: [],
      images: ["https://example.com/gel.jpg"],
      options: [{ name: "Sabor", values: ["Limón", "Frutos rojos"] }],
      variants: [
        {
          id: "gid://shopify/ProductVariant/11",
          title: "Limón",
          options: [{ name: "Sabor", value: "Limón" }],
          price: 10_000,
          regularPrice: 10_000,
          onSale: false,
          inStock: true,
          image: "https://example.com/limon.jpg",
          sku: "GEL-LIMON",
          barcode: "7701234567890",
        },
        {
          id: "gid://shopify/ProductVariant/12",
          title: "Frutos rojos",
          options: [{ name: "Sabor", value: "Frutos rojos" }],
          price: 10_000,
          regularPrice: 10_000,
          onSale: false,
          inStock: true,
          image: "https://example.com/rojos.jpg",
          sku: "GEL-ROJOS",
          barcode: null,
        },
      ],
      reviewSummary: null,
    };

    const data = productJsonLd(product) as {
      "@type": string;
      sku: string;
      gtin13: string;
      offers: Array<{ sku: string }>;
    };
    expect(data["@type"]).toBe("Product");
    expect(data.sku).toBe("GEL-LIMON");
    expect(data.gtin13).toBe("7701234567890");
    expect(data.offers.map((offer) => offer.sku)).toEqual([
      "GEL-LIMON",
      "GEL-ROJOS",
    ]);
  });
});
