import blogPaths from "../data/blog-paths.json";
import type { BlogPost } from "./blog-types";
import { normalize } from "./palette-search";

const blogRoutes = new Set([
  ...blogPaths.posts.map((post) => post.sourcePath.replace(/\/$/, "")),
  ...blogPaths.categories.map((category) => category.path.replace(/\/$/, "")),
]);

export function isBlogPath(path: string): boolean {
  const pathname = path.replace(/\/$/, "");
  return pathname === "/blog" || pathname.startsWith("/blog/") || blogRoutes.has(pathname);
}

const STOP_WORDS = new Set("a al como con cual cuales cuando de del el en es la las lo los o para por que se sin su un una unos unas y debo puedo consumir tomar usar".split(" "));

function words(text: string): string[] {
  return normalize(text).match(/[a-z0-9]+/g) ?? [];
}

export type BlogSearchResult = Pick<BlogPost, "path" | "title" | "excerpt" | "category" | "minutes">;

/** Las preguntas se buscan por sus temas; el título pesa más que el cuerpo. */
export function searchBlogPosts(posts: BlogPost[], query: string): BlogSearchResult[] {
  const tokens = [...new Set(words(query).filter((word) => !STOP_WORDS.has(word)))];
  if (query.trim() && tokens.length === 0) return [];
  const asksHowToUse = words(query).some((word) => ["consumir", "tomar", "usar"].includes(word));
  return posts.map((post) => {
    const title = normalize(post.title);
    const topics = normalize([post.category, ...post.tags].join(" "));
    const excerpt = normalize(post.excerpt);
    const body = normalize(post.searchText ?? post.bodyHtml.replace(/<[^>]*>/g, " "));
    let score = 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 8;
      else if (topics.includes(token)) score += 5;
      else if (excerpt.includes(token)) score += 3;
      else if (body.includes(token)) score += 1;
      else return { post, score: 0 };
    }
    // “Consumir”, “tomar” y “usar” expresan la misma intención en estas guías.
    if (asksHowToUse && /\b(consum\w*|tomar\w*|usar\w*|usarlos|usarlas)\b/.test(title)) score += 6;
    return { post, score: tokens.length === 0 ? 1 : score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ post: { path, title, excerpt, category, minutes } }) => ({ path, title, excerpt, category, minutes }));
}
