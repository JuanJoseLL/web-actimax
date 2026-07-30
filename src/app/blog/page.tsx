import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { BlogListing } from "@/components/blog/BlogListing";
import { BLOG_CACHE_LIFE, getBlogPostsPage } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog de nutrición deportiva y actividad física | Actimax",
  description:
    "Consejos de nutrición deportiva: geles, hidratación y recuperación para corredores, ciclistas y triatletas.",
  path: "/blog/",
});

export default async function BlogPage() {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const { posts, totalPages } = await getBlogPostsPage(1);
  return <BlogListing posts={posts} pagination={{ page: 1, totalPages }} />;
}
