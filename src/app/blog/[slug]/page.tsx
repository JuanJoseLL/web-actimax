import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { BlogListing } from "@/components/blog/BlogListing";
import {
  BLOG_CACHE_LIFE,
  getAllBlogPosts,
  getBlogCategories,
  getBlogCategory,
  getBlogPost,
  isRootBlogPost,
} from "@/lib/blog";

export async function generateStaticParams() {
  const posts = (await getAllBlogPosts()).filter((post) => !isRootBlogPost(post));
  return [
    ...posts.map((post) => ({ slug: post.slug })),
    ...getBlogCategories().map((category) => ({ slug: category.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const { slug } = await params;
  const category = getBlogCategory(slug);
  if (category !== undefined) {
    return {
      title: `${category.name} | Blog Actimax`,
      description: `Artículos de ${category.name.toLocaleLowerCase("es-CO")} para deportistas.`,
      alternates: { canonical: category.path },
    };
  }

  const post = await getBlogPost(slug);
  if (post !== undefined && !isRootBlogPost(post)) {
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
  return { title: "Entrada no encontrada | Actimax" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const { slug } = await params;
  const category = getBlogCategory(slug);
  if (category !== undefined) {
    const posts = (await getAllBlogPosts()).filter((candidate) => candidate.tags.includes(category.name));
    return (
      <BlogListing
        posts={posts}
        eyebrow="Blog · Categoría"
        title={category.name}
        description={`Estrategias, guías y consejos de ${category.name.toLocaleLowerCase("es-CO")} para tu próxima meta.`}
      />
    );
  }

  const post = await getBlogPost(slug);
  if (post !== undefined && !isRootBlogPost(post)) {
    const related = (await getAllBlogPosts())
      .filter((candidate) => candidate.slug !== post.slug)
      .filter((candidate) => candidate.tags.some((tag) => post.tags.includes(tag)))
      .slice(0, 3);
    return <BlogArticle post={post} related={related} />;
  }

  notFound();
}
