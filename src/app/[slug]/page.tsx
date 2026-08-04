import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { BlogPageSkeleton } from "@/components/blog/BlogPageSkeleton";
import {
  BLOG_CACHE_LIFE,
  getAllBlogPosts,
  getBlogPost,
  getRootBlogPostSlugs,
  isRootBlogPost,
} from "@/lib/blog";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

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
  cacheLife(BLOG_CACHE_LIFE);

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
      images:
        post.image !== null
          ? [{ url: post.image.url, alt: post.image.altText ?? post.title }]
          : [DEFAULT_OG_IMAGE],
    },
  };
}

type BlogParams = Promise<{ slug: string }>;

export default function LegacyRootBlogPost({
  params,
}: {
  params: BlogParams;
}) {
  return (
    <Suspense fallback={<BlogPageSkeleton />}>
      <LegacyRootBlogPostContent params={params} />
    </Suspense>
  );
}

async function LegacyRootBlogPostContent({ params }: { params: BlogParams }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (post === undefined || !isRootBlogPost(post)) notFound();

  const related = (await getAllBlogPosts())
    .filter((candidate) => candidate.slug !== post.slug)
    .filter((candidate) => candidate.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);
  return <BlogArticle post={post} related={related} />;
}
