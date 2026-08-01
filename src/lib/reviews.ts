/**
 * Reseñas de clientes migradas de WooCommerce con
 * scripts/export-woo-reviews.mjs. Viven en el repo (no en Shopify) porque la
 * tienda nueva aún no recoge reseñas propias; cuando exista esa fuente, este
 * módulo es el único punto a cambiar.
 */
import reviewsData from "@/data/reviews.json";

export interface ProductReview {
  handle: string;
  reviewer: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

const REVIEWS = reviewsData as ProductReview[];

/** Reseñas de un producto, de la más reciente a la más vieja. */
export function getProductReviews(handle: string): ProductReview[] {
  return REVIEWS.filter((review) => review.handle === handle);
}

/** Promedio a un decimal, como lo muestran las tiendas y lo espera schema.org. */
export function reviewsAverage(reviews: ProductReview[]): number {
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
