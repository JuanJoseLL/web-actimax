/**
 * Vocabulario de la tienda (tipos, momentos, deportes) y el modelo de
 * producto. Sin dependencias de servidor: importable desde componentes
 * cliente como la paleta de búsqueda.
 */

export type ProductType = "geles" | "bebidas" | "barras" | "kits";
export type Momento = "antes" | "durante" | "despues";

export interface Product {
  id: string;
  handle: string;
  title: string;
  type: ProductType | null;
  momentos: Momento[];
  deportes: string[];
  price: number;
  regularPrice: number;
  onSale: boolean;
  inStock: boolean;
  excerpt: string;
  shortDescriptionHtml: string;
  descriptionHtml: string;
  images: string[];
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
