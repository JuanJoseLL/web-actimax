import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BlogListing } from "@/components/blog/BlogListing";
import { BlogPageSkeleton } from "@/components/blog/BlogPageSkeleton";
import { pageMetadata } from "@/lib/seo";
import { getAllBlogPosts, getBlogPageParams, getBlogPostsPage } from "@/lib/blog";

/* El 404 real exige resolver la URL antes del primer <Suspense> (ver el
   notFound() de abajo), así que la ruta se declara bloqueante en vez de
   volver al soft 404 con estado 200. */
export const instant = false;

function parsePage(numero: string): number | undefined {
  if (!/^\d{1,4}$/.test(numero)) return undefined;
  return Number.parseInt(numero, 10);
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return getBlogPageParams(posts.length);
}

/**
 * Un número de página existe si cae dentro del listado. Se resuelve contra
 * getBlogPostsPage, que sale de getAllBlogPosts —una sola entrada de caché—,
 * así que tantear /blog/pagina/9999/ no deja nada escrito.
 */
async function blogPageExists(page: number): Promise<boolean> {
  const { totalPages } = await getBlogPostsPage(page);
  return page <= totalPages;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numero: string }>;
}): Promise<Metadata> {
  const page = parsePage((await params).numero);
  if (page === undefined || page < 2 || !(await blogPageExists(page))) {
    return { title: "Página no encontrada | Actimax" };
  }

  return pageMetadata({
    title: `Blog de nutrición deportiva — página ${page} | Actimax`,
    description:
      "Consejos de nutrición deportiva: geles, hidratación y recuperación para corredores, ciclistas y triatletas.",
    path: `/blog/pagina/${page}/`,
  });
}

export default async function BlogPaginaPage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const page = parsePage((await params).numero);
  if (page === undefined || page === 0) notFound();
  /* Adentro del <Suspense> este redirect se degradaba a un salto del lado del
     cliente, porque las cabeceras ya iban en camino; acá vuelve a ser un
     redirect HTTP de verdad, que es lo que sigue un buscador. */
  if (page === 1) redirect("/blog/");
  /* Y el notFound() acá arriba deja un 404 real en caché en vez del 200 que
     quedaba antes: bots que van subiendo el número de página encontraban una
     página válida en /blog/pagina/99/. */
  if (!(await blogPageExists(page))) notFound();

  return (
    <Suspense fallback={<BlogPageSkeleton />}>
      <BlogPaginaContent page={page} />
    </Suspense>
  );
}

async function BlogPaginaContent({ page }: { page: number }) {
  const { posts, totalPages } = await getBlogPostsPage(page);
  return <BlogListing posts={posts} pagination={{ page, totalPages }} />;
}
