import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { ArrowRightIcon, TimerIcon } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductRating } from "@/components/ProductRating";
import { Button } from "@/components/ui/button";
import { PROMO_DESTACADA, diasRestantes, promoVigente } from "@/data/promo";
import { financiableConAddi } from "@/lib/addi";
import { getProduct } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { canonicalProductPath } from "@/lib/product-paths";
import { initialProductVariant } from "@/lib/product-variants";

/**
 * La oferta del mes, justo debajo del hero: es lo primero que se ve después
 * de la valla y va antes de los favoritos, que es donde se iba la mirada.
 *
 * Cacheada aparte del catálogo y por una hora, no por un día: adentro mira el
 * reloj para saber si la promo ya venció (ver src/data/promo.ts), y en un
 * scope `use cache` esa lectura se congela con la entrada. Una hora es lo que
 * puede tardar en bajarse sola tras la medianoche del último día. El
 * cacheTag("catalog") la ata a los webhooks de producto, así que un cambio de
 * precio en Shopify se refleja enseguida.
 */
export async function PromoHome() {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });

  const promo = PROMO_DESTACADA;
  if (!promoVigente(promo, new Date())) return null;

  const product = await getProduct(promo.handle);
  /* Sin oferta viva en Shopify no hay banda: es el segundo freno, el que
     tiene Operaciones sin tocar el repositorio. */
  if (product === undefined || !product.onSale || !product.inStock) return null;

  const path = canonicalProductPath(product.handle);
  const ahorro = product.regularPrice - product.price;
  const descuento = Math.round((ahorro / product.regularPrice) * 100);
  const dias = diasRestantes(promo, new Date());
  const variant = initialProductVariant(product.variants);
  const variasVariantes = product.variants.length > 1;

  return (
    <section
      aria-labelledby="promo-destacada"
      className="overflow-hidden bg-[linear-gradient(115deg,#002f87_0%,#07122e_58%)] text-white"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 md:gap-12 md:py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <Link
          href={path}
          aria-hidden
          tabIndex={-1}
          className="group relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-sm bg-white lg:max-w-none"
        >
          {product.images[0] !== undefined ? (
            <Image
              src={product.images[0]}
              alt=""
              fill
              sizes="(min-width: 1024px) 420px, 280px"
              className="object-contain p-5 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : null}
          <span className="absolute left-0 top-0 bg-amarillo px-3 py-1.5 font-display text-2xl font-extrabold italic leading-none text-tinta">
            -{descuento}%
          </span>
        </Link>

        <div>
          <p className="section-kicker section-kicker-dark">{promo.kicker}</p>
          <h2
            id="promo-destacada"
            className="mt-4 max-w-xl font-display text-4xl font-extrabold uppercase italic leading-[0.88] tracking-tight sm:text-6xl"
          >
            {promo.titulo}
          </h2>
          <p className="mt-5 max-w-xl text-base font-medium leading-relaxed text-white/72">
            {promo.texto}
          </p>

          <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-2">
            <div>
              <p className="font-mono text-sm tabular-nums text-white/50 line-through">
                {formatCOP(product.regularPrice)}
              </p>
              <p className="font-mono text-3xl font-bold tabular-nums leading-none text-amarillo sm:text-4xl">
                {formatCOP(product.price)}
              </p>
            </div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-white/75">
              Ahorras {formatCOP(ahorro)}
              {financiableConAddi(product.price) ? (
                <span className="mt-1 block text-white/55">
                  A cuotas con Addi
                </span>
              ) : null}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            {variasVariantes ? null : (
              <div className="sm:w-60">
                <AddToCartButton
                  variant="full"
                  origin="promo-home"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  product={{
                    variantId: product.variantId,
                    variantTitle: variant?.title,
                    handle: product.handle,
                    title: product.title,
                    price: product.price,
                    image: variant?.image ?? product.images[0] ?? null,
                  }}
                />
              </div>
            )}
            <Button
              asChild
              variant={variasVariantes ? "raceSun" : "raceOutline"}
              size="lg"
              className="h-auto px-7 py-3.5 text-lg"
            >
              <Link href={path}>
                {promo.cta}
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">
            <span className="flex items-center gap-1.5">
              <TimerIcon aria-hidden className="size-4 text-amarillo" />
              {promo.hastaLabel}
              {dias <= 10 ? (
                <span className="text-amarillo">
                  {dias === 1 ? " · último día" : ` · quedan ${dias} días`}
                </span>
              ) : null}
            </span>
            {product.reviewSummary !== null ? (
              <ProductRating
                rating={product.reviewSummary.rating}
                count={product.reviewSummary.count}
                href={`${path}#resenas`}
                compact
                className="text-white/70 hover:text-amarillo"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
