import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { BlogListing } from "@/components/blog/BlogListing";
import {
  BLOG_CACHE_LIFE,
  POSTS_PER_PAGE,
  getAllBlogPosts,
  getBlogPostsPage,
} from "@/lib/blog";

function parsePage(numero: string): number | undefined {
  if (!/^\d{1,4}$/.test(numero)) return undefined;
  return Number.parseInt(numero, 10);
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  // La página 1 vive en /blog/; aquí solo se generan las siguientes.
  return Array.from({ length: totalPages - 1 }, (_, index) => ({
    numero: String(index + 2),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const page = parsePage((await params).numero);
  if (page === undefined) return { title: "Página no encontrada | Actimax" };

  return {
    title: `Blog de nutrición deportiva — página ${page} | Actimax`,
    description:
      "Consejos de nutrición deportiva: geles, hidratación y recuperación para corredores, ciclistas y triatletas.",
    alternates: { canonical: `/blog/pagina/${page}/` },
  };
}

export default async function BlogPaginaPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const page = parsePage((await params).numero);
  if (page === undefined || page === 0) notFound();
  if (page === 1) redirect("/blog/");

  const { posts, totalPages } = await getBlogPostsPage(page);
  if (posts.length === 0) notFound();

  return <BlogListing posts={posts} pagination={{ page, totalPages }} />;
}
