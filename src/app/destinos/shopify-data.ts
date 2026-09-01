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

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";
const DESTINOS_APP_ID = "0cbe7e18edee0558842ccd8b5cca1ed2";

const TYPE_NAMES = {
  settings: "destinos_settings",
  hero: "destinos_hero",
  experiences: "destinos_experience",
  sections: "destinos_section",
  faqs: "destinos_faq",
  form: "destinos_form",
  reviews: "destinos_reviews",
  seo: "destinos_seo",
} as const;

type CollectionKey = keyof typeof TYPE_NAMES;

const CONTENT_QUERY = /* GraphQL */ `
  fragment DestinosEntry on Metaobject {
    id
    handle
    type
    updatedAt
    fields {
      key
      type
      value
      reference {
        ... on MediaImage {
          image {
            url
            altText
          }
        }
        ... on GenericFile {
          url
          alt
        }
      }
    }
  }

  query DestinosContent(
    $settingsType: String!
    $heroType: String!
    $experiencesType: String!
    $sectionsType: String!
    $faqsType: String!
    $formType: String!
    $reviewsType: String!
    $seoType: String!
  ) {
    settings: metaobjects(type: $settingsType, first: 10) {
      nodes { ...DestinosEntry }
    }
    hero: metaobjects(type: $heroType, first: 10) {
      nodes { ...DestinosEntry }
    }
    experiences: metaobjects(type: $experiencesType, first: 100) {
      nodes { ...DestinosEntry }
    }
    sections: metaobjects(type: $sectionsType, first: 100) {
      nodes { ...DestinosEntry }
    }
    faqs: metaobjects(type: $faqsType, first: 100) {
      nodes { ...DestinosEntry }
    }
    form: metaobjects(type: $formType, first: 10) {
      nodes { ...DestinosEntry }
    }
    reviews: metaobjects(type: $reviewsType, first: 10) {
      nodes { ...DestinosEntry }
    }
    seo: metaobjects(type: $seoType, first: 10) {
      nodes { ...DestinosEntry }
    }
  }
`;

type RawField = {
  key: string;
  type: string;
  value: string | null;
  reference?: {
    image?: { url?: string | null; altText?: string | null } | null;
    url?: string | null;
    alt?: string | null;
  } | null;
};

type RawEntry = {
  id: string;
  handle: string;
  type: string;
  updatedAt?: string;
  fields: RawField[];
};

type ShopifyResponse = {
  data?: Partial<Record<CollectionKey, { nodes?: RawEntry[] }>>;
  errors?: Array<{ message?: string }>;
};

function appType(name: string) {
  return `app--${DESTINOS_APP_ID}--${name}`;
}

function parseValue(field: RawField): unknown {
  const value = field.value ?? "";

  if (field.type === "boolean") return value === "true";
  if (field.type.startsWith("number_")) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (field.type === "json" || field.type.startsWith("list.")) {
    try {
      return JSON.parse(value);
    } catch {
      return field.type.startsWith("list.") ? [] : {};
    }
  }

  return value;
}

function entryFromShopify(node: RawEntry): StudioEntry {
  const values: StudioValues = {};
  const media: Record<string, string> = {};

  for (const field of node.fields) {
    values[field.key] = parseValue(field);
    const mediaUrl = field.reference?.image?.url ?? field.reference?.url;
    if (mediaUrl) media[field.key] = mediaUrl;
  }

  return {
    id: node.id,
    type: node.type,
    handle: node.handle,
    values,
    media,
    updatedAt: node.updatedAt,
  };
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
  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) return fallback;

  try {
    const response = await fetch(
      `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: CONTENT_QUERY,
          variables: Object.fromEntries(
            Object.entries(TYPE_NAMES).map(([key, name]) => [
              `${key}Type`,
              appType(name),
            ]),
          ),
        }),
      },
    );

    if (!response.ok) {
      console.error(
        `Shopify respondió ${response.status} al cargar Destinos; usando respaldo.`,
      );
      return fallback;
    }

    const result = (await response.json()) as ShopifyResponse;
    if (result.errors?.length) {
      console.error(
        "Shopify no pudo cargar Destinos:",
        result.errors.map((error) => error.message).join(" · "),
      );
      return fallback;
    }

    const entries = (key: CollectionKey) =>
      (result.data?.[key]?.nodes ?? []).map(entryFromShopify);

    return {
      settings: mergedEntry(entries("settings")[0], fallback.settings),
      hero: mergedEntry(entries("hero")[0], fallback.hero),
      experiences: mergedCollection(
        entries("experiences"),
        fallback.experiences,
      ),
      sections: mergedCollection(entries("sections"), fallback.sections),
      faqs: mergedCollection(entries("faqs"), fallback.faqs),
      form: mergedEntry(entries("form")[0], fallback.form),
      reviews: mergedEntry(entries("reviews")[0], fallback.reviews),
      seo: mergedEntry(entries("seo")[0], fallback.seo),
      revisions: [],
    };
  } catch (error) {
    console.error("No se pudo cargar Destinos desde Shopify; usando respaldo.", error);
    return fallback;
  }
}
