import { cacheLife, cacheTag } from "next/cache";
import { fallbackPosts } from "@/data/blog";
import blogPaths from "@/data/blog-paths.json";
import type { BlogCategory, BlogImage, BlogPost } from "@/lib/blog-types";

export * from "@/lib/blog-types";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const BLOG_HANDLE = process.env.SHOPIFY_BLOG_HANDLE ?? "blog";
const API_VERSION = "2026-01";

interface ShopifyArticleNode {
  id: string;
  handle: string;
  title: string;
  excerpt: string | null;
  content?: string;
  contentHtml?: string;
  publishedAt: string;
  tags: string[];
  authorV2: { name: string } | null;
  image: BlogImage | null;
  seo: { title: string | null; description: string | null } | null;
}

interface BlogPathData {
  posts: Array<{
    wordpressId: number;
    wordpressSlug: string;
    slug: string;
    sourcePath: string;
    title: string;
    excerpt: string;
    publishedAt: string;
    categories: string[];
    featuredImage: { source: string; alt: string } | null;
    seoTitle: string;
    seoDescription: string;
  }>;
  categories: BlogCategory[];
}

const pathData = blogPaths as BlogPathData;
const pathsBySlug = new Map(pathData.posts.map((post) => [post.slug, post.sourcePath]));

export const POSTS_PER_PAGE = 12;

// Con el webhook de Shopify (/api/revalidar) la caché se invalida al publicar,
// así que la revalidación periódica puede ser espaciada.
export const BLOG_CACHE_LIFE = { stale: 300, revalidate: 300, expire: 604800 } as const;

const ARTICLE_FIELDS = /* GraphQL */ `
  id
  handle
  title
  excerpt
  publishedAt
  tags
  authorV2 { name }
  image { url altText width height }
  seo { title description }
`;

// El listado solo necesita texto para el resumen y el tiempo de lectura;
// truncar evita descargar el cuerpo completo de todos los artículos.
const ARTICLES_QUERY = /* GraphQL */ `
  query BlogArticles {
    articles(first: 250, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        ${ARTICLE_FIELDS}
        content(truncateAt: 12000)
      }
    }
  }
`;

const ARTICLE_QUERY = /* GraphQL */ `
  query BlogArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        ${ARTICLE_FIELDS}
        contentHtml
      }
    }
  }
`;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}

function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

function postPath(slug: string): string {
  return pathsBySlug.get(slug) ?? `/blog/${slug}/`;
}

function mapArticle(node: ShopifyArticleNode): BlogPost {
  const plainText = node.contentHtml !== undefined ? stripHtml(node.contentHtml) : (node.content ?? "");
  const excerpt = node.excerpt?.trim() || plainText.replace(/\s+/g, " ").slice(0, 280).trim();

  return {
    id: node.id,
    slug: node.handle,
    path: postPath(node.handle),
    title: node.title,
    category: node.tags[0] ?? "Nutrición deportiva",
    tags: node.tags,
    excerpt,
    date: node.publishedAt,
    minutes: readingMinutes(plainText),
    author: node.authorV2?.name ?? "Actimax",
    image: node.image,
    seoTitle: node.seo?.title ?? null,
    seoDescription: node.seo?.description ?? null,
    bodyHtml: node.contentHtml ?? "",
  };
}

async function fetchWordPressFallback(slug: string): Promise<BlogPost | undefined> {
  const source = pathData.posts.find((post) => post.slug === slug);
  if (source === undefined) return undefined;

  try {
    const fields = "id,content";
    const response = await fetch(
      `https://actimax.com.co/wp-json/wp/v2/posts?slug=${encodeURIComponent(source.wordpressSlug)}&_fields=${fields}`,
    );
    if (!response.ok) return undefined;
    const posts = (await response.json()) as Array<{
      id: number;
      content: { rendered: string };
    }>;
    const post = posts[0];
    if (post === undefined) return undefined;

    return {
      id: `wordpress-${post.id}`,
      slug: source.slug,
      path: source.sourcePath,
      title: source.title,
      category: source.categories[0] ?? "Nutrición deportiva",
      tags: source.categories,
      excerpt: source.excerpt,
      date: source.publishedAt,
      minutes: readingMinutes(stripHtml(post.content.rendered)),
      author: "Actimax",
      image:
        source.featuredImage === null
          ? null
          : {
              url: source.featuredImage.source,
              altText: source.featuredImage.alt,
              width: null,
              height: null,
            },
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      bodyHtml: post.content.rendered,
    };
  } catch {
    return undefined;
  }
}

async function storefrontQuery<T>(query: string, variables?: Record<string, string>): Promise<T | null> {
  if (STORE_DOMAIN === undefined || STOREFRONT_TOKEN === undefined) return null;

  try {
    const response = await fetch(`https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`Shopify blog respondió ${response.status}.`);
      return null;
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };
    if (json.errors !== undefined) {
      console.error("No se pudo leer el blog de Shopify.", json.errors);
      return null;
    }
    return json.data ?? null;
  } catch (error) {
    console.error("No se pudo leer el blog de Shopify.", error);
    return null;
  }
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const data = await storefrontQuery<{ articles: { nodes: ShopifyArticleNode[] } }>(ARTICLES_QUERY);
  const nodes = data?.articles.nodes;
  if (nodes === undefined || nodes.length === 0) {
    cacheLife({ stale: 10, revalidate: 10, expire: 60 });
    return fallbackPosts;
  }
  return nodes.map(mapArticle);
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  "use cache";
  cacheTag("blog", `blog:${slug}`);
  cacheLife(BLOG_CACHE_LIFE);

  const data = await storefrontQuery<{
    blog: { articleByHandle: ShopifyArticleNode | null } | null;
  }>(ARTICLE_QUERY, { blogHandle: BLOG_HANDLE, articleHandle: slug });
  const article = data?.blog?.articleByHandle;
  if (article !== undefined && article !== null) return mapArticle(article);

  cacheLife({ stale: 10, revalidate: 10, expire: 60 });
  return fallbackPosts.find((post) => post.slug === slug) ?? fetchWordPressFallback(slug);
}

export async function getBlogPostsPage(page: number): Promise<{
  posts: BlogPost[];
  totalPages: number;
}> {
  const all = await getAllBlogPosts();
  const totalPages = Math.max(1, Math.ceil(all.length / POSTS_PER_PAGE));
  return {
    posts: all.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE),
    totalPages,
  };
}

export function getBlogCategories(): BlogCategory[] {
  return pathData.categories;
}

export function getBlogCategory(slug: string): BlogCategory | undefined {
  return pathData.categories.find((category) => category.slug === slug);
}

export function isRootBlogPost(post: BlogPost): boolean {
  return post.path === `/${post.slug}/`;
}

export function getRootBlogPostSlugs(): string[] {
  return pathData.posts
    .filter((post) => post.sourcePath === `/${post.slug}/`)
    .map((post) => post.slug);
}
