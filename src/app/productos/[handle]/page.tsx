import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BuyBox } from "@/components/BuyBox";
import { GuiaUso } from "@/components/GuiaUso";
import { ImageGallery } from "@/components/ImageGallery";
import { PackContenido } from "@/components/PackContenido";
import { PaymentMethods } from "@/components/PaymentMethods";
import { ProductFaq } from "@/components/ProductFaq";
import { ProductCard } from "@/components/ProductCard";
import { ProductPrice, ProductPurchaseProvider } from "@/components/ProductPurchase";
import { ProductRating } from "@/components/ProductRating";
import { ProductTrust } from "@/components/ProductTrust";
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
import { ProductReviews, ProductReviewsCompact } from "@/components/ProductReviews";
import { productFaq } from "@/lib/product-faq";
import { canonicalProductPath } from "@/lib/product-paths";
import { getProductReviews, reviewsSummary } from "@/lib/reviews";
import {
  DEFAULT_OG_IMAGE,
  SITE_URL,
  breadcrumbJsonLd,
  jsonLd,
  productJsonLd,
  productUrl,
} from "@/lib/seo";

/* El 404 real exige resolver la URL antes del primer <Suspense> (ver el
   notFound() de abajo), así que la ruta se declara bloqueante en vez de
   volver al soft 404 con estado 200. Los handles de generateStaticParams
   siguen prerenderizados; solo los desconocidos pagan la espera. */
export const instant = false;

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

export default async function ProductPage({
  params,
}: {
  params: ProductParams;
}) {
  const { handle } = await params;
  /* Igual que en el blog: con el notFound() adentro del <Suspense> el estado
     HTTP ya iba en 200 y /productos/loquesea/ respondía un soft 404. Acá el
     chequeo no cuesta una consulta extra —getProduct sale del catálogo
     completo, que es una única entrada de caché— y solo le quita el
     App Shell a los handles que no estaban en generateStaticParams, o sea a
     los inventados y a lo que Shopify publique después del build. */
  const product = await getProduct(handle);
  if (product === undefined) notFound();

  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent handle={product.handle} />
    </Suspense>
  );
}

async function ProductPageContent({ handle }: { handle: string }) {
  const product = await getProduct(handle);
  if (product === undefined) notFound();

  const [reviews, all] = await Promise.all([
    getProductReviews(product.handle, product.id),
    getAllProducts(),
  ]);
  const reviewSummary = reviewsSummary(reviews);
  const related = all
    .filter(
      (p) =>
        p.handle !== product.handle &&
        ((product.type !== null && p.type === product.type) ||
          p.momentos.some((m) => product.momentos.includes(m))),
    )
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-14 lg:px-8">
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
      <nav aria-label="Ruta" className="mb-4 font-mono text-[11px] text-tinta/50 md:mb-6">
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

      {/* Primer pantallazo en móvil: encabezado con precio → galería acotada →
          compra. En escritorio la galería ocupa la columna izquierda entera y
          el encabezado y el resto se apilan a la derecha (filas 1 y 2). El
          provider comparte la variante elegida entre el precio de arriba y el
          BuyBox de abajo. */}
      <ProductPurchaseProvider variants={product.variants}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-0">
          <header className="lg:col-start-2 lg:row-start-1">
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
              {typeLabel(product.type)}
            </p>
            <h1 className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-[0.95] sm:text-5xl">
              {product.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <ProductPrice price={product.price} regularPrice={product.regularPrice} />
              {reviewSummary !== null ? (
                <ProductRating
                  rating={reviewSummary.rating}
                  count={reviewSummary.count}
                  href="#resenas"
                />
              ) : null}
            </div>
          </header>

          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <ImageGallery images={product.images} alt={product.title} />
          </div>

          <div className="flex flex-col gap-5 lg:col-start-2 lg:row-start-2 lg:pt-6">
            {/* En móvil los chips y la descripción corta bajan al final de la
                columna para que el botón quede en el primer pantallazo; en
                escritorio conservan su sitio bajo el H1. */}
            {product.momentos.length > 0 ||
            product.deportes.length > 0 ||
            product.shortDescriptionHtml !== "" ? (
              <div className="order-last lg:order-none">
                {product.momentos.length > 0 || product.deportes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
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
                    className="prose-actimax mt-4 text-sm text-tinta/80"
                    dangerouslySetInnerHTML={{ __html: product.shortDescriptionHtml }}
                  />
                ) : null}
              </div>
            ) : null}

            {product.type === "kits" ? <PackContenido items={product.contenido} /> : null}

            <div>
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
                stickyBar
              />
              <ProductTrust productTitle={product.title} className="mt-5" />
              <PaymentMethods className="mt-4" />
            </div>

            {product.type === "kits" ? <GuiaUso pasos={product.guiaUso} /> : null}

            <ProductReviewsCompact reviews={reviews} />
          </div>
        </div>
      </ProductPurchaseProvider>

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

      <ProductReviews
        reviews={reviews}
        productHandle={product.handle}
        productTitle={product.title}
      />

      <ProductFaq items={productFaq(product)} />
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-14 lg:px-8">
      <Skeleton className="mb-4 h-3 w-48 md:mb-6" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-14 lg:gap-y-0">
        <div className="lg:col-start-2 lg:row-start-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-12 w-4/5 sm:h-16" />
          <Skeleton className="mt-4 h-8 w-1/2" />
        </div>
        <Skeleton className="aspect-[4/3] max-h-[48vh] w-full lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:aspect-square lg:max-h-none" />
        <div className="lg:col-start-2 lg:row-start-2 lg:pt-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-4 h-12 w-full" />
          <Skeleton className="mt-3 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
