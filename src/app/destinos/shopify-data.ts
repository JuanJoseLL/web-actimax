import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import {
  defaultExperiences,
  defaultFaqs,
  defaultForm,
  defaultHero,
  defaultReviews,
  defaultSections,
  defaultSeo,
  defaultSettings,
} from "./defaults";
import type { StudioData, StudioEntry, StudioValues } from "./types";

const DESTINOS_APP_ID = "0cbe7e18edee0558842ccd8b5cca1ed2";
const CONTENT_ENDPOINT =
  process.env.DESTINOS_CONTENT_ENDPOINT ??
  "https://destinos-studio.vercel.app/api/destinos/content";

function appType(name: string) {
  return `app--${DESTINOS_APP_ID}--${name}`;
}

function fallbackEntry(
  name: string,
  handle: string,
  values: StudioValues,
): StudioEntry {
  return {
    id: "",
    type: appType(name),
    handle,
    values,
    media: {},
  };
}

function mergedEntry(
  live: StudioEntry | undefined,
  fallback: StudioEntry,
): StudioEntry {
  if (!live) return fallback;
  return {
    ...live,
    values: { ...fallback.values, ...live.values },
    media: { ...fallback.media, ...live.media },
  };
}

function mergedCollection(
  live: StudioEntry[],
  fallback: StudioEntry[],
): StudioEntry[] {
  if (!live.length) return fallback;
  const fallbackByHandle = new Map(
    fallback.map((entry) => [entry.handle, entry]),
  );
  return live.map((entry) =>
    mergedEntry(entry, fallbackByHandle.get(entry.handle) ?? entry),
  );
}

function fallbackData(): StudioData {
  return {
    settings: fallbackEntry("destinos_settings", "main", defaultSettings),
    hero: fallbackEntry("destinos_hero", "main", defaultHero),
    experiences: defaultExperiences.map((entry) =>
      fallbackEntry("destinos_experience", entry.handle, entry.values),
    ),
    sections: defaultSections.map((entry) =>
      fallbackEntry("destinos_section", entry.handle, entry.values),
    ),
    faqs: defaultFaqs.map((entry) =>
      fallbackEntry("destinos_faq", entry.handle, entry.values),
    ),
    form: fallbackEntry("destinos_form", "main", defaultForm),
    reviews: fallbackEntry("destinos_reviews", "main", defaultReviews),
    seo: fallbackEntry("destinos_seo", "main", defaultSeo),
    revisions: [],
  };
}

export async function getDestinosData(): Promise<StudioData> {
  "use cache";
  cacheTag("destinos");
  cacheLife("minutes");

  const fallback = fallbackData();

  try {
    const response = await fetch(CONTENT_ENDPOINT, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(
        `Destinos Studio respondió ${response.status}; usando respaldo.`,
      );
      return fallback;
    }

    const live = (await response.json()) as Partial<StudioData>;

    return {
      settings: mergedEntry(live.settings, fallback.settings),
      hero: mergedEntry(live.hero, fallback.hero),
      experiences: mergedCollection(
        Array.isArray(live.experiences) ? live.experiences : [],
        fallback.experiences,
      ),
      sections: mergedCollection(
        Array.isArray(live.sections) ? live.sections : [],
        fallback.sections,
      ),
      faqs: mergedCollection(
        Array.isArray(live.faqs) ? live.faqs : [],
        fallback.faqs,
      ),
      form: mergedEntry(live.form, fallback.form),
      reviews: mergedEntry(live.reviews, fallback.reviews),
      seo: mergedEntry(live.seo, fallback.seo),
      revisions: [],
    };
  } catch (error) {
    console.error(
      "No se pudo cargar Destinos desde Destinos Studio; usando respaldo.",
      error,
    );
    return fallback;
  }
}
