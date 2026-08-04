import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyBox } from "@/components/BuyBox";
import { ImageGallery } from "@/components/ImageGallery";
import { ProductFaq } from "@/components/ProductFaq";
import { ProductCard } from "@/components/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEPORTE_LABELS,
  MOMENTO_LABELS,
  getAllProducts,
  getProduct,
  typeLabel,
} from "@/lib/catalog";
import { ProductReviews } from "@/components/ProductReviews";
import { productFaq } from "@/lib/product-faq";
import { canonicalProductPath } from "@/lib/product-paths";
import { getProductReviews } from "@/lib/reviews";
import {
  DEFAULT_OG_IMAGE,
  SITE_URL,
  breadcrumbJsonLd,
  jsonLd,
  productJsonLd,
  productUrl,
} from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (product === undefined) return { title: "Producto no encontrado — Actimax" };
  return {
    title: `${product.title} — Actimax`,
    description: product.excerpt,
    alternates: { canonical: canonicalProductPath(product.handle) },
    openGraph: {
      title: `${product.title} — Actimax`,
      description: product.excerpt,
      url: canonicalProductPath(product.handle),
      images:
        product.images.length > 0
          ? [{ url: product.images[0], alt: product.title }]
          : [DEFAULT_OG_IMAGE],
    },
  };
}

type ProductParams = Promise<{ handle: string }>;

export default function ProductPage({
  params,
}: {
  params: ProductParams;
}) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent params={params} />
    </Suspense>
  );
}

async function ProductPageContent({ params }: { params: ProductParams }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (product === undefined) notFound();

  const reviews = getProductReviews(product.handle);
  const all = await getAllProducts();
  const related = all
    .filter(
      (p) =>
        p.handle !== product.handle &&
        ((product.type !== null && p.type === product.type) ||
          p.momentos.some((m) => product.momentos.includes(m))),
    )
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, reviews)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Inicio", url: `${SITE_URL}/` },
              { name: typeLabel(product.type), url: `${SITE_URL}/productos/` },
              { name: product.title, url: productUrl(product.handle) },
            ]),
          ),
        }}
      />
      <nav aria-label="Ruta" className="mb-6 font-mono text-[11px] text-tinta/50">
        <Link href="/" className="hover:text-azul hover:underline">
          Inicio
        </Link>
        {" / "}
        <Link
          href={product.type !== null ? `/productos?tipo=${product.type}` : "/productos"}
          className="hover:text-azul hover:underline"
        >
          {typeLabel(product.type)}
        </Link>
        {" / "}
        <span className="text-tinta/80">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <ImageGallery images={product.images} alt={product.title} />

        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
            {typeLabel(product.type)}
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-[0.95] sm:text-5xl">
            {product.title}
          </h1>

          {product.momentos.length > 0 || product.deportes.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.momentos.map((m) => (
                <Badge
                  key={m}
                  asChild
                  className="h-10 rounded-sm bg-accent/35 px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent sm:h-6"
                >
                  <Link href={`/productos?momento=${m}`}>{MOMENTO_LABELS[m]} del esfuerzo</Link>
                </Badge>
              ))}
              {product.deportes.map((d) => (
                <Badge
                  key={d}
                  asChild
                  variant="secondary"
                  className="h-10 rounded-sm px-3 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground sm:h-6"
                >
                  <Link href={`/productos?deporte=${d}`}>{DEPORTE_LABELS[d] ?? d}</Link>
                </Badge>
              ))}
            </div>
          ) : null}

          {product.shortDescriptionHtml !== "" ? (
            <div
              className="prose-actimax mt-6 text-sm text-tinta/80"
              dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
            />
          ) : null}

          <div className="mt-8">
            <BuyBox
              product={{
                variantId: product.variantId,
                handle: product.handle,
                title: product.title,
                price: product.price,
                regularPrice: product.regularPrice,
                image: product.images[0] ?? null,
                options: product.options,
                variants: product.variants,
              }}
              inStock={product.inStock}
              showPrice
            />
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-tinta/50">
              Envíos a toda Colombia · Checkout seguro con Shopify
            </p>
          </div>
        </div>
      </div>

      {product.descriptionHtml !== "" ? (
        <section className="mt-16 max-w-3xl">
          <Separator className="mb-8" />
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
            {product.descriptionKind === "recomendaciones" ? "Guía de uso" : "Ficha del producto"}
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold uppercase italic">
            {product.descriptionKind === "recomendaciones"
              ? "Recomendaciones de uso"
              : "Descripción detallada"}
          </h2>
          <div
            className="prose-actimax mt-5 text-sm text-tinta/80"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </section>
      ) : null}

      <ProductReviews reviews={reviews} />

      <ProductFaq items={productFaq(product)} />

      {related.length > 0 ? (
        <section className="mt-16">
          <Separator className="mb-8" />
          <h2 className="font-display text-3xl font-extrabold uppercase italic">
            También te puede servir
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.handle} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
      <Skeleton className="mb-6 h-3 w-48" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
        <Skeleton className="aspect-square w-full" />
        <div className="py-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-12 w-4/5 sm:h-16" />
          <Skeleton className="mt-6 h-5 w-2/3" />
          <Skeleton className="mt-3 h-5 w-1/2" />
          <Skeleton className="mt-8 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
