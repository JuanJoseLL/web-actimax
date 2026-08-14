import { cacheLife, cacheTag } from "next/cache";
import { fallbackPosts } from "@/data/blog";
import blogPaths from "@/data/blog-paths.json";
import { POSTS_PER_PAGE } from "@/lib/blog-pagination";
import type { BlogCategory, BlogImage, BlogPost } from "@/lib/blog-types";

export * from "@/lib/blog-types";
export { getBlogPageParams, POSTS_PER_PAGE } from "@/lib/blog-pagination";

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
    slug: string;
    sourcePath: string;
  }>;
  categories: BlogCategory[];
}

const pathData = blogPaths as BlogPathData;
const pathsBySlug = new Map(pathData.posts.map((post) => [post.slug, post.sourcePath]));

// Shopify no emite webhooks de artículos (ver /api/revalidar), así que sin una
// ventana corta publicar dependería de que alguien se acuerde de abrir el
// marcador con clave. 10 min es barato acá aunque no lo fuera para el catálogo:
// un artículo publicado genera los mismos bytes en cada regeneración, y Vercel
// no cobra escritura ISR cuando el contenido no cambió. Lo que gasta son
// invocaciones, que sobran. El marcador sigue sirviendo para no esperar.
export const BLOG_CACHE_LIFE = { stale: 600, revalidate: 600, expire: 604800 } as const;

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
const READING_SAMPLE_CHARS = 12000;

const ARTICLES_QUERY = /* GraphQL */ `
  query BlogArticles($after: String) {
    articles(first: 250, after: $after, sortKey: PUBLISHED_AT, reverse: true) {
      nodes {
        ${ARTICLE_FIELDS}
        content(truncateAt: ${READING_SAMPLE_CHARS})
      }
      pageInfo {
        hasNextPage
        endCursor
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

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  deg: "°",
};

/** Un resumen es texto plano: las entidades tienen que llegar ya resueltas. */
function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (!code.startsWith("#")) {
      return NAMED_ENTITIES[code.toLowerCase()] ?? match;
    }
    const isHex = code[1] === "x" || code[1] === "X";
    const value = Number.parseInt(isHex ? code.slice(2) : code.slice(1), isHex ? 16 : 10);
    /* Un código fuera de rango hace explotar fromCodePoint, y un resumen del
       blog no es motivo para tumbar la página. */
    if (!Number.isInteger(value) || value <= 0 || value > 0x10ffff) return match;
    return String.fromCodePoint(value);
  });
}

function stripHtml(html: string): string {
  /* Lo que va dentro de <script> y <style> no es texto del artículo: sin
     sacarlo, un artículo heredado con CSS embebido abre su resumen con
     reglas de estilo. */
  return decodeEntities(
    html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "),
  );
}

/**
 * El listado solo alcanza a ver los primeros caracteres de cada artículo,
 * porque la consulta los trunca para no bajarse el blog entero. La página del
 * artículo cuenta sobre esa misma ventana normalizada: si midiera el texto
 * completo, un mismo artículo anunciaría dos tiempos de lectura distintos.
 */
function readingMinutes(content: string): number {
  const sample = content.replace(/\s+/g, " ").trim().slice(0, READING_SAMPLE_CHARS);
  const words = sample.split(" ").filter(Boolean).length;
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

  interface ArticlesPage {
    articles: {
      nodes: ShopifyArticleNode[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }

  const nodes: ShopifyArticleNode[] = [];
  let after: string | undefined;
  /* Shopify entrega 250 por página: sin recorrer el cursor, el artículo 251
     desaparecía del listado sin que nadie se enterara. El tope de vueltas es
     un seguro contra un cursor que se repita, no un límite pensado. */
  for (let page = 0; page < 10; page += 1) {
    const data = await storefrontQuery<ArticlesPage>(
      ARTICLES_QUERY,
      after === undefined ? undefined : { after },
    );
    /* Si falla una página posterior nos quedamos con lo que ya se leyó: medio
       listado es mejor que ninguno, y el respaldo local solo entra si no
       llegó nada. */
    if (data === null) break;
    nodes.push(...data.articles.nodes);
    const { hasNextPage, endCursor } = data.articles.pageInfo;
    if (!hasNextPage || endCursor === null) break;
    after = endCursor;
  }

  if (nodes.length === 0) {
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
  return fallbackPosts.find((post) => post.slug === slug);
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
