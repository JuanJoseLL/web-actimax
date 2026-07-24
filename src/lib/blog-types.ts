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
