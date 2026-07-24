/**
 * SEO/GEO: constantes de marca y generadores de JSON-LD (schema.org).
 * Los buscadores y los asistentes de IA (ChatGPT, Claude, Gemini,
 * Perplexity) leen estos datos estructurados para entender la marca y
 * recomendar los productos con información correcta.
 */
import {
  DEPORTE_LABELS,
  MOMENTO_LABELS,
  typeLabel,
  type Product,
} from "@/lib/taxonomia";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actimax.com.co";

export const BRAND_DESCRIPTION =
  "Actimax es una marca colombiana de nutrición deportiva con sede en Envigado (Medellín, Colombia): " +
  "geles energéticos con y sin cafeína, bebidas deportivas de hidratación, pre-entreno y recuperación, " +
  "barras de proteína y Energy Packs armados por distancia (10K, 15K, 21K, 42K, Gran Fondo, triatlón) " +
  "para running, ciclismo, triatlón, natación, fútbol y gym. Venta en línea con envíos a toda Colombia.";

/** Perfiles oficiales verificados: conectan la marca como entidad. */
const SOCIAL_PROFILES = [
  "https://www.instagram.com/actimax/",
  "https://www.facebook.com/actimaxco",
  "https://www.tiktok.com/@actimaxco",
  "https://www.youtube.com/user/actimaxcol",
  "https://twitter.com/actimaxco",
  "https://www.linkedin.com/company/actimaxco/",
];

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Serializa JSON-LD; escapa "<" para no poder cerrar el <script>. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function productUrl(handle: string): string {
  return `${SITE_URL}/productos/${handle}/`;
}

export function organizationJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Actimax",
    alternateName: "Actimax Nutrición Deportiva",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/actimax-logo.svg`,
    description: BRAND_DESCRIPTION,
    telephone: "+57 300 329 9972",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Cra. 45A # 34 Sur - 57, Local 130 Portal del Cerro",
      addressLocality: "Envigado",
      addressRegion: "Antioquia",
      addressCountry: "CO",
    },
    areaServed: { "@type": "Country", name: "Colombia" },
    sameAs: SOCIAL_PROFILES,
  };
}

export function webSiteJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: "Actimax",
    inLanguage: "es-CO",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function productJsonLd(product: Product): object {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.excerpt,
    image: product.images,
    url: productUrl(product.handle),
    category: typeLabel(product.type),
    brand: { "@type": "Brand", name: "Actimax" },
    keywords: [
      ...product.momentos.map((m) => `${MOMENTO_LABELS[m]} del esfuerzo`),
      ...product.deportes.map((d) => DEPORTE_LABELS[d] ?? d),
    ].join(", "),
    offers: {
      "@type": "Offer",
      url: productUrl(product.handle),
      price: product.price,
      priceCurrency: "COP",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORGANIZATION_ID },
    },
  };
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
