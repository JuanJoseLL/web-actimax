import "server-only";

import type { GoogleReview, GoogleReviewsState } from "./types";

const PLACES_API_BASE = "https://places.googleapis.com/v1";
const CACHE_MS = 15 * 60 * 1000;

type LocalizedText = {
  text?: string;
  languageCode?: string;
};

type GoogleReviewResponse = {
  name?: string;
  relativePublishTimeDescription?: string;
  text?: LocalizedText;
  originalText?: LocalizedText;
  rating?: number;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime?: string;
  flagContentUri?: string;
  googleMapsUri?: string;
  visitDate?: { year?: number; month?: number };
};

type GooglePlaceResponse = {
  id?: string;
  displayName?: LocalizedText;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: GoogleReviewResponse[];
};

type ReadyReviews = Extract<GoogleReviewsState, { status: "ready" }>;

const reviewCache = new Map<
  string,
  { expiresAt: number; payload: ReadyReviews }
>();

function apiKey() {
  const value = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!value) throw new Error("Falta GOOGLE_PLACES_API_KEY en Vercel.");
  return value;
}

function visitDate(value?: { year?: number; month?: number }) {
  if (!value?.year || !value.month) return "";
  return new Intl.DateTimeFormat("es", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(value.year, value.month - 1, 1)));
}

function reviewView(review: GoogleReviewResponse, index: number): GoogleReview {
  const text = review.text?.text?.trim() ?? "";
  const originalText = review.originalText?.text?.trim() ?? text;

  return {
    id: review.name ?? `google-review-${index}`,
    authorName:
      review.authorAttribution?.displayName ?? "Usuario de Google Maps",
    authorUri: review.authorAttribution?.uri ?? "",
    authorPhotoUri: review.authorAttribution?.photoUri ?? "",
    rating: Number(review.rating ?? 0),
    text,
    originalText,
    translated:
      Boolean(originalText) &&
      Boolean(text) &&
      originalText !== text &&
      review.originalText?.languageCode !== review.text?.languageCode,
    relativePublishTime: review.relativePublishTimeDescription ?? "",
    publishTime: review.publishTime ?? "",
    googleMapsUri: review.googleMapsUri ?? "",
    flagContentUri: review.flagContentUri ?? "",
    visitDate: visitDate(review.visitDate),
  };
}

export async function getGoogleReviews({
  placeId,
  profileUrl,
  minimumRating,
  maxReviews,
}: {
  placeId: string;
  profileUrl: string;
  minimumRating: number;
  maxReviews: number;
}): Promise<GoogleReviewsState> {
  const normalizedPlaceId = placeId.trim();
  if (!normalizedPlaceId) return { status: "unavailable", profileUrl };

  const minimum = Math.min(5, Math.max(1, Number(minimumRating) || 1));
  const maximum = Math.min(5, Math.max(1, Math.trunc(maxReviews) || 5));
  const cacheKey = `${normalizedPlaceId}:${minimum}:${maximum}`;
  const cached = reviewCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.payload;

  try {
    const response = await fetch(
      `${PLACES_API_BASE}/places/${encodeURIComponent(normalizedPlaceId)}?languageCode=es`,
      {
        headers: {
          Accept: "application/json",
          "X-Goog-Api-Key": apiKey(),
          "X-Goog-FieldMask":
            "id,displayName,googleMapsUri,rating,userRatingCount,reviews",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`Google Places respondió ${response.status}.`);
    }

    const place = (await response.json()) as GooglePlaceResponse;
    const reviews = (place.reviews ?? [])
      .map(reviewView)
      .filter((review) => review.rating >= minimum && Boolean(review.text))
      .slice(0, maximum);

    const payload: ReadyReviews = {
      status: "ready",
      placeId: place.id ?? normalizedPlaceId,
      placeName: place.displayName?.text ?? "WOPU Travel",
      googleMapsUri: place.googleMapsUri ?? profileUrl,
      rating: Number(place.rating ?? 0),
      userRatingCount: Number(place.userRatingCount ?? 0),
      reviews,
      minimumRating: minimum,
      maxReviews: maximum,
    };

    reviewCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_MS,
      payload,
    });
    return payload;
  } catch (error) {
    console.error("[destinos-google-reviews] No se pudieron cargar las reseñas", {
      placeId: normalizedPlaceId,
      error: error instanceof Error ? error.message : "Error desconocido",
    });
    return { status: "unavailable", profileUrl };
  }
}
