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

/* El 404 real exige resolver la URL antes del primer <Suspense> (ver el
   notFound() de abajo), así que la ruta se declara bloqueante en vez de
   volver al soft 404 con estado 200. */
export const instant = false;

/* Este segmento captura cualquier URL de un solo tramo que no sea una ruta
   propia (/productos/, /blog/, …), o sea que /en/ y cualquier slug inventado
   caen acá. Las URL heredadas de WordPress que quedaron en la raíz están
   congeladas en un JSON del repo, así que la validación es síncrona y no le
   cuesta una espera a nadie. */
const ROOT_BLOG_SLUGS = new Set(getRootBlogPostSlugs());

export function generateStaticParams() {
  return getRootBlogPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  /* Filtrar acá, fuera del "use cache", es lo que impide que un bot tanteando
     slugs escriba una entrada de caché por cada uno: ni la función cacheada
     de abajo ni getBlogPost, que etiqueta `blog:<slug>`, llegan a correr. */
  if (!ROOT_BLOG_SLUGS.has(slug)) return { title: "Página no encontrada — Actimax" };
  return rootBlogPostMetadata(slug);
}

async function rootBlogPostMetadata(slug: string): Promise<Metadata> {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const post = await getBlogPost(slug);
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

export default async function LegacyRootBlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  /* El notFound() vivía adentro del <Suspense> y para entonces el estado HTTP
     ya iba comprometido en 200: /en/ quedaba como soft 404 permanente, porque
     hasta la respuesta que Next guardaba en caché era un 200. Resolviéndolo
     antes de abrir el límite, lo que queda cacheado es un 404 de verdad.
     Cache Components sigue sirviendo el App Shell —y por tanto un 200— en la
     primerísima visita a una URL nunca vista; ese HTML lleva
     <meta name="robots" content="noindex">, así que no se indexa. */
  if (!ROOT_BLOG_SLUGS.has(slug)) notFound();

  return (
    <Suspense fallback={<BlogPageSkeleton />}>
      <LegacyRootBlogPostContent slug={slug} />
    </Suspense>
  );
}

async function LegacyRootBlogPostContent({ slug }: { slug: string }) {
  const post = await getBlogPost(slug);
  /* El slug está en el JSON pero el artículo pudo desaparecer de Shopify: es
     un caso residual sobre una URL que sí existió, no sobre basura. */
  if (post === undefined || !isRootBlogPost(post)) notFound();

  const related = (await getAllBlogPosts())
    .filter((candidate) => candidate.slug !== post.slug)
    .filter((candidate) => candidate.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);
  return <BlogArticle post={post} related={related} />;
}
