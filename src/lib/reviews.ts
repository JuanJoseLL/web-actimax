import { cacheLife, cacheTag } from "next/cache";
import reviewsData from "../data/reviews.json";

export interface ProductReview {
  id?: string;
  handle: string;
  reviewer: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

const REVIEWS = reviewsData as ProductReview[];
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const PUBLIC_TOKEN = process.env.JUDGEME_PUBLIC_TOKEN;
const JUDGEME_WIDGET_API = "https://cdn.judge.me/api/v1/widgets/product_review";

interface JudgeMeReview {
  uuid: string;
  rating: number;
  body: string;
  verified_buyer: boolean;
  created_at: string;
  reviewer_name: string;
}

interface JudgeMeReviewsResponse {
  reviews?: JudgeMeReview[];
  total_pages?: number;
}

export function shopifyProductId(id: string): string | null {
  const match = /^gid:\/\/shopify\/Product\/(\d+)$/.exec(id);
  return match?.[1] ?? null;
}

function localReviews(handle: string): ProductReview[] {
  return REVIEWS.filter((review) => review.handle === handle);
}

async function judgeMePage(externalId: string, page: number): Promise<JudgeMeReviewsResponse> {
  const url = new URL(JUDGEME_WIDGET_API);
  url.searchParams.set("shop_domain", STORE_DOMAIN as string);
  url.searchParams.set("api_token", PUBLIC_TOKEN as string);
  url.searchParams.set("external_id", externalId);
  url.searchParams.set("json_request", "true");
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Judge.me respondió ${response.status}`);
  return response.json();
}

/**
 * Judge.me es la fuente de verdad. El export de WooCommerce queda como
 * respaldo para no perder reseñas si su API está temporalmente indisponible.
 */
export async function getProductReviews(
  handle: string,
  productId: string,
): Promise<ProductReview[]> {
  "use cache";
  cacheTag("reviews");
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });

  const externalId = shopifyProductId(productId);
  if (STORE_DOMAIN === undefined || PUBLIC_TOKEN === undefined || externalId === null) {
    return localReviews(handle);
  }

  try {
    const first = await judgeMePage(externalId, 1);
    const totalPages = Math.min(Math.max(first.total_pages ?? 1, 1), 20);
    const remaining = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => judgeMePage(externalId, index + 2)),
    );
    const reviews = [first, ...remaining].flatMap((page) => page.reviews ?? []);
    return reviews.map((review) => ({
      id: review.uuid,
      handle,
      reviewer: review.reviewer_name,
      rating: review.rating,
      date: review.created_at,
      text: review.body,
      verified: review.verified_buyer,
    }));
  } catch (error) {
    console.error(`[reviews] no se pudieron leer las reseñas de ${handle}:`, error);
    return localReviews(handle);
  }
}

/** Promedio a un decimal, como lo muestran las tiendas y lo espera schema.org. */
export function reviewsAverage(reviews: ProductReview[]): number {
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
