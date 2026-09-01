export interface BlogImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface BlogPost {
  id: string;
  slug: string;
  path: string;
  title: string;
  featured: boolean;
  category: string;
  tags: string[];
  excerpt: string;
  date: string;
  minutes: number;
  author: string;
  image: BlogImage | null;
  seoTitle: string | null;
  seoDescription: string | null;
  bodyHtml: string;
}

export function isFeaturedBlogTag(tag: string): boolean {
  return tag.trim().toLowerCase() === "destacado";
}

export function prioritizeFeaturedBlogPost<T extends { featured: boolean }>(posts: readonly T[]): T[] {
  const featuredIndex = posts.findIndex((post) => post.featured);
  if (featuredIndex <= 0) return [...posts];

  return [
    posts[featuredIndex],
    ...posts.slice(0, featuredIndex),
    ...posts.slice(featuredIndex + 1),
  ];
}

export interface BlogCategory {
  slug: string;
  name: string;
  path: string;
}

export function formatPostDate(iso: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(iso)
    ? new Date(`${iso}T12:00:00-05:00`)
    : new Date(iso);

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}
