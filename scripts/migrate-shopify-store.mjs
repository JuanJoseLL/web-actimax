#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG_FILE = path.join(ROOT, "src/data/catalog.json");
const STATE_FILE = path.join(ROOT, "shopify-import/shopify-store-migration-state.json");
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
const SOURCE_STORE = process.env.SOURCE_SHOPIFY_STORE_DOMAIN;
const TARGET_STORE = process.env.TARGET_SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const command = process.argv[2] ?? "verify";

const tokens = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertConfiguration() {
  if (!SOURCE_STORE || !TARGET_STORE || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Set SOURCE_SHOPIFY_STORE_DOMAIN, TARGET_SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, and SHOPIFY_CLIENT_SECRET.",
    );
  }
  if (SOURCE_STORE === TARGET_STORE) throw new Error("Source and target Shopify stores must differ.");
}

async function getToken(store) {
  const cached = tokens.get(store);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const response = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const json = await response.json();
  if (!response.ok || typeof json.access_token !== "string") {
    throw new Error(`Could not authenticate with ${store}: ${JSON.stringify(json)}`);
  }
  const required = [
    "write_products",
    "write_inventory",
    "write_publications",
  ];
  const scopes = new Set(String(json.scope ?? "").split(","));
  const missing = required.filter((scope) => !scopes.has(scope));
  if (missing.length > 0) throw new Error(`The app is missing scopes: ${missing.join(", ")}`);

  tokens.set(store, {
    value: json.access_token,
    expiresAt: Date.now() + Number(json.expires_in ?? 86400) * 1000,
  });
  return json.access_token;
}

async function graphql(store, query, variables = {}) {
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getToken(store),
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    const throttled =
      response.status === 429 ||
      json.errors?.some((error) => error.extensions?.code === "THROTTLED");
    if (throttled) {
      await sleep(attempt * 1000);
      continue;
    }
    if (!response.ok || json.errors) {
      throw new Error(`${store} GraphQL error: ${JSON.stringify(json.errors ?? json)}`);
    }
    return json.data;
  }
  throw new Error(`${store} remained throttled after retries.`);
}

function assertNoUserErrors(payload, operation) {
  if (payload.userErrors?.length > 0) {
    throw new Error(`${operation}: ${JSON.stringify(payload.userErrors)}`);
  }
}

async function readState() {
  try {
    const state = JSON.parse(await readFile(STATE_FILE, "utf8"));
    if (state.sourceStore !== SOURCE_STORE || state.targetStore !== TARGET_STORE) {
      throw new Error("The Shopify migration state belongs to a different source or target store.");
    }
    return { products: {}, ...state };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { sourceStore: SOURCE_STORE, targetStore: TARGET_STORE, products: {} };
    }
    throw error;
  }
}

async function writeState(state) {
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

const PRODUCT_FIELDS = `
  id
  title
  handle
  descriptionHtml
  vendor
  productType
  status
  tags
  templateSuffix
  requiresSellingPlan
  isGiftCard
  seo { title description }
  category { id }
  options { name position optionValues { name } }
  metafields(first: 50) { nodes { namespace key type value } }
  media(first: 20) {
    nodes {
      __typename
      ... on MediaImage { id alt image { url } }
    }
  }
  resourcePublicationsV2(first: 20) {
    nodes { isPublished publication { name } }
  }
  variants(first: 20) {
    nodes {
      id
      position
      sku
      barcode
      price
      compareAtPrice
      taxable
      taxCode
      inventoryPolicy
      inventoryQuantity
      requiresComponents
      showUnitPrice
      selectedOptions { name value }
      media(first: 5) { nodes { ... on MediaImage { image { url } } } }
      metafields(first: 20) { nodes { namespace key type value } }
      inventoryItem {
        tracked
        requiresShipping
        countryCodeOfOrigin
        provinceCodeOfOrigin
        harmonizedSystemCode
        unitCost { amount }
        measurement { weight { value unit } }
      }
    }
  }
`;

async function fetchProducts(store) {
  const products = [];
  let after = null;
  do {
    const data = await graphql(
      store,
      `query Products($after: String) {
        products(first: 10, after: $after, sortKey: TITLE) {
          nodes { ${PRODUCT_FIELDS} }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after },
    );
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return products;
}

async function fetchStoreContext(store) {
  const data = await graphql(
    store,
    `query StoreContext {
      shop { id name currencyCode ianaTimezone shopAddress { countryCodeV2 } }
      locations(first: 20) {
        nodes { id name isActive fulfillsOnlineOrders }
      }
      publications(first: 20) { nodes { id name } }
    }`,
  );
  return data;
}

function migrationMetafields(metafields) {
  return metafields
    .filter((field) => field.namespace === "migration")
    .map(({ namespace, key, type, value }) => ({ namespace, key, type, value }));
}

function fileInput(media) {
  return {
    originalSource: media.image.url,
    alt: media.alt ?? undefined,
    contentType: "IMAGE",
  };
}

function inventoryItemInput(item) {
  return {
    tracked: item.tracked,
    requiresShipping: item.requiresShipping,
    countryCodeOfOrigin: item.countryCodeOfOrigin ?? undefined,
    provinceCodeOfOrigin: item.provinceCodeOfOrigin ?? undefined,
    harmonizedSystemCode: item.harmonizedSystemCode ?? undefined,
    cost: item.unitCost?.amount ?? undefined,
    measurement: item.measurement?.weight
      ? { weight: { value: item.measurement.weight.value, unit: item.measurement.weight.unit } }
      : undefined,
  };
}

function productInput(product, targetLocationId) {
  const imageFiles = product.media.nodes.map(fileInput);
  const filesByUrl = new Map(
    product.media.nodes.map((media, index) => [media.image.url, imageFiles[index]]),
  );
  return {
    title: product.title,
    handle: product.handle,
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor,
    productType: product.productType,
    status: product.status,
    tags: product.tags,
    templateSuffix: product.templateSuffix,
    requiresSellingPlan: product.requiresSellingPlan,
    giftCard: product.isGiftCard,
    seo: {
      title: product.seo.title ?? undefined,
      description: product.seo.description ?? undefined,
    },
    category: product.category?.id,
    metafields: migrationMetafields(product.metafields.nodes),
    files: imageFiles,
    productOptions: product.options.map((option) => ({
      name: option.name,
      position: option.position,
      values: option.optionValues.map((value) => ({ name: value.name })),
    })),
    variants: product.variants.nodes.map((variant) => {
      const variantImage = variant.media.nodes[0]?.image?.url;
      return {
        position: variant.position,
        sku: variant.sku,
        barcode: variant.barcode,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice ?? undefined,
        taxable: variant.taxable,
        taxCode: variant.taxCode ?? undefined,
        inventoryPolicy: variant.inventoryPolicy,
        inventoryItem: inventoryItemInput(variant.inventoryItem),
        inventoryQuantities: [
          { locationId: targetLocationId, name: "available", quantity: variant.inventoryQuantity },
        ],
        requiresComponents: variant.requiresComponents,
        showUnitPrice: variant.showUnitPrice,
        metafields: migrationMetafields(variant.metafields.nodes),
        optionValues: variant.selectedOptions.map((option) => ({
          optionName: option.name,
          name: option.value,
        })),
        file: variantImage ? filesByUrl.get(variantImage) : undefined,
      };
    }),
  };
}

async function waitForProductMedia(productId, expectedCount) {
  for (let attempt = 1; attempt <= 40; attempt += 1) {
    const data = await graphql(
      TARGET_STORE,
      `query ProductMedia($id: ID!) {
        product(id: $id) {
          media(first: 20) {
            nodes {
              __typename
              status
              ... on MediaImage { alt image { url } }
            }
          }
        }
      }`,
      { id: productId },
    );
    const media = data.product?.media.nodes ?? [];
    if (media.some((item) => item.status === "FAILED")) {
      throw new Error(`Shopify failed to process media for ${productId}.`);
    }
    if (
      media.length === expectedCount &&
      media.every((item) => item.status === "READY" && item.__typename === "MediaImage" && item.image?.url)
    ) {
      return media;
    }
    await sleep(1500);
  }
  throw new Error(`Timed out waiting for media on ${productId}.`);
}

async function publishLikeSource(product, targetProductId, targetPublications) {
  const standardPublications = new Set(["Online Store", "Point of Sale", "Shop"]);
  const sourceNames = new Set(
    product.resourcePublicationsV2.nodes
      .filter((publication) => publication.isPublished)
      .map((publication) => publication.publication.name),
  );
  const sourceHasCustomPublication = [...sourceNames].some(
    (name) => !standardPublications.has(name),
  );
  const inputs = targetPublications
    .filter(
      (publication) =>
        sourceNames.has(publication.name) ||
        (sourceHasCustomPublication && !standardPublications.has(publication.name)),
    )
    .map((publication) => ({ publicationId: publication.id }));
  if (inputs.length === 0) return;
  const data = await graphql(
    TARGET_STORE,
    `mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) { userErrors { field message } }
    }`,
    { id: targetProductId, input: inputs },
  );
  assertNoUserErrors(data.publishablePublish, `publishablePublish ${product.handle}`);
}

async function updateCatalogImageUrls(urlMap) {
  const catalog = JSON.parse(await readFile(CATALOG_FILE, "utf8"));
  const pathMap = new Map();
  for (const [source, target] of urlMap) {
    pathMap.set(new URL(source).pathname, target);
  }
  let changed = 0;
  for (const product of catalog) {
    product.images = (product.images ?? []).map((source) => {
      if (!/^https?:\/\//.test(source)) return source;
      const target = urlMap.get(source) ?? pathMap.get(new URL(source).pathname);
      if (!target) return source;
      changed += 1;
      return target;
    });
  }
  await writeFile(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  return changed;
}

async function migrate() {
  const [sourceContext, targetContext, sourceProducts, targetProducts, state] = await Promise.all([
    fetchStoreContext(SOURCE_STORE),
    fetchStoreContext(TARGET_STORE),
    fetchProducts(SOURCE_STORE),
    fetchProducts(TARGET_STORE),
    readState(),
  ]);
  if (sourceContext.shop.currencyCode !== targetContext.shop.currencyCode) {
    throw new Error("Source and target store currencies differ.");
  }
  const targetLocations = targetContext.locations.nodes.filter(
    (location) => location.isActive && location.fulfillsOnlineOrders,
  );
  if (targetLocations.length !== 1) {
    throw new Error(`Expected one active target fulfillment location, found ${targetLocations.length}.`);
  }
  const sourceHandles = new Set(sourceProducts.map((product) => product.handle));
  const unexpected = targetProducts.filter((product) => !sourceHandles.has(product.handle));
  if (unexpected.length > 0) {
    throw new Error(`Target contains unexpected products: ${unexpected.map((p) => p.handle).join(", ")}`);
  }

  const targetByHandle = new Map(targetProducts.map((product) => [product.handle, product]));
  const urlMap = new Map();
  let completed = 0;
  for (const product of sourceProducts) {
    const saved = state.products[product.handle];
    let targetProduct = targetByHandle.get(product.handle);
    let targetMedia;
    if (saved && targetProduct?.id === saved.targetId && saved.media?.length === product.media.nodes.length) {
      targetMedia = saved.media;
    } else {
      const data = await graphql(
        TARGET_STORE,
        `mutation SetProduct($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
          productSet(identifier: $identifier, input: $input, synchronous: true) {
            product { id handle }
            userErrors { code field message }
          }
        }`,
        {
          identifier: { handle: product.handle },
          input: productInput(product, targetLocations[0].id),
        },
      );
      assertNoUserErrors(data.productSet, `productSet ${product.handle}`);
      targetProduct = data.productSet.product;
      const readyMedia = await waitForProductMedia(targetProduct.id, product.media.nodes.length);
      targetMedia = readyMedia.map((media) => ({ url: media.image.url, alt: media.alt }));
      state.products[product.handle] = {
        sourceId: product.id,
        targetId: targetProduct.id,
        media: targetMedia,
        migratedAt: new Date().toISOString(),
      };
      await writeState(state);
    }
    await publishLikeSource(product, targetProduct.id, targetContext.publications.nodes);
    if (targetMedia.length !== product.media.nodes.length) {
      throw new Error(`Media count mismatch for ${product.handle}.`);
    }
    product.media.nodes.forEach((media, index) => urlMap.set(media.image.url, targetMedia[index].url));
    completed += 1;
    console.log(`Products: ${completed}/${sourceProducts.length} ${product.handle}`);
  }
  const rewritten = await updateCatalogImageUrls(urlMap);
  console.log(`Product migration complete: ${sourceProducts.length} products; ${rewritten} catalog URLs rewritten.`);
}

function optionKey(variant) {
  return variant.selectedOptions.map((option) => `${option.name}=${option.value}`).join("|");
}

async function verify() {
  const [sourceProducts, targetProducts] = await Promise.all([
    fetchProducts(SOURCE_STORE),
    fetchProducts(TARGET_STORE),
  ]);
  const targetByHandle = new Map(targetProducts.map((product) => [product.handle, product]));
  const mismatches = [];
  for (const source of sourceProducts) {
    const target = targetByHandle.get(source.handle);
    if (!target) {
      mismatches.push(`${source.handle}: missing product`);
      continue;
    }
    for (const field of ["title", "status", "vendor", "productType"]) {
      if (source[field] !== target[field]) mismatches.push(`${source.handle}: ${field}`);
    }
    if (JSON.stringify([...source.tags].sort()) !== JSON.stringify([...target.tags].sort())) {
      mismatches.push(`${source.handle}: tags`);
    }
    if (source.media.nodes.length !== target.media.nodes.length) {
      mismatches.push(`${source.handle}: media count`);
    }
    const targetVariants = new Map(target.variants.nodes.map((variant) => [optionKey(variant), variant]));
    for (const variant of source.variants.nodes) {
      const migrated = targetVariants.get(optionKey(variant));
      if (!migrated) {
        mismatches.push(`${source.handle}: missing variant ${optionKey(variant)}`);
        continue;
      }
      for (const field of [
        "sku",
        "barcode",
        "price",
        "compareAtPrice",
        "inventoryPolicy",
        "inventoryQuantity",
      ]) {
        if (variant[field] !== migrated[field]) {
          mismatches.push(`${source.handle}/${optionKey(variant)}: ${field}`);
        }
      }
    }
    if (targetVariants.size !== source.variants.nodes.length) {
      mismatches.push(`${source.handle}: variant count`);
    }
  }
  const sourceHandles = new Set(sourceProducts.map((product) => product.handle));
  for (const target of targetProducts) {
    if (!sourceHandles.has(target.handle)) mismatches.push(`${target.handle}: unexpected product`);
  }
  const report = {
    sourceProducts: sourceProducts.length,
    targetProducts: targetProducts.length,
    sourceVariants: sourceProducts.reduce((sum, product) => sum + product.variants.nodes.length, 0),
    targetVariants: targetProducts.reduce((sum, product) => sum + product.variants.nodes.length, 0),
    sourceInventory: sourceProducts.reduce(
      (sum, product) =>
        sum + product.variants.nodes.reduce((variantSum, variant) => variantSum + variant.inventoryQuantity, 0),
      0,
    ),
    targetInventory: targetProducts.reduce(
      (sum, product) =>
        sum + product.variants.nodes.reduce((variantSum, variant) => variantSum + variant.inventoryQuantity, 0),
      0,
    ),
    mismatches,
  };
  console.log(JSON.stringify(report, null, 2));
  if (mismatches.length > 0) process.exitCode = 1;
}

try {
  assertConfiguration();
  if (command === "migrate") await migrate();
  else if (command === "verify") await verify();
  else throw new Error(`Unknown command "${command}". Use migrate or verify.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
