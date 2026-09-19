import { getAllBlogPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character] ?? character;
  });
}

export async function GET(): Promise<Response> {
  const posts = await getAllBlogPosts();
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${post.path}`;
      const image = post.image?.url;
      return [
        "<item>",
        `<title>${xml(post.title)}</title>`,
        `<link>${xml(url)}</link>`,
        `<guid isPermaLink="true">${xml(url)}</guid>`,
        `<pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `<description>${xml(post.excerpt)}</description>`,
        `<category>${xml(post.category)}</category>`,
        `<dc:creator>${xml(post.author)}</dc:creator>`,
        ...(image
          ? [`<media:content url="${xml(image)}" medium="image" />`]
          : []),
        "</item>",
      ].join("");
    })
    .join("");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    "<channel>",
    "<title>Blog Actimax</title>",
    `<link>${SITE_URL}/blog/</link>`,
    "<description>Nutrición deportiva, hidratación y estrategia para corredores, ciclistas y triatletas.</description>",
    "<language>es-CO</language>",
    `<atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
    items,
    "</channel>",
    "</rss>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}
