import Image from "next/image";
import Link from "next/link";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { Card, CardContent } from "@/components/ui/card";
import { formatPostDate, type BlogPost } from "@/lib/blog";

export function BlogListing({
  posts,
  eyebrow = "Blog · Contra el muro",
  title = "Consejos del equipo",
  description = "Guías prácticas de nutrición deportiva escritas para que rindas más y te recuperes mejor. Sin humo, con ciencia.",
  pagination,
}: {
  posts: BlogPost[];
  eyebrow?: string;
  title?: string;
  description?: string;
  pagination?: { page: number; totalPages: number };
}) {
  // El destacado "Más reciente" solo tiene sentido en la primera página.
  const showHero = pagination === undefined || pagination.page === 1;
  const first = showHero ? posts[0] : undefined;
  const rest = showHero ? posts.slice(1) : posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-7xl">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-tinta/70">{description}</p>

      {first !== undefined ? (
        <Card className="hero-course mt-12 overflow-hidden py-0 text-white transition-transform hover:-translate-y-0.5">
          <CardContent className="p-0">
            <Link href={first.path} className="group grid min-h-96 md:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col justify-center p-6 sm:p-12">
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  {first.category} · {first.featured ? "Destacado" : "Más reciente"}
                </span>
                <h2 className="mt-4 max-w-3xl font-display text-4xl font-extrabold uppercase italic leading-[0.98] group-hover:text-accent sm:text-6xl">
                  {first.title}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">{first.excerpt}</p>
                <p className="mt-6 font-mono text-[11px] text-white/50">
                  {formatPostDate(first.date)} · {first.minutes} min de lectura
                </p>
              </div>
              {first.image !== null ? (
                <div className="relative min-h-72 overflow-hidden md:min-h-full">
                  <Image
                    src={first.image.url}
                    alt={first.image.altText ?? first.title}
                    fill
                    priority
                    sizes="(min-width: 1280px) 517px, (min-width: 768px) 38vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}
            </Link>
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <p className="mt-12 rounded-md border border-dashed p-8 text-sm text-muted-foreground">
          No hay artículos publicados en esta categoría.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {rest.map((post) => (
          <Card key={post.id} className="overflow-hidden py-0 transition-colors hover:border-primary">
            <CardContent className="h-full p-0">
              <Link href={post.path} className="group grid h-full min-h-72 sm:grid-cols-[0.72fr_1fr]">
                {post.image !== null ? (
                  <div className="relative min-h-56 overflow-hidden sm:min-h-full">
                    <Image
                      src={post.image.url}
                      alt={post.image.altText ?? post.title}
                      fill
                      sizes="(min-width: 1280px) 251px, (min-width: 768px) 20vw, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                ) : null}
                <div className="flex flex-col p-7">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                    {post.category}
                  </span>
                  <h2 className="mt-3 font-display text-3xl font-bold uppercase italic leading-[1.02] group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <p className="mt-auto pt-5 font-mono text-[11px] text-muted-foreground">
                    {formatPostDate(post.date)} · {post.minutes} min de lectura
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination !== undefined ? (
        <BlogPagination page={pagination.page} totalPages={pagination.totalPages} />
      ) : null}
    </div>
  );
}
