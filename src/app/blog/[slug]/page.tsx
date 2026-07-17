import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPostDate, getPost, posts } from "@/data/blog";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (post === undefined) return { title: "Entrada no encontrada — Actimax" };
  return { title: `${post.title} — Blog Actimax`, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (post === undefined) notFound();

  const others = posts.filter((p) => p.slug !== post.slug);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <nav aria-label="Ruta" className="mb-8 font-mono text-[11px] text-tinta/50">
        <Link href="/blog" className="hover:text-azul hover:underline">
          ← Volver al blog
        </Link>
      </nav>

      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-azul">
        {post.category}
      </p>
      <h1 className="mt-3 font-display text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl">
        {post.title}
      </h1>
      <p className="mt-4 font-mono text-[11px] text-tinta/50">
        {formatPostDate(post.date)} · {post.minutes} min de lectura
      </p>

      <Separator className="mt-10" />
      <div className="prose-actimax pt-8 text-[15px] text-foreground/85" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

      <Card className="mt-12 bg-muted py-0 text-center">
        <CardContent className="p-8">
          <p className="font-display text-2xl font-bold uppercase italic">¿Listo para tu próximo reto?</p>
          <Button asChild variant="race" size="lg" className="mt-5">
            <Link href="/productos?tipo=kits">Ver Energy Packs</Link>
          </Button>
        </CardContent>
      </Card>

      {others.length > 0 ? (
        <aside className="mt-14">
          <Separator className="mb-8" />
          <h2 className="font-display text-2xl font-bold uppercase italic">Sigue leyendo</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="font-semibold text-azul underline-offset-4 hover:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </article>
  );
}
