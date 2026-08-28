import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPostDate, type BlogPost } from "@/lib/blog";
import { CategoriaCta } from "@/components/blog/CategoriaCta";
import { LegacyArticleEnhancements } from "@/components/blog/LegacyArticleEnhancements";
import { BlogNewsletter } from "@/components/blog/BlogNewsletter";

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
    <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-16">
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
            sizes="(min-width: 896px) 896px, 100vw"
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

      <CategoriaCta post={post} />

      <Card className="mt-12 bg-muted py-0 text-center">
        <CardContent className="p-8">
          <p className="font-display text-2xl font-bold uppercase italic">¿Listo para tu próximo reto?</p>
          <Button asChild variant="race" size="lg" className="mt-5">
            <Link href="/productos/?tipo=kits">Ver Energy Packs</Link>
          </Button>
        </CardContent>
      </Card>

      <BlogNewsletter />

      {related.length > 0 ? (
        <aside className="mt-14">
          <Separator className="mb-8" />
          <h2 className="font-display text-2xl font-bold uppercase italic">Sigue leyendo</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {related.map((relatedPost) => (
              <li key={relatedPost.id}>
                <Link
                  href={relatedPost.path}
                  className="font-semibold text-azul underline-offset-4 hover:underline"
                >
                  {relatedPost.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </article>
  );
}
