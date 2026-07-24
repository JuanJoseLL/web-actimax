import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import {
  getAllBlogPosts,
  getBlogPost,
  getRootBlogPostSlugs,
  isRootBlogPost,
} from "@/lib/blog";

export function generateStaticParams() {
  return getRootBlogPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  "use cache";
  cacheTag("blog");
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });

  const post = await getBlogPost((await params).slug);
  if (post === undefined || !isRootBlogPost(post)) return {};

  return {
    title: post.seoTitle ?? `${post.title} | Actimax`,
    description: post.seoDescription ?? post.excerpt,
    alternates: { canonical: post.path },
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      publishedTime: post.date,
      images: post.image !== null ? [{ url: post.image.url, alt: post.image.altText ?? post.title }] : [],
    },
  };
}

export default async function LegacyRootBlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  "use cache";
  cacheTag("blog");
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });

  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (post === undefined || !isRootBlogPost(post)) notFound();

  const related = (await getAllBlogPosts())
    .filter((candidate) => candidate.slug !== post.slug)
    .filter((candidate) => candidate.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);
  return <BlogArticle post={post} related={related} />;
}
