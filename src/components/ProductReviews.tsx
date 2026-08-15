import { BadgeCheckIcon } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";
import { formatReviewRating } from "@/components/ProductRating";
import { Separator } from "@/components/ui/separator";
import { reviewsAverage, type ProductReview } from "@/lib/reviews";

/**
 * Las 5 estrellas se repiten una vez por reseña. Con el <path> completo de
 * lucide cada una pesa ~650 bytes: una PDP con 14 reseñas emitía 70 SVG
 * idénticos (44 KB de HTML, y otro tanto duplicado en el payload RSC, que
 * Vercel cobra como escrituras ISR). Definido una sola vez como <symbol>,
 * cada estrella pasa a ser un <use> de ~90 bytes.
 *
 * El símbolo no lleva `fill`: quien decide relleno o contorno es la clase del
 * <svg> que lo referencia. Un `fill` propio ganaría siempre por estar puesto
 * sobre el símbolo, y las estrellas saldrían todas vacías.
 */
const ESTRELLA_ID = "ico-estrella";

export function EstrellaSprite() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute overflow-hidden">
      <symbol
        id={ESTRELLA_ID}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
      </symbol>
    </svg>
  );
}

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span role="img" aria-label={`${rating} de 5 estrellas`} className={`flex gap-0.5 ${className ?? ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          aria-hidden
          className={
            star <= rating ? "size-4 fill-current text-amarillo" : "size-4 fill-none text-tinta/20"
          }
        >
          <use href={`#${ESTRELLA_ID}`} />
        </svg>
      ))}
    </span>
  );
}

const FECHA = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });

/**
 * Reseñas reales de clientes en la página de producto. El JSON-LD con el
 * aggregateRating no va aquí: se integra al Product de la PDP (seo.ts) para
 * que los buscadores asocien las estrellas a la misma entidad que la oferta.
 */
export function ProductReviews({
  reviews,
  productHandle,
  productTitle,
}: {
  reviews: ProductReview[];
  productHandle: string;
  productTitle: string;
}) {
  const promedio = reviews.length > 0 ? reviewsAverage(reviews) : null;

  return (
    <section id="resenas" className="mt-16 max-w-3xl scroll-mt-24">
      <EstrellaSprite />
      <Separator className="mb-8" />
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Lo que dicen los que ya lo corrieron
      </p>
      <h2 className="mt-2 font-display text-3xl font-extrabold uppercase italic">
        Reseñas de clientes
      </h2>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-5 sm:items-center">
        {promedio !== null ? (
          <div className="flex items-center gap-3">
            <p className="font-display text-4xl font-extrabold italic leading-none">
              {formatReviewRating(promedio)}
            </p>
            <div>
              <Stars rating={Math.round(promedio)} />
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-tinta/50">
                {reviews.length === 1 ? "1 reseña" : `${reviews.length} reseñas`}
              </p>
            </div>
          </div>
        ) : (
          <p className="max-w-md text-sm leading-relaxed text-tinta/65">
            Todavía no hay reseñas. Comparte tu experiencia y ayuda a otros deportistas.
          </p>
        )}
        <ReviewForm productHandle={productHandle} productTitle={productTitle} />
      </div>

      {reviews.length > 0 ? (
        <div className="mt-6 divide-y divide-tinta/10 border-y border-tinta/10">
          {reviews.map((review) => (
            <article key={review.id ?? `${review.reviewer}-${review.date}`} className="py-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={review.rating} />
                <p className="text-sm font-bold text-tinta">{review.reviewer}</p>
                <p className="font-mono text-[11px] uppercase tracking-wide text-tinta/45">
                  {FECHA.format(new Date(review.date))}
                </p>
                {review.verified ? (
                  <p className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-azul">
                    <BadgeCheckIcon aria-hidden className="size-3.5" />
                    Compra verificada
                  </p>
                ) : null}
              </div>
              {review.text !== "" ? (
                <p className="mt-2 text-sm leading-relaxed text-tinta/75">{review.text}</p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
