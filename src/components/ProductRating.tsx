import Link from "next/link";
import { cn } from "@/lib/utils";

const RATING_FORMAT = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatReviewRating(rating: number): string {
  return RATING_FORMAT.format(rating);
}

export function ProductRating({
  rating,
  count,
  href,
  compact = false,
  className,
}: {
  rating: number;
  count: number;
  href: string;
  compact?: boolean;
  className?: string;
}) {
  const countLabel = count === 1 ? "1 reseña" : `${count} reseñas`;

  return (
    <Link
      href={href}
      aria-label={`${formatReviewRating(rating)} de 5 estrellas, ${countLabel}`}
      className={cn(
        "inline-flex w-fit items-center font-mono font-semibold text-tinta/65 underline-offset-4 transition-colors hover:text-azul hover:underline",
        compact ? "gap-1 text-[11px]" : "gap-1.5 text-xs",
        className,
      )}
    >
      <span aria-hidden className="text-base leading-none text-[#e6aa00]">
        ★
      </span>
      <span className="tabular-nums">{formatReviewRating(rating)}</span>
      {compact ? (
        <span className="font-normal text-tinta/50">({count})</span>
      ) : (
        <>
          <span aria-hidden className="font-normal text-tinta/30">
            ·
          </span>
          <span className="font-normal">{countLabel}</span>
        </>
      )}
    </Link>
  );
}
