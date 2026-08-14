import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlogArticle } from "@/components/blog/BlogArticle";
import { BlogListing } from "@/components/blog/BlogListing";
import { BlogPageSkeleton } from "@/components/blog/BlogPageSkeleton";
import {
  BLOG_CACHE_LIFE,
  getAllBlogPosts,
  getBlogCategories,
  getBlogCategory,
  getBlogPost,
  isRootBlogPost,
} from "@/lib/blog";
import { DEFAULT_OG_IMAGE, pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const posts = (await getAllBlogPosts()).filter((post) => !isRootBlogPost(post));
  return [
    ...posts.map((post) => ({ slug: post.slug })),
    ...getBlogCategories().map((category) => ({ slug: category.slug })),
  ];
}

/**
 * Los artículos viven en Shopify, no en un JSON del repo, así que saber si un
 * slug existe obliga a esperar un dato. Se pregunta al listado completo, que
 * es una sola entrada de caché, y no a getBlogPost, que etiqueta
 * `blog:<slug>`: si se validara con este último, cada slug que tantee un bot
 * escribiría su propia entrada de caché, que es justo lo que hay que evitar.
 */
async function blogSlugExists(slug: string): Promise<boolean> {
  if (getBlogCategory(slug) !== undefined) return true;
  const posts = await getAllBlogPosts();
  return posts.some((post) => post.slug === slug && !isRootBlogPost(post));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  /* Filtrar antes de entrar al "use cache" evita que un slug inventado deje
     rastro en la caché, tanto en esta función como en getBlogPost. */
  if (!(await blogSlugExists(slug))) return { title: "Entrada no encontrada | Actimax" };
  return blogEntryMetadata(slug);
}

async function blogEntryMetadata(slug: string): Promise<Metadata> {
  "use cache";
  cacheTag("blog");
  cacheLife(BLOG_CACHE_LIFE);

  const category = getBlogCategory(slug);
  if (category !== undefined) {
    return pageMetadata({
      title: `${category.name} | Blog Actimax`,
      description: `Artículos de ${category.name.toLocaleLowerCase("es-CO")} para deportistas.`,
      path: category.path,
    });
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
        images:
          post.image !== null
            ? [{ url: post.image.url, alt: post.image.altText ?? post.title }]
            : [DEFAULT_OG_IMAGE],
      },
    };
  }
  return { title: "Entrada no encontrada | Actimax" };
}

type BlogParams = Promise<{ slug: string }>;

export default async function BlogPostPage({
  params,
}: {
  params: BlogParams;
}) {
  const { slug } = await params;
  /* El estado HTTP se congela en 200 apenas se abre el <Suspense>, así que un
     notFound() de adentro pintaba la interfaz del 404 sobre una respuesta 200
     y hasta lo que Next guardaba en caché era ese 200: /blog/loquesea/ era un
     soft 404 permanente. Resolviéndolo antes del límite, lo cacheado pasa a
     ser un 404 de verdad.

     Queda un 200 en la primerísima visita a una URL nunca vista, porque con
     Cache Components toda ruta dinámica sirve primero su App Shell; ese HTML
     lleva <meta name="robots" content="noindex">, así que no se indexa. La
     única forma documentada de evitar también ese primero es `proxy`, que
     corre antes de resolver la ruta y necesitaría la lista de slugs válidos
     de toda la raíz del sitio fuera de la caché de datos.

     El costo del chequeo: los ~90 slugs de generateStaticParams siguen
     prerenderizados y no pagan nada, pero un artículo publicado después del
     build pierde el shell instantáneo y espera el listado —un acierto de
     caché, no una consulta a Shopify— antes del primer byte. */
  if (!(await blogSlugExists(slug))) notFound();

  return (
    <Suspense fallback={<BlogPageSkeleton />}>
      <BlogPostContent slug={slug} />
    </Suspense>
  );
}

async function BlogPostContent({ slug }: { slug: string }) {
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
