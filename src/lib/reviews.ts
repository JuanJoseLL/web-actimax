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
const JUDGEME_WIDGET_API = "https://api.judge.me/api/v1/widgets/product_review";
const JUDGEME_PER_PAGE = 30;

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

class JudgeMeResponseError extends Error {
  constructor(readonly status: number) {
    super(`Judge.me respondió ${status}`);
  }
}

function retryDelay(response: Response): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter === null) return 1000;

  const seconds = Number(retryAfter);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - Date.now();
  return Number.isFinite(delay) ? Math.min(Math.max(delay, 250), 3000) : 1000;
}

export async function judgeMePage(
  externalId: string,
  page: number,
  storeDomain = STORE_DOMAIN as string,
  publicToken = PUBLIC_TOKEN as string,
): Promise<JudgeMeReviewsResponse> {
  const url = new URL(JUDGEME_WIDGET_API);
  url.searchParams.set("shop_domain", storeDomain);
  url.searchParams.set("external_id", externalId);
  url.searchParams.set("json_request", "true");
  url.searchParams.set("page", String(page));
  url.searchParams.set("per_page", String(JUDGEME_PER_PAGE));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      headers: { "X-Api-Token": publicToken },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return response.json();
    if (response.status !== 429 || attempt === 1) {
      throw new JudgeMeResponseError(response.status);
    }
    await new Promise((resolve) => setTimeout(resolve, retryDelay(response)));
  }

  throw new Error("Judge.me agotó los reintentos");
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
  // Una entrada por producto (31 en total): a 20 min eran ~700 revalidaciones
  // diarias sumadas. Una reseña enviada desde la PDP (/api/resenas) va a
  // Judge.me y solo aparece cuando allá la aprueban, así que esta ventana
  // nunca es el cuello de botella para verla publicada.
  //
  // Judge.me tampoco tiene webhook acá, así que una reseña recién aprobada
  // solo aparece cuando vence esta ventana o cuando alguien abre el marcador
  // (GET /api/revalidar, que invalida el tag `reviews`). 10 min evita depender
  // de eso: el listado de un producto devuelve los mismos bytes mientras nadie
  // reseñe, y una escritura sin cambios no se cobra.
  cacheLife({ stale: 600, revalidate: 600, expire: 604800 });

  const externalId = shopifyProductId(productId);
  if (STORE_DOMAIN === undefined || PUBLIC_TOKEN === undefined || externalId === null) {
    return localReviews(handle);
  }

  try {
    const first = await judgeMePage(externalId, 1);
    const totalPages = Math.min(Math.max(first.total_pages ?? 1, 1), 20);
    const pages = [first];
    for (let page = 2; page <= totalPages; page += 1) {
      pages.push(await judgeMePage(externalId, page));
    }
    const reviews = pages.flatMap((page) => page.reviews ?? []);
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
    cacheLife({ stale: 60, revalidate: 60, expire: 300 });
    if (error instanceof JudgeMeResponseError && error.status === 429) {
      console.warn(`[reviews] Judge.me limitó las solicitudes de ${handle}; se usó el respaldo local.`);
    } else {
      console.error(`[reviews] no se pudieron leer las reseñas de ${handle}:`, error);
    }
    return localReviews(handle);
  }
}

/** Promedio a un decimal, como lo muestran las tiendas y lo espera schema.org. */
export function reviewsAverage(reviews: ProductReview[]): number {
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
