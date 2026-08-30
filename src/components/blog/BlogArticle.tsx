import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { formatPostDate, type BlogPost } from "@/lib/blog";
import { LegacyArticleEnhancements } from "@/components/blog/LegacyArticleEnhancements";
import { BlogNewsletter } from "@/components/blog/BlogNewsletter";
import {
  ProductosDelArticulo,
  ProductosDelArticuloSkeleton,
} from "@/components/blog/ProductosDelArticulo";

/**
 * Las tablas heredadas de WordPress se desbordan en móvil: cada una va dentro
 * de su propio contenedor con scroll y una etiqueta que la numera.
 *
 * El índice sale de un contador y no de recontar el prefijo en cada reemplazo:
 * `replace` llama al reemplazante en orden, y recorrer el artículo entero por
 * tabla convertía esto en O(tablas × largo del HTML).
 */
function wrapTablesForScroll(html: string): string {
  let tableIndex = 0;
  return html.replace(/<table\b[\s\S]*?<\/table>/gi, (table) => {
    tableIndex += 1;
    return `<div class="table-scroll" role="region" aria-label="Tabla desplazable ${tableIndex}" tabindex="0">${table}</div>`;
  });
}

/**
 * El artículo se lee en una columna angosta —la medida cómoda son unos 90
 * caracteres— pero la página no tiene por qué serlo. De `xl` para arriba el
 * texto ocupa la columna izquierda de un max-w-7xl y los productos llenan la
 * derecha; el boletín y "sigue leyendo" salen del contenedor y van a sangre,
 * como las secciones del home.
 */
export function BlogArticle({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const bodyHtml = wrapTablesForScroll(post.bodyHtml);
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Actimax" },
    image: post.image?.url,
    mainEntityOfPage: `https://actimax.com.co${post.path}`,
  }).replace(/</g, "\\u003c");

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-14">
          {/* min-w-0: sin esto la columna del grid se ensancha hasta el elemento
              más ancho del HTML heredado de WordPress (tablas, .macro-grid) y
              la página entera se desborda en móvil. */}
          <article className="mx-auto w-full min-w-0 max-w-4xl xl:mx-0 xl:max-w-none">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
            <nav aria-label="Ruta" className="mb-8 font-mono text-[11px] text-tinta/50">
              <Link href="/blog/" className="hover:text-azul hover:underline">
                ← Volver al blog
              </Link>
            </nav>

            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-azul">
              {post.category}
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold uppercase italic leading-[0.98] sm:text-6xl">
              {post.title}
            </h1>
            <p className="mt-4 font-mono text-[11px] text-tinta/50">
              {formatPostDate(post.date)} · {post.minutes} min de lectura · {post.author}
            </p>

            {post.image !== null ? (
              <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-md bg-muted">
                <Image
                  src={post.image.url}
                  alt={post.image.altText ?? post.title}
                  fill
                  priority
                  sizes="(min-width: 1280px) 840px, (min-width: 896px) 896px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}

            <Separator className="mt-10" />
            <div
              className="prose-actimax prose-blog pt-8 text-[15px] text-foreground/85"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
            {/* key: al navegar de un artículo a otro el componente ocupa la misma
                posición del árbol, así que React lo reusaría y su efecto no volvería
                a correr sobre el HTML nuevo. */}
            <LegacyArticleEnhancements key={post.slug} />
          </article>

          {/* El catálogo es otra entrada de caché: que llegue tarde no debe
              retrasar el texto, que es a lo que vino el lector. */}
          <Suspense fallback={<ProductosDelArticuloSkeleton />}>
            <ProductosDelArticulo post={post} />
          </Suspense>
        </div>
      </div>

      {related.length > 0 ? <SigueLeyendo posts={related} /> : null}

      <BlogNewsletter />
    </>
  );
}

function SigueLeyendo({ posts }: { posts: BlogPost[] }) {
  return (
    <section aria-labelledby="sigue-leyendo" className="border-t border-tinta/10 bg-[#f4f2ec]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
        <p className="section-kicker">Del mismo tema</p>
        <h2
          id="sigue-leyendo"
          className="mt-4 font-display text-4xl font-extrabold uppercase italic leading-[0.9] sm:text-6xl"
        >
          Sigue leyendo
        </h2>

        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={post.path}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-tinta/10 bg-white transition-colors hover:border-azul"
              >
                {post.image !== null ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <Image
                      src={post.image.url}
                      alt={post.image.altText ?? post.title}
                      fill
                      sizes="(min-width: 1280px) 394px, (min-width: 768px) 33vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-azul">
                    {post.category}
                  </span>
                  <h3 className="mt-3 font-display text-2xl font-bold uppercase italic leading-[1.02] group-hover:text-azul">
                    {post.title}
                  </h3>
                  <p className="mt-auto pt-5 font-mono text-[11px] text-tinta/50">
                    {formatPostDate(post.date)} · {post.minutes} min de lectura
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
