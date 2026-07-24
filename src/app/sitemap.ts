import type { MetadataRoute } from "next";
import { getAllBlogPosts, getBlogCategories } from "@/lib/blog";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://actimax.com.co";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllBlogPosts();

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/blog/`, changeFrequency: "weekly", priority: 0.8 },
    ...getBlogCategories().map((category) => ({
      url: `${SITE_URL}${category.path}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}${post.path}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: post.image !== null ? [post.image.url] : undefined,
    })),
  ];
}
