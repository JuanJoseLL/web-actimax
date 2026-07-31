/**
 * SEO/GEO: constantes de marca y generadores de JSON-LD (schema.org).
 * Los buscadores y los asistentes de IA (ChatGPT, Claude, Gemini,
 * Perplexity) leen estos datos estructurados para entender la marca y
 * recomendar los productos con información correcta.
 */
import type { Metadata } from "next";
import { EMAIL, SEDE, SOCIAL_PROFILES, TELEFONO_DISPLAY } from "@/lib/contacto";
import {
  DEPORTE_LABELS,
  MOMENTO_LABELS,
  typeLabel,
  type Product,
} from "@/lib/taxonomia";
import { canonicalProductPath } from "@/lib/product-paths";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actimax.com.co";

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
    alternates: { canonical: input.path },
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
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Actimax",
    alternateName: "Actimax Nutrición Deportiva",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/actimax-logo.svg`,
    description: BRAND_DESCRIPTION,
    telephone: TELEFONO_DISPLAY,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: SEDE.streetAddress,
      addressLocality: SEDE.addressLocality,
      addressRegion: SEDE.addressRegion,
      addressCountry: SEDE.addressCountry,
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
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      url: productUrl(product.handle),
      name: variant.title === "Default Title" ? product.title : variant.title,
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
