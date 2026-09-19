/**
 * SEO/GEO: constantes de marca y generadores de JSON-LD (schema.org).
 * Los buscadores y los asistentes de IA (ChatGPT, Claude, Gemini,
 * Perplexity) leen estos datos estructurados para entender la marca y
 * recomendar los productos con información correcta.
 */
import type { Metadata } from "next";
import {
  EMAIL,
  HORARIO_SEDE,
  LEGAL_NAME,
  SEDE,
  SOCIAL_PROFILES,
  TAX_ID,
  TELEFONO_DISPLAY,
} from "./contacto";
import {
  ENVIO_NACIONAL,
  POLITICA_CAMBIOS_URL,
  POLITICA_ENVIOS_URL,
} from "./comercio";
import {
  DEPORTE_LABELS,
  MOMENTO_LABELS,
  typeLabel,
  type Product,
} from "./taxonomia";
import { canonicalProductPath } from "./product-paths";
import { reviewsAverage, type ProductReview } from "./reviews";
import { SITE_URL } from "./seo-base";

export { SITE_URL } from "./seo-base";

export const HOME_TITLE =
  "Actimax | Nutrición deportiva y geles energéticos en Colombia";
export const HOME_META_DESCRIPTION =
  "Geles energéticos, bebidas deportivas, barras y Energy Packs para running y ciclismo. Nutrición deportiva hecha en Colombia con envíos nacionales.";
export const RSS_FEED_URL = `${SITE_URL}/feed.xml`;

export function metadataAlternates(canonical: string) {
  return {
    canonical,
    types: { "application/rss+xml": RSS_FEED_URL },
  };
}

/**
 * Imagen por defecto al compartir: WhatsApp y las redes leen og:image.
 * Va en el CDN de Shopify porque una ruta relativa se resolvería contra
 * actimax.com.co (metadataBase), que hasta el cutover de DNS sigue siendo
 * el sitio viejo — la imagen daría 404 y WhatsApp la descartaría. El
 * original vive en public/og-actimax.png.
 */
export const DEFAULT_OG_IMAGE = {
  url: "https://cdn.shopify.com/s/files/1/0769/0790/5069/files/actimax-og.png?v=1785454311",
  width: 1200,
  height: 630,
  alt: "Actimax — Nutrición deportiva especializada",
};

/**
 * Metadata de página con canonical y Open Graph coherentes. Next reemplaza
 * el objeto openGraph del layout en vez de mezclarlo, así que una página que
 * declare solo title/description compartiría por WhatsApp con el título del
 * home y sin imagen; este helper arma el bloque completo.
 */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: metadataAlternates(input.path),
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "Actimax",
      title: input.ogTitle ?? input.title,
      description: input.ogDescription ?? input.description,
      url: input.path,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export const BRAND_DESCRIPTION =
  "Actimax es una marca colombiana de nutrición deportiva con sede en Envigado (Medellín, Colombia): " +
  "geles energéticos con y sin cafeína, bebidas deportivas de hidratación, pre-entreno y recuperación, " +
  "barras de proteína y Energy Packs armados por distancia (10K, 15K, 21K, 42K, Gran Fondo, triatlón) " +
  "para running, ciclismo, triatlón, natación, fútbol y gym. Venta en línea con envíos a toda Colombia.";

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const STORE_ID = `${SITE_URL}/#tienda-envigado`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const WEBPAGE_ID = `${SITE_URL}/#webpage`;

/** Serializa JSON-LD; escapa "<" para no poder cerrar el <script>. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function productUrl(handle: string): string {
  return `${SITE_URL}${canonicalProductPath(handle)}`;
}

export function organizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORGANIZATION_ID,
    name: "Actimax",
    alternateName: "Actimax Nutrición Deportiva",
    legalName: LEGAL_NAME,
    taxID: TAX_ID,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/actimax-logo.svg`,
    image: DEFAULT_OG_IMAGE.url,
    slogan: "Tu meta no se improvisa.",
    description: BRAND_DESCRIPTION,
    telephone: TELEFONO_DISPLAY,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: SEDE.streetAddress,
      addressLocality: SEDE.addressLocality,
      addressRegion: SEDE.addressRegion,
      postalCode: SEDE.postalCode,
      addressCountry: SEDE.addressCountry,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: TELEFONO_DISPLAY,
      email: EMAIL,
      contactType: "customer service",
      areaServed: "CO",
      availableLanguage: "Spanish",
    },
    areaServed: { "@type": "Country", name: "Colombia" },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: ENVIO_NACIONAL.country,
      merchantReturnLink: POLITICA_CAMBIOS_URL,
    },
    hasShippingService: {
      "@type": "ShippingService",
      name: "Envíos Actimax en Colombia",
      url: POLITICA_ENVIOS_URL,
      description: `Envíos en Colombia: $${ENVIO_NACIONAL.standardRate.toLocaleString("es-CO")} COP por debajo de $${ENVIO_NACIONAL.freeFrom.toLocaleString("es-CO")} COP y gratis desde ese valor, excepto San Andrés y Providencia, donde siempre cuesta $${ENVIO_NACIONAL.specialRegionRate.toLocaleString("es-CO")} COP. Despachos de lunes a sábado con ${ENVIO_NACIONAL.carriers.join(", ")}. Condiciones completas: ${POLITICA_ENVIOS_URL}`,
      handlingTime: servicePeriodJsonLd(ENVIO_NACIONAL.handlingDays),
      shippingConditions: shippingConditionsJsonLd(),
    },
    hasPOS: { "@id": STORE_ID },
    sameAs: SOCIAL_PROFILES,
  };
}

export function storeJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "SportingGoodsStore",
    "@id": STORE_ID,
    name: "Actimax — Portal del Cerro",
    url: `${SITE_URL}/`,
    image: DEFAULT_OG_IMAGE.url,
    telephone: TELEFONO_DISPLAY,
    email: EMAIL,
    priceRange: "$$",
    currenciesAccepted: "COP",
    address: {
      "@type": "PostalAddress",
      streetAddress: SEDE.streetAddress,
      addressLocality: SEDE.addressLocality,
      addressRegion: SEDE.addressRegion,
      postalCode: SEDE.postalCode,
      addressCountry: SEDE.addressCountry,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: HORARIO_SEDE.days.map((day) => `https://schema.org/${day}`),
      opens: HORARIO_SEDE.opens,
      closes: HORARIO_SEDE.closes,
    },
    hasMap: SEDE.mapsUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: SEDE.latitude,
      longitude: SEDE.longitude,
    },
    parentOrganization: { "@id": ORGANIZATION_ID },
    sameAs: [SEDE.mapsUrl],
  };
}

export function webSiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "Actimax",
    inLanguage: "es-CO",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function homePageJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": WEBPAGE_ID,
    url: `${SITE_URL}/`,
    name: HOME_TITLE,
    description: HOME_META_DESCRIPTION,
    inLanguage: "es-CO",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: DEFAULT_OG_IMAGE.url,
      width: DEFAULT_OG_IMAGE.width,
      height: DEFAULT_OG_IMAGE.height,
    },
  };
}

export function productJsonLd(product: Product, reviews: ProductReview[] = []): object {
  const primaryVariant =
    product.variants.find((variant) => variant.id === product.variantId) ??
    product.variants[0];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    /* Estrellas en búsqueda: reseñas reales administradas por Judge.me,
       incluidas las históricas migradas de la tienda anterior. */
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewsAverage(reviews),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.reviewer },
            datePublished: review.date.slice(0, 10),
            reviewBody: review.text,
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
    description: product.excerpt,
    image: product.images,
    url: productUrl(product.handle),
    category: typeLabel(product.type),
    brand: { "@type": "Brand", name: "Actimax" },
    ...(primaryVariant?.sku ? { sku: primaryVariant.sku } : {}),
    ...gtinJsonLd(primaryVariant?.barcode),
    keywords: [
      ...product.momentos.map((m) => `${MOMENTO_LABELS[m]} del esfuerzo`),
      ...product.deportes.map((d) => DEPORTE_LABELS[d] ?? d),
    ].join(", "),
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      url: productUrl(product.handle),
      name: variant.title === "Default Title" ? product.title : variant.title,
      ...(variant.sku ? { sku: variant.sku } : {}),
      ...gtinJsonLd(variant.barcode),
      price: variant.price,
      priceCurrency: "COP",
      availability: variant.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORGANIZATION_ID },
    })),
  };
}

function gtinJsonLd(barcode: string | null | undefined): Record<string, string> {
  const digits = barcode?.replace(/\D/g, "") ?? "";
  if (![8, 12, 13, 14].includes(digits.length)) return {};
  return { [`gtin${digits.length}`]: digits };
}

function servicePeriodJsonLd(days: { min: number; max: number }): object {
  return {
    "@type": "ServicePeriod",
    businessDays: ENVIO_NACIONAL.businessDays.map(
      (day) => `https://schema.org/${day}`,
    ),
    duration: {
      "@type": "QuantitativeValue",
      minValue: days.min,
      maxValue: days.max,
      unitCode: "DAY",
    },
  };
}

function shippingConditionsJsonLd(): object[] {
  return [
    {
      "@type": "ShippingConditions",
      shippingDestination: {
        "@type": "DefinedRegion",
        addressCountry: ENVIO_NACIONAL.country,
      },
      transitTime: servicePeriodJsonLd(ENVIO_NACIONAL.transitDays),
    },
  ];
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd(name: string, products: Product[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: productUrl(product.handle),
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "es-CO",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
