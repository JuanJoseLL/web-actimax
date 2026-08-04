import { BadgeCheckIcon, StarIcon } from "lucide-react";
import { ReviewForm } from "@/components/ReviewForm";
import { Separator } from "@/components/ui/separator";
import { reviewsAverage, type ProductReview } from "@/lib/reviews";

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span role="img" aria-label={`${rating} de 5 estrellas`} className={`flex gap-0.5 ${className ?? ""}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          aria-hidden
          className={
            star <= rating ? "size-4 fill-current text-amarillo" : "size-4 text-tinta/20"
          }
        />
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
    <section className="mt-16 max-w-3xl">
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
            <p className="font-display text-4xl font-extrabold italic leading-none">{promedio}</p>
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
