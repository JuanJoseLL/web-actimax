/**
 * Vocabulario de la tienda (tipos, momentos, deportes) y el modelo de
 * producto. Sin dependencias de servidor: importable desde componentes
 * cliente como la paleta de búsqueda.
 */

import type { FaqItem } from "../data/faq";

export type ProductType = "geles" | "bebidas" | "barras" | "kits";
export type Momento = "antes" | "durante" | "despues";

export interface ProductOptionValue {
  name: string;
  value: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  /** Shopify GID. Es null únicamente cuando se usa el catálogo local. */
  id: string | null;
  title: string;
  options: ProductOptionValue[];
  price: number;
  regularPrice: number;
  onSale: boolean;
  inStock: boolean;
  image: string | null;
}

export interface ProductReviewSummary {
  rating: number;
  count: number;
}

/**
 * Un paso de la guía de uso de un pack ("cuándo tomar qué"). Viene del
 * metafield `custom.guia_uso` (JSON); el formato se documenta en
 * docs/metafields-packs.md. `cuando` es la etiqueta corta de la línea de
 * tiempo ("Desayuno", "Km 7", "Cada 30 min", "Meta +30 min"); `momento`
 * colorea el paso con el vocabulario de la tienda cuando Operaciones lo llena.
 */
export interface GuiaUsoPaso {
  cuando: string;
  que: string;
  nota?: string;
  momento?: Momento;
}

export interface Product {
  id: string;
  variantId: string | null;
  handle: string;
  title: string;
  type: ProductType | null;
  /**
   * Unidad suelta del armador de kits: existe en Shopify y se puede comprar,
   * pero no es catálogo. `getAllProducts()` la deja fuera, y con eso queda
   * fuera de todo lo que se dibuja a partir de ahí —listado, landings,
   * sitemap, paleta de búsqueda, llms.txt y su propia ficha, que responde
   * 404—. Solo `getUnidadesDeKit()` las devuelve.
   */
  soloEnKit: boolean;
  momentos: Momento[];
  deportes: string[];
  price: number;
  regularPrice: number;
  onSale: boolean;
  inStock: boolean;
  excerpt: string;
  shortDescriptionHtml: string;
  descriptionHtml: string;
  /** Qué contiene la sección inferior: la guía de uso o el resto de la ficha. */
  descriptionKind: "recomendaciones" | "detalle";
  /** Q/A reales extraídas del bloque "Preguntas Frecuentes" de la descripción. */
  faqs: FaqItem[];
  /** Qué trae el pack: metafield `custom.contenido` o, a falta, la lista de la descripción. Vacío fuera de los kits. */
  contenido: string[];
  /** Cuándo tomar qué: metafield `custom.guia_uso`. Vacío mientras Operaciones no lo cargue. */
  guiaUso: GuiaUsoPaso[];
  images: string[];
  options: ProductOption[];
  variants: ProductVariant[];
  reviewSummary: ProductReviewSummary | null;
}

/**
 * La etiqueta de Shopify que saca un producto del catálogo y lo deja
 * disponible solo para el armador de kits. Es lo único que separa una unidad
 * suelta de un producto normal: si Operaciones se la quita, la unidad
 * aparece en la tienda al siguiente webhook.
 */
export const TAG_SOLO_EN_KIT = "unidad";

/**
 * ¿Las etiquetas de Shopify marcan este producto como unidad suelta?
 *
 * En un solo lugar y tolerante con lo que Operaciones escriba a mano
 * (mayúsculas, espacios de sobra). Deliberadamente exacto por lo demás:
 * "unidades" no cuenta, porque una coincidencia por prefijo escondería del
 * catálogo un producto normal y ese error se nota tarde y mal.
 */
export function esSoloEnKit(tags: readonly string[]): boolean {
  return tags.some((tag) => tag.toLowerCase().trim() === TAG_SOLO_EN_KIT);
}

export const TYPE_LABELS: Record<ProductType, string> = {
  geles: "Geles energéticos",
  bebidas: "Bebidas deportivas",
  barras: "Barras de proteína",
  kits: "Energy Packs",
};

export const MOMENTO_LABELS: Record<Momento, string> = {
  antes: "Antes",
  durante: "Durante",
  despues: "Después",
};

export const DEPORTE_LABELS: Record<string, string> = {
  running: "Running",
  ciclismo: "Ciclismo",
  triatlon: "Triatlón",
  natacion: "Natación",
  futbol: "Fútbol",
  gym: "Gym",
};

export function isProductType(v: string): v is ProductType {
  return v in TYPE_LABELS;
}

export function isMomento(v: string): v is Momento {
  return v in MOMENTO_LABELS;
}

export function typeLabel(type: ProductType | null): string {
  return type !== null ? TYPE_LABELS[type] : "Nutrición deportiva";
}
