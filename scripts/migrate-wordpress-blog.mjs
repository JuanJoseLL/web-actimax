#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMPORT_DIR = path.join(ROOT, "shopify-import");
const BLOG_PATHS_FILE = path.join(ROOT, "src/data/blog-paths.json");
const CATALOG_FILE = path.join(ROOT, "src/data/catalog.json");
const IMAGE_REDIRECTS_FILE = path.join(ROOT, "src/data/legacy-image-redirects.json");
const MANIFEST_FILE = path.join(IMPORT_DIR, "blog-migration-manifest.json");
const STATE_FILE = path.join(IMPORT_DIR, "blog-migration-state.json");
const NATIVE_REDIRECTS_FILE = path.join(IMPORT_DIR, "shopify-native-blog-redirects.csv");

const WP_BASE_URL = (process.env.WP_BASE_URL ?? "https://actimax.com.co").replace(/\/$/, "");
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const BLOG_HANDLE = process.env.SHOPIFY_BLOG_HANDLE ?? "blog";
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
const command = process.argv[2] ?? "prepare";

const WP_IMAGE_PATTERN = /https:\/\/actimax\.com\.co\/wp-content\/uploads\/[^\s"'<>),]+/gi;
const DATA_IMAGE_PATTERN = /data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+/gi;
const LEGACY_IMAGE_REPLACEMENTS = new Map([
  [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Eddy_Merckx%2C_TDF_1970.jpg/571px-Eddy_Merckx%2C_TDF_1970.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f2/Eddy_Merckx_en_1970.jpg",
  ],
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, options = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { "User-Agent": "Actimax-Shopify-Migration/1.0", ...options.headers },
      });
      if (response.ok) return { text: await response.text(), headers: response.headers };
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
      }
      lastError = new Error(`${response.status} ${response.statusText}: ${url}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(attempt * 1000);
  }
  throw lastError;
}

async function fetchJson(url, options) {
  const { text, headers } = await fetchText(url, options);
  return { data: JSON.parse(text), headers };
}

function decodeHtml(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    laquo: "«",
    ldquo: "“",
    lsquo: "‘",
    lt: "<",
    nbsp: " ",
    quot: '"',
    raquo: "»",
    rdquo: "”",
    rsquo: "’",
    ndash: "–",
    mdash: "—",
  };
  return value.replace(/&(#x?[\da-f]+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === "#") {
      const hex = code[1]?.toLowerCase() === "x";
      const number = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return named[code.toLowerCase()] ?? entity;
  });
}

function stripTags(html) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function cleanExcerpt(html, title) {
  let excerpt = stripTags(html).replace(/\s*\[…\]\s*$/, "").trim();
  if (excerpt.toLocaleLowerCase("es-CO").startsWith(title.toLocaleLowerCase("es-CO"))) {
    excerpt = excerpt.slice(title.length).replace(/^\s*[:.\-–—]?\s*/, "");
  }
  if (excerpt.length > 320) {
    excerpt = `${excerpt.slice(0, 317).replace(/\s+\S*$/, "").trim()}…`;
  }
  return excerpt;
}

function cleanBodyHtml(html, title) {
  let body = html
    .replace(/https?:\/\/web\.actimax\.xyz\/wp-content\/uploads\//gi, `${WP_BASE_URL}/wp-content/uploads/`)
    .replace(/(?:https?:)?\/\/actimax\.com\.co\/wp-content\/uploads\//gi, `${WP_BASE_URL}/wp-content/uploads/`)
    .replace(/(["'])\/wp-content\/uploads\//gi, `$1${WP_BASE_URL}/wp-content/uploads/`)
    .replace(/<div\b[^>]*class=["'][^"']*kk-star-ratings[^"']*["'][^>]*>[\s\S]*$/i, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<img\b[^>]*class=["'][^"']*\bemoji\b[^"']*["'][^>]*>/gi, (tag) => parseAttributes(tag).alt ?? "")
    .replace(/<img\b[^>]*\bsrc=(?:"(?!https?:\/\/|data:image\/)[^"]*"|'(?!https?:\/\/|data:image\/)[^']*')[^>]*>/gi, "")
    .replace(/\s(?:srcset|sizes)=(?:"[^"]*"|'[^']*')/gi, "");

  for (const [source, destination] of LEGACY_IMAGE_REPLACEMENTS) {
    body = body.replaceAll(source, destination);
  }

  if (/<!doctype\s+html/i.test(body)) {
    const nestedArticle = body.match(/<article\b[^>]*>[\s\S]*<\/article>/i);
    if (nestedArticle !== null) body = nestedArticle[0];
  }

  body = body
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
    .trim();

  body = body.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i, (heading, content) => {
    const headingText = stripTags(content).toLocaleLowerCase("es-CO");
    return headingText === title.toLocaleLowerCase("es-CO") ? "" : heading;
  });

  return body;
}

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return attributes;
}

function extractSeo(html, fallbackTitle, fallbackDescription, fallbackCanonical) {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const seo = {
    title: titleMatch !== null ? stripTags(titleMatch[1]) : fallbackTitle,
    description: fallbackDescription,
    canonical: fallbackCanonical,
    image: null,
  };

  for (const match of html.matchAll(/<(meta|link)\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const key = (attributes.name ?? attributes.property ?? attributes.rel ?? "").toLowerCase();
    const value = decodeHtml(attributes.content ?? attributes.href ?? "").trim();
    if (key === "description" && value) seo.description = value;
    if (key === "og:title" && !seo.title && value) seo.title = value;
    if (key === "og:description" && !seo.description && value) seo.description = value;
    if (key === "canonical" && value) seo.canonical = value;
    if (key === "og:image" && value) seo.image = value;
  }
  return seo;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function chunks(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size));
  return batches;
}

function isWordPressImage(source) {
  return typeof source === "string" && /^https:\/\/actimax\.com\.co\/wp-content\/uploads\//i.test(source);
}

function isShopifyImage(source) {
  try {
    return new URL(source).hostname === "cdn.shopify.com";
  } catch {
    return false;
  }
}

async function fetchWordPressPosts() {
  const fields = [
    "id",
    "date",
    "modified",
    "slug",
    "link",
    "title",
    "content",
    "excerpt",
    "featured_media",
    "categories",
  ].join(",");
  const endpoint = `${WP_BASE_URL}/wp-json/wp/v2/posts?per_page=10&orderby=date&order=desc&_fields=${fields}`;
  const first = await fetchJson(endpoint);
  const totalPages = Number(first.headers.get("x-wp-totalpages") ?? 1);
  const posts = [...first.data];
  for (let page = 2; page <= totalPages; page += 1) {
    const response = await fetchJson(`${endpoint}&page=${page}`);
    posts.push(...response.data);
    process.stdout.write(`\rWordPress posts: ${posts.length}`);
  }
  process.stdout.write("\n");
  return posts;
}

async function fetchWordPressSource() {
  const [rawPosts, categoryResponse, sitemapResponse] = await Promise.all([
    fetchWordPressPosts(),
    fetchJson(`${WP_BASE_URL}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug,count`),
    fetchText(`${WP_BASE_URL}/post-sitemap.xml`),
  ]);

  const mediaIds = [...new Set(rawPosts.map((post) => post.featured_media).filter(Boolean))];
  const mediaById = new Map();
  for (const ids of chunks(mediaIds, 100)) {
    const response = await fetchJson(
      `${WP_BASE_URL}/wp-json/wp/v2/media?per_page=100&include=${ids.join(",")}&_fields=id,source_url,alt_text`,
    );
    for (const media of response.data) mediaById.set(media.id, media);
  }

  const categoryById = new Map(categoryResponse.data.map((category) => [category.id, category]));
  let seoCompleted = 0;
  const seoByPostId = new Map(
    (
      await mapLimit(rawPosts, 4, async (post) => {
        const title = decodeHtml(post.title.rendered);
        const excerpt = cleanExcerpt(post.excerpt.rendered, title);
        const page = await fetchText(post.link);
        seoCompleted += 1;
        process.stdout.write(`\rSEO pages: ${seoCompleted}/${rawPosts.length}`);
        return [post.id, extractSeo(page.text, title, excerpt, post.link)];
      })
    ),
  );
  process.stdout.write("\n");

  const sitemapImages = [...sitemapResponse.text.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map((match) =>
    decodeHtml(match[1].trim()),
  );

  const posts = rawPosts.map((post) => {
    const title = decodeHtml(post.title.rendered).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    const media = mediaById.get(post.featured_media);
    const sourcePath = new URL(post.link).pathname;
    const publicSlug = sourcePath.split("/").filter(Boolean).at(-1);
    const seo = seoByPostId.get(post.id);
    return {
      wordpressId: post.id,
      wordpressSlug: post.slug,
      slug: publicSlug,
      sourceUrl: post.link,
      sourcePath,
      title,
      excerpt: seo.description || cleanExcerpt(post.excerpt.rendered, title),
      publishedAt: `${post.date}-05:00`,
      modifiedAt: `${post.modified}-05:00`,
      categories: post.categories.map((id) => categoryById.get(id)?.name).filter(Boolean),
      featuredImage: media?.source_url
        ? { source: media.source_url, alt: media.alt_text?.trim() || title }
        : null,
      seo,
      sourceFeatures: {
        hasForm: /<form\b/i.test(post.content.rendered),
        hasIframe: /<iframe\b/i.test(post.content.rendered),
        hasScript: /<script\b/i.test(post.content.rendered),
        hasTable: /<table\b/i.test(post.content.rendered),
      },
      bodyHtml: cleanBodyHtml(post.content.rendered, title),
    };
  });

  const categories = categoryResponse.data
    .filter((category) => category.count > 0)
    .map((category) => ({
      slug: category.slug,
      name: decodeHtml(category.name),
      path: `/blog/${category.slug}/`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));

  return { posts, categories, sitemapImages: [...new Set(sitemapImages)] };
}

function inspectSource(source) {
  const externalImages = new Set(source.sitemapImages);
  const dataImages = new Map();
  const diagnostics = {
    postsWithDataImages: 0,
    postsWithForms: 0,
    postsWithIframes: 0,
    postsWithScripts: 0,
    postsWithTables: 0,
  };
  const diagnosticPosts = {
    dataImages: [],
    forms: [],
    iframes: [],
    scripts: [],
    tables: [],
  };

  for (const post of source.posts) {
    for (const url of post.bodyHtml.match(WP_IMAGE_PATTERN) ?? []) externalImages.add(url);
    for (const tag of post.bodyHtml.match(/<img\b[^>]*>/gi) ?? []) {
      const source = parseAttributes(tag).src;
      if (/^https?:\/\//i.test(source) && !isShopifyImage(source)) externalImages.add(source);
    }
    if (post.featuredImage !== null) externalImages.add(post.featuredImage.source);

    const postDataImages = post.bodyHtml.match(DATA_IMAGE_PATTERN) ?? [];
    if (postDataImages.length > 0) {
      diagnostics.postsWithDataImages += 1;
      diagnosticPosts.dataImages.push(post.slug);
    }
    for (const dataUri of postDataImages) {
      const hash = createHash("sha256").update(dataUri).digest("hex");
      dataImages.set(`data:${hash}`, dataUri);
    }
    if (post.sourceFeatures.hasForm) {
      diagnostics.postsWithForms += 1;
      diagnosticPosts.forms.push(post.slug);
    }
    if (post.sourceFeatures.hasIframe) {
      diagnostics.postsWithIframes += 1;
      diagnosticPosts.iframes.push(post.slug);
    }
    if (post.sourceFeatures.hasScript) {
      diagnostics.postsWithScripts += 1;
      diagnosticPosts.scripts.push(post.slug);
    }
    if (post.sourceFeatures.hasTable) {
      diagnostics.postsWithTables += 1;
      diagnosticPosts.tables.push(post.slug);
    }
  }

  return { externalImages: [...externalImages], dataImages, diagnostics, diagnosticPosts };
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

async function writePreparationFiles(source, inspection) {
  await mkdir(IMPORT_DIR, { recursive: true });
  const paths = {
    posts: source.posts.map((post) => ({
      slug: post.slug,
      sourcePath: post.sourcePath,
    })),
    categories: source.categories,
  };
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: WP_BASE_URL,
    totals: {
      posts: source.posts.length,
      rootPosts: source.posts.filter((post) => post.sourcePath === `/${post.slug}/`).length,
      categories: source.categories.length,
      sitemapImages: source.sitemapImages.length,
      discoveredExternalImages: inspection.externalImages.length,
      embeddedDataImages: inspection.dataImages.size,
    },
    diagnostics: inspection.diagnostics,
    diagnosticPosts: inspection.diagnosticPosts,
    externalImages: inspection.externalImages,
    posts: source.posts.map((post) => ({
      wordpressId: post.wordpressId,
      wordpressSlug: post.wordpressSlug,
      slug: post.slug,
      sourceUrl: post.sourceUrl,
      sourcePath: post.sourcePath,
      title: post.title,
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      modifiedAt: post.modifiedAt,
      categories: post.categories,
      featuredImage: post.featuredImage?.source ?? null,
      seo: post.seo,
      bodyBytesBeforeImageMigration: Buffer.byteLength(post.bodyHtml),
    })),
  };

  const redirectRows = [
    ["Redirect from", "Redirect to"],
    ["/blog/", `/blogs/${BLOG_HANDLE}`],
    ...source.categories.map((category) => [category.path, `/blogs/${BLOG_HANDLE}/tagged/${category.slug}`]),
    ...source.posts.map((post) => [post.sourcePath, `/blogs/${BLOG_HANDLE}/${post.slug}`]),
  ];

  await Promise.all([
    writeFile(BLOG_PATHS_FILE, `${JSON.stringify(paths, null, 2)}\n`),
    writeFile(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(NATIVE_REDIRECTS_FILE, `${redirectRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`),
  ]);
  return manifest;
}

async function prepare() {
  const source = await fetchWordPressSource();
  const inspection = inspectSource(source);
  const manifest = await writePreparationFiles(source, inspection);
  console.log(JSON.stringify(manifest.totals, null, 2));
  console.log(`Prepared ${path.relative(ROOT, MANIFEST_FILE)} and exact public URL mappings.`);
  return { source, inspection };
}

let temporaryAdminToken = null;
let temporaryAdminTokenExpiresAt = 0;

async function getAdminToken() {
  if (ADMIN_TOKEN) return ADMIN_TOKEN;
  if (!STORE_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Set SHOPIFY_ADMIN_TOKEN or both SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.",
    );
  }

  if (temporaryAdminToken && Date.now() < temporaryAdminTokenExpiresAt - 60_000) {
    return temporaryAdminToken;
  }

  const response = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const json = await response.json();
  if (!response.ok || typeof json.access_token !== "string") {
    throw new Error(`Could not obtain Shopify Admin token: ${JSON.stringify(json)}`);
  }

  temporaryAdminToken = json.access_token;
  temporaryAdminTokenExpiresAt = Date.now() + Number(json.expires_in ?? 86400) * 1000;
  const requiredScopes = ["write_content", "write_files"];
  const grantedScopes = new Set(String(json.scope ?? "").split(",").map((scope) => scope.trim()));
  const missingScopes = requiredScopes.filter((scope) => !grantedScopes.has(scope));
  if (missingScopes.length > 0) {
    throw new Error(`The Shopify app is missing scopes: ${missingScopes.join(", ")}`);
  }
  return temporaryAdminToken;
}

async function adminGraphql(query, variables = {}) {
  if (!STORE_DOMAIN) throw new Error("SHOPIFY_STORE_DOMAIN is required for import.");
  const endpoint = `https://${STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getAdminToken(),
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await response.json();
    const throttled = response.status === 429 || json.errors?.some((error) => error.extensions?.code === "THROTTLED");
    if (throttled) {
      await sleep(attempt * 1500);
      continue;
    }
    if (!response.ok || json.errors) {
      throw new Error(`Shopify Admin API error: ${JSON.stringify(json.errors ?? json)}`);
    }
    return json.data;
  }
  throw new Error("Shopify Admin API remained throttled after retries.");
}

function assertNoUserErrors(payload, operation) {
  if (payload.userErrors?.length > 0) {
    throw new Error(`${operation}: ${JSON.stringify(payload.userErrors)}`);
  }
}

async function findOrCreateBlog() {
  const data = await adminGraphql(`query { blogs(first: 100) { nodes { id handle title } } }`);
  const existing = data.blogs.nodes.find((blog) => blog.handle === BLOG_HANDLE);
  if (existing) return existing;

  const created = await adminGraphql(
    `mutation CreateBlog($blog: BlogCreateInput!) {
      blogCreate(blog: $blog) { blog { id handle title } userErrors { field message code } }
    }`,
    { blog: { title: "Blog Actimax", handle: BLOG_HANDLE, commentPolicy: "CLOSED" } },
  );
  assertNoUserErrors(created.blogCreate, "blogCreate");
  return created.blogCreate.blog;
}

async function readState() {
  try {
    const state = JSON.parse(await readFile(STATE_FILE, "utf8"));
    return { images: {}, articles: {}, ...state };
  } catch (error) {
    if (error.code === "ENOENT") return { images: {}, articles: {} };
    throw error;
  }
}

async function writeState(state) {
  await writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

function safeFilename(source, prefix = "actimax-blog") {
  const urlName = source.startsWith("http") ? decodeURIComponent(new URL(source).pathname.split("/").pop()) : "image.webp";
  const cleanName = urlName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  const hash = createHash("sha256").update(source).digest("hex").slice(0, 10);
  return `${prefix}-${hash}-${cleanName}`.slice(-250);
}

async function waitForImages(items) {
  const pending = new Map(items.map((item) => [item.id, item]));
  for (let attempt = 1; attempt <= 40 && pending.size > 0; attempt += 1) {
    const ids = [...pending.keys()];
    const data = await adminGraphql(
      `query ImageFiles($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on MediaImage { id fileStatus image { url } }
        }
      }`,
      { ids },
    );
    for (const node of data.nodes) {
      if (node?.fileStatus === "FAILED") throw new Error(`Shopify failed to process image ${node.id}.`);
      if (node?.fileStatus === "READY" && node.image?.url) {
        const item = pending.get(node.id);
        item.url = node.image.url;
        pending.delete(node.id);
      }
    }
    if (pending.size > 0) await sleep(Math.min(1000 + attempt * 250, 5000));
  }
  if (pending.size > 0) throw new Error(`Timed out processing ${pending.size} Shopify images.`);
}

async function createImageFiles(inputs) {
  const data = await adminGraphql(
    `mutation CreateFiles($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id fileStatus ... on MediaImage { image { url } } }
        userErrors { field message code }
      }
    }`,
    { files: inputs.map((item) => item.input) },
  );
  if (data.fileCreate.userErrors?.length > 0) {
    const errors = data.fileCreate.userErrors.map((error) => {
      const index = Number(error.field?.[1]);
      return {
        ...error,
        source: Number.isInteger(index) ? inputs[index]?.key : undefined,
      };
    });
    throw new Error(`fileCreate: ${JSON.stringify(errors)}`);
  }
  if (data.fileCreate.files.length !== inputs.length) throw new Error("Shopify returned an incomplete fileCreate result.");

  const created = data.fileCreate.files.map((file, index) => ({
    key: inputs[index].key,
    id: file.id,
    url: file.image?.url ?? null,
  }));
  await waitForImages(created.filter((item) => item.url === null));
  return created;
}

async function uploadExternalImages(sources, state) {
  const missing = sources.filter((source) => !state.images[source]?.url);
  let completed = sources.length - missing.length;
  for (const batch of chunks(missing, 20)) {
    const inputs = batch.map((source) => ({
      key: source,
      input: {
        alt: "Imagen de artículo Actimax",
        contentType: "IMAGE",
        originalSource: encodeURI(source),
        filename: safeFilename(source),
      },
    }));
    const created = await createImageFiles(inputs);
    for (const image of created) state.images[image.key] = { id: image.id, url: image.url };
    completed += batch.length;
    await writeState(state);
    console.log(`External images: ${completed}/${sources.length}`);
  }
}

async function uploadDataImages(dataImages, state) {
  const missing = [...dataImages.entries()].filter(([key]) => !state.images[key]?.url);
  let completed = dataImages.size - missing.length;
  for (const batch of chunks(missing, 10)) {
    const stagedInput = batch.map(([key, dataUri]) => {
      const [, mimeType, base64] = dataUri.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/i);
      const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
      return {
        key,
        buffer: Buffer.from(base64, "base64"),
        filename: `actimax-blog-embedded-${key.slice(5, 17)}.${extension}`,
        mimeType,
      };
    });

    const staged = await adminGraphql(
      `mutation StageImages($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }`,
      {
        input: stagedInput.map((item) => ({
          filename: item.filename,
          mimeType: item.mimeType,
          fileSize: String(item.buffer.length),
          httpMethod: "POST",
          resource: "IMAGE",
        })),
      },
    );
    assertNoUserErrors(staged.stagedUploadsCreate, "stagedUploadsCreate");

    const fileInputs = [];
    for (let index = 0; index < stagedInput.length; index += 1) {
      const item = stagedInput[index];
      const target = staged.stagedUploadsCreate.stagedTargets[index];
      const form = new FormData();
      for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
      form.append("file", new Blob([item.buffer], { type: item.mimeType }), item.filename);
      const response = await fetch(target.url, { method: "POST", body: form });
      if (!response.ok) throw new Error(`Staged image upload failed (${response.status}) for ${item.filename}.`);
      fileInputs.push({
        key: item.key,
        input: {
          alt: "Imagen de artículo Actimax",
          contentType: "IMAGE",
          originalSource: target.resourceUrl,
          filename: item.filename,
        },
      });
    }

    const created = await createImageFiles(fileInputs);
    for (const image of created) state.images[image.key] = { id: image.id, url: image.url };
    completed += batch.length;
    await writeState(state);
    console.log(`Embedded images: ${completed}/${dataImages.size}`);
  }
}

function rewriteBodyImages(bodyHtml, state) {
  let body = bodyHtml;
  const externalInBody = new Set(
    [
      ...(body.match(WP_IMAGE_PATTERN) ?? []),
      ...(body.match(/<img\b[^>]*>/gi) ?? [])
        .map((tag) => parseAttributes(tag).src)
        .filter((source) => /^https?:\/\//i.test(source) && !isShopifyImage(source)),
    ],
  );
  for (const source of externalInBody) {
    const destination = state.images[source]?.url;
    if (!destination) throw new Error(`Missing migrated image for ${source}`);
    body = body.replaceAll(source, destination);
  }
  for (const dataUri of body.match(DATA_IMAGE_PATTERN) ?? []) {
    const key = `data:${createHash("sha256").update(dataUri).digest("hex")}`;
    const destination = state.images[key]?.url;
    if (!destination) throw new Error(`Missing migrated embedded image ${key}`);
    body = body.replaceAll(dataUri, destination);
  }
  const remainingExternalImages = (body.match(/<img\b[^>]*>/gi) ?? [])
    .map((tag) => parseAttributes(tag).src)
    .filter((source) => !isShopifyImage(source));
  if (remainingExternalImages.length > 0 || (body.match(DATA_IMAGE_PATTERN) ?? []).length > 0) {
    throw new Error("Body still contains a non-Shopify or embedded image after rewriting.");
  }
  return body;
}

async function existingArticles() {
  const data = await adminGraphql(
    `query ExistingArticles {
      articles(first: 250) { nodes { id handle title blog { handle } } }
    }`,
  );
  return new Map(
    data.articles.nodes
      .filter((article) => article.blog.handle === BLOG_HANDLE)
      .map((article) => [article.handle, article]),
  );
}

function articleInput(post, blogId, bodyHtml, state) {
  const featuredUrl = post.featuredImage === null ? null : state.images[post.featuredImage.source]?.url;
  const seoTitle = post.seo.title.slice(0, 255);
  const seoDescription = post.seo.description.slice(0, 320);
  return {
    blogId,
    title: post.title,
    author: { name: "Actimax" },
    handle: post.slug,
    body: bodyHtml,
    summary: `<p>${escapeHtml(post.excerpt)}</p>`,
    isPublished: true,
    publishDate: post.publishedAt,
    tags: post.categories,
    image: featuredUrl
      ? { url: featuredUrl, altText: post.featuredImage.alt.slice(0, 512) }
      : undefined,
    metafields: [
      { namespace: "global", key: "title_tag", type: "single_line_text_field", value: seoTitle },
      { namespace: "global", key: "description_tag", type: "single_line_text_field", value: seoDescription },
      { namespace: "migration", key: "wordpress_id", type: "number_integer", value: String(post.wordpressId) },
      { namespace: "migration", key: "source_path", type: "single_line_text_field", value: post.sourcePath },
      { namespace: "migration", key: "modified_at", type: "date_time", value: post.modifiedAt },
    ],
  };
}

async function upsertArticles(source, blog, state) {
  const existing = await existingArticles();
  let completed = 0;
  for (const post of [...source.posts].reverse()) {
    const bodyHtml = rewriteBodyImages(post.bodyHtml, state);
    const input = articleInput(post, blog.id, bodyHtml, state);
    const current = existing.get(post.slug);
    let article;

    if (current) {
      const updateInput = { ...input };
      delete updateInput.blogId;
      const data = await adminGraphql(
        `mutation UpdateArticle($id: ID!, $article: ArticleUpdateInput!) {
          articleUpdate(id: $id, article: $article) {
            article { id handle title image { url } }
            userErrors { field message code }
          }
        }`,
        { id: current.id, article: updateInput },
      );
      assertNoUserErrors(data.articleUpdate, `articleUpdate ${post.slug}`);
      article = data.articleUpdate.article;
    } else {
      const data = await adminGraphql(
        `mutation CreateArticle($article: ArticleCreateInput!) {
          articleCreate(article: $article) {
            article { id handle title image { url } }
            userErrors { field message code }
          }
        }`,
        { article: input },
      );
      assertNoUserErrors(data.articleCreate, `articleCreate ${post.slug}`);
      article = data.articleCreate.article;
    }

    state.articles[post.slug] = {
      id: article.id,
      sourcePath: post.sourcePath,
      importedAt: new Date().toISOString(),
    };
    await writeState(state);
    completed += 1;
    console.log(`Articles: ${completed}/${source.posts.length} ${post.slug}`);
  }
}

async function readCatalogImages() {
  const catalog = JSON.parse(await readFile(CATALOG_FILE, "utf8"));
  const sources = [
    ...new Set(catalog.flatMap((product) => product.images ?? []).filter(isWordPressImage)),
  ];
  return { catalog, sources };
}

async function rewriteCatalogImages(catalog, state) {
  let rewritten = 0;
  for (const product of catalog) {
    product.images = (product.images ?? []).map((source) => {
      if (!isWordPressImage(source)) return source;
      const destination = state.images[source]?.url;
      if (!destination) throw new Error(`Missing migrated catalog image for ${source}`);
      rewritten += 1;
      return destination;
    });
  }
  await writeFile(CATALOG_FILE, `${JSON.stringify(catalog, null, 2)}\n`);
  return rewritten;
}

async function writeLegacyImageRedirects(state) {
  const redirects = {};
  for (const source of Object.keys(state.images).filter(isWordPressImage)) {
    const destination = state.images[source]?.url;
    if (destination) redirects[new URL(source).pathname] = destination;
  }
  const sorted = Object.fromEntries(Object.entries(redirects).sort(([left], [right]) => left.localeCompare(right)));
  await writeFile(IMAGE_REDIRECTS_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
}

async function importToShopify() {
  if (!ADMIN_TOKEN && (!CLIENT_ID || !CLIENT_SECRET)) {
    throw new Error(
      "Missing Shopify Admin credentials. Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.",
    );
  }
  await getAdminToken();
  const { source, inspection } = await prepare();
  const { catalog, sources: catalogImages } = await readCatalogImages();
  const externalImages = [...new Set([...inspection.externalImages, ...catalogImages])];
  const state = await readState();
  const blog = await findOrCreateBlog();
  console.log(`Shopify blog: ${blog.title} (${blog.handle})`);
  await uploadExternalImages(externalImages, state);
  await uploadDataImages(inspection.dataImages, state);
  await upsertArticles(source, blog, state);
  const rewrittenCatalogImages = await rewriteCatalogImages(catalog, state);
  await writeLegacyImageRedirects(state);
  console.log(
    `Import complete: ${source.posts.length} articles, ${externalImages.length + inspection.dataImages.size} images, and ${rewrittenCatalogImages} catalog URLs rewritten.`,
  );
}

async function storefrontGraphql(query) {
  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN are required for verification.");
  }
  const response = await fetch(`https://${STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) throw new Error(`Storefront API error: ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

async function verify() {
  const source = await fetchWordPressSource();
  const { catalog } = await readCatalogImages();
  const data = await storefrontGraphql(`query {
    articles(first: 250) {
      nodes { handle title contentHtml publishedAt image { url } blog { handle } }
    }
  }`);
  const articles = new Map(
    data.articles.nodes
      .filter((article) => article.blog.handle === BLOG_HANDLE)
      .map((article) => [article.handle, article]),
  );
  const missing = source.posts.filter((post) => !articles.has(post.slug)).map((post) => post.slug);
  const unexpected = [...articles.keys()].filter((slug) => !source.posts.some((post) => post.slug === slug));
  const titleMismatches = source.posts
    .filter((post) => articles.get(post.slug)?.title !== post.title)
    .map((post) => post.slug);
  const hotlinks = [...articles.values()]
    .filter((article) => /wp-content\/uploads|data:image\//i.test(article.contentHtml))
    .map((article) => article.handle);
  const nonShopifyContentImages = [...articles.values()].flatMap((article) =>
    [...article.contentHtml.matchAll(/<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)')[^>]*>/gi)]
      .map((match) => match[1] ?? match[2])
      .filter((url) => !isShopifyImage(url))
      .map((url) => ({ article: article.handle, url })),
  );
  const missingFeaturedImages = source.posts
    .filter((post) => post.featuredImage !== null && !articles.get(post.slug)?.image?.url)
    .map((post) => post.slug);
  const nonShopifyFeaturedImages = [...articles.values()]
    .filter((article) => article.image?.url && !isShopifyImage(article.image.url))
    .map((article) => ({ article: article.handle, url: article.image.url }));
  const catalogWordPressImages = [
    ...new Set(catalog.flatMap((product) => product.images ?? []).filter(isWordPressImage)),
  ];
  const nonShopifyCatalogImages = catalog.flatMap((product) =>
    (product.images ?? [])
      .filter((url) => /^https?:\/\//i.test(url) && !isShopifyImage(url))
      .map((url) => ({ product: product.handle, url })),
  );
  const report = {
    expected: source.posts.length,
    actual: articles.size,
    missing,
    unexpected,
    titleMismatches,
    hotlinks,
    nonShopifyContentImages,
    missingFeaturedImages,
    nonShopifyFeaturedImages,
    catalogWordPressImages,
    nonShopifyCatalogImages,
  };
  console.log(JSON.stringify(report, null, 2));
  if (
    [
      missing,
      titleMismatches,
      hotlinks,
      nonShopifyContentImages,
      missingFeaturedImages,
      nonShopifyFeaturedImages,
      catalogWordPressImages,
      nonShopifyCatalogImages,
    ].some((items) => items.length > 0)
  ) {
    process.exitCode = 1;
  }
}

try {
  if (command === "prepare") await prepare();
  else if (command === "import") await importToShopify();
  else if (command === "verify") await verify();
  else throw new Error(`Unknown command "${command}". Use prepare, import, or verify.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
