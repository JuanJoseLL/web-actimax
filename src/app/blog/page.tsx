import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { BlogListing } from "@/components/blog/BlogListing";
import { getAllBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog de nutrición deportiva y actividad física | Actimax",
  description:
    "Consejos de nutrición deportiva: geles, hidratación y recuperación para corredores, ciclistas y triatletas.",
  alternates: { canonical: "/blog/" },
};

export default async function BlogPage() {
  "use cache";
  cacheTag("blog");
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });

  return <BlogListing posts={await getAllBlogPosts()} />;
}
