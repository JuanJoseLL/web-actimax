import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { ProductFaq } from "@/components/ProductFaq";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoriaLanding as Categoria } from "@/data/categorias";
import { getAllBlogPosts } from "@/lib/blog";
import { DEPORTE_LABELS, getAllProducts } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { canonicalProductPath } from "@/lib/product-paths";
import { SITE_URL, breadcrumbJsonLd, itemListJsonLd, jsonLd, pageMetadata } from "@/lib/seo";
import type { Product } from "@/lib/taxonomia";

/**
 * Landing de categoría: la grilla de /productos/?tipo=… más el texto que una
 * vista filtrada no tiene (qué es, cuándo se toma, cuántos por distancia,
 * preguntas frecuentes). Todo sale de src/data/categorias.ts; la ruta de cada
 * categoría solo elige cuál pintar.
 *
 * Los datos vienen de getAllProducts y getAllBlogPosts, ambos "use cache",
 * así que la página entera entra en el shell estático y se revalida con las
 * etiquetas `catalog` y `blog` como el home. No añade escrituras ISR nuevas.
 */
export function categoriaMetadata(categoria: Categoria): Metadata {
  return pageMetadata({
    title: categoria.title,
    description: categoria.description,
    path: categoria.path,
  });
}

/* El mismo orden que el catálogo: en stock primero, luego precio. */
function ordenCategoria(a: Product, b: Product): number {
  if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
  return a.price - b.price || a.title.localeCompare(b.title, "es");
}

export function CategoriaLandingSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-6 h-16 w-80" />
      <Skeleton className="mt-6 h-24 max-w-3xl" />
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-6 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export async function CategoriaLandingContent({ categoria }: { categoria: Categoria }) {
  const [products, posts] = await Promise.all([getAllProducts(), getAllBlogPosts()]);
  const propios = products.filter((p) => p.type === categoria.tipo).toSorted(ordenCategoria);
  const porHandle = new Map(products.map((p) => [p.handle, p]));
  /* Un reto solo se muestra si su pack sigue publicado en Shopify. */
  const retos = categoria.retos
    .map((reto) => ({ ...reto, pack: porHandle.get(reto.handle) }))
    .filter((reto): reto is typeof reto & { pack: Product } => reto.pack !== undefined);
  const articulos = categoria.articulos
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is NonNullable<typeof post> => post !== undefined);
  const disponibles = propios.filter((p) => p.inStock);
  const desde =
    disponibles.length > 0 ? Math.min(...disponibles.map((p) => p.price)) : null;
  /* Los deportes por los que se puede afinar la grilla: solo los que tienen
     producto, para no enlazar a combinaciones vacías. */
  const deportes = Object.entries(DEPORTE_LABELS).filter(([slug]) =>
    propios.some((p) => p.deportes.includes(slug)),
  );

  return (
    <>
      {propios.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(itemListJsonLd(`Actimax · ${categoria.nombre}`, propios)),
          }}
        />
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Inicio", url: `${SITE_URL}/` },
              { name: "Productos", url: `${SITE_URL}/productos/` },
              { name: categoria.nombre, url: `${SITE_URL}${categoria.path}` },
            ]),
          ),
        }}
      />

      <nav aria-label="Ruta" className="mb-6 font-mono text-[11px] text-tinta/50">
        <Link href="/" className="hover:text-azul hover:underline">
          Inicio
        </Link>
        {" / "}
        <Link href="/productos/" className="hover:text-azul hover:underline">
          Productos
        </Link>
        {" / "}
        <span className="text-tinta/80">{categoria.nombre}</span>
      </nav>

      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        {categoria.kicker}
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-7xl">
        {categoria.titular ?? categoria.nombre}
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-tinta/50">
        {propios.length === 1 ? "1 producto" : `${propios.length} productos`}
        {desde !== null ? ` · desde ${formatCOP(desde)}` : ""}
        {" · envío a toda Colombia"}
      </p>

      <div className="mt-6 flex max-w-3xl flex-col gap-4 text-base leading-relaxed text-tinta/80">
        {categoria.intro.map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </div>

      {deportes.length > 0 ? (
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <span className="w-full font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-tinta/55 sm:w-auto sm:pr-2">
            Ver por deporte
          </span>
          {deportes.map(([slug, label]) => (
            <Link
              key={slug}
              href={`/productos/?tipo=${categoria.tipo}&deporte=${slug}`}
              className="rounded-sm border border-tinta/15 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-tinta/70 transition-colors hover:border-azul hover:text-azul"
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}

      {propios.length === 0 ? (
        <div className="mt-16 rounded-xl bg-muted px-6 py-16 text-center">
          <p className="font-display text-3xl font-bold uppercase italic text-muted-foreground">
            Estamos reponiendo esta categoría
          </p>
          <Button asChild variant="race" size="lg" className="mt-6">
            <Link href="/productos/">Ver todo el catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {propios.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      )}

      <div className="mt-16 flex max-w-3xl flex-col gap-12">
        {categoria.secciones.map((seccion) => (
          <section key={seccion.titulo}>
            <h2 className="font-display text-3xl font-extrabold uppercase italic leading-tight">
              {seccion.titulo}
            </h2>
            <div className="mt-4 flex flex-col gap-4 text-[15px] leading-relaxed text-tinta/80">
              {seccion.parrafos.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </div>
          </section>
        ))}

        {retos.length > 0 ? (
          <section>
            <h2 className="font-display text-3xl font-extrabold uppercase italic leading-tight">
              {categoria.retosTitulo ??
                `Cuántos ${categoria.nombre.toLocaleLowerCase("es-CO")} según la distancia`}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-tinta/80">
              {categoria.retosIntro ??
                `Cada Energy Pack trae ${categoria.articulo} ${categoria.nombre.toLocaleLowerCase("es-CO")} ya contados para su reto, junto con la bebida de antes y la recuperación de después. Esta es la referencia que usan:`}
            </p>
            <ul className="mt-5 divide-y divide-tinta/10 border-y border-tinta/10">
              {retos.map((reto) => (
                <li key={reto.handle} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="w-44 shrink-0 font-display text-lg font-extrabold uppercase italic">
                    {reto.reto}
                  </span>
                  <span className="text-[15px] leading-relaxed text-tinta/80">
                    {reto.pauta}{" "}
                    <Link
                      href={canonicalProductPath(reto.pack.handle)}
                      className="whitespace-nowrap font-semibold text-azul underline-offset-4 hover:underline"
                    >
                      Ver {reto.pack.title} →
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <ProductFaq items={categoria.faqs} />

      {articulos.length > 0 ? (
        <aside className="mt-16 max-w-3xl">
          <Separator className="mb-8" />
          <h2 className="font-display text-2xl font-bold uppercase italic">
            Sigue leyendo en el blog
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {articulos.map((post) => (
              <li key={post.slug}>
                <Link
                  href={post.path}
                  className="font-semibold text-azul underline-offset-4 hover:underline"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <div className="mt-14 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="race" size="lg">
          <Link href="/productos/">
            Ver todo el catálogo
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/productos/comparar/">Comparar Energy Packs</Link>
        </Button>
      </div>
    </>
  );
}
