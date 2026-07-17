import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatPostDate, posts } from "@/data/blog";

export const metadata: Metadata = {
  title: "Blog — Actimax",
  description:
    "Consejos de nutrición deportiva: geles, hidratación y recuperación para corredores, ciclistas y triatletas.",
};

export default function BlogPage() {
  const [first, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Blog · Contra el muro
      </p>
      <h1 className="mt-2 font-display text-6xl font-extrabold uppercase italic leading-none sm:text-7xl">
        Consejos del equipo
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-tinta/70">
        Guías prácticas de nutrición deportiva escritas para que rindas más y te
        recuperes mejor. Sin humo, con ciencia.
      </p>

      {first !== undefined ? (
        <Card className="hero-course mt-12 overflow-hidden py-0 text-white transition-transform hover:-translate-y-0.5">
          <CardContent className="p-0">
            <Link href={`/blog/${first.slug}`} className="group block p-8 sm:p-12">
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                {first.category} · Más reciente
              </span>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold uppercase italic leading-[0.98] group-hover:text-accent sm:text-6xl">
                {first.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{first.excerpt}</p>
              <p className="mt-6 font-mono text-[11px] text-white/50">
                {formatPostDate(first.date)} · {first.minutes} min de lectura
              </p>
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {rest.map((post) => (
          <Card key={post.slug} className="py-0 transition-colors hover:border-primary">
            <CardContent className="p-0">
              <Link href={`/blog/${post.slug}`} className="group flex min-h-60 flex-col p-8">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  {post.category}
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold uppercase italic leading-[1.02] group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <p className="mt-auto pt-5 font-mono text-[11px] text-muted-foreground">
                  {formatPostDate(post.date)} · {post.minutes} min de lectura
                </p>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
