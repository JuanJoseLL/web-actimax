import Image from "next/image";
import { ArrowUpRightIcon } from "lucide-react";
import { SEDE } from "@/lib/contacto";

const GOOGLE_RATING = "5,0";
const GOOGLE_REVIEW_COUNT = 41;

/*
 * El ícono está embebido para mantener el componente autosuficiente.
 * Su exterior es transparente; la burbuja clara pertenece al símbolo.
 */
const GOOGLE_REVIEWS_ICON =
  "data:image/png;base64,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";

export function GoogleReviewsBadge() {
  const accessibleLabel =
    `Actimax tiene una calificación de ${GOOGLE_RATING} sobre 5 basada en ${GOOGLE_REVIEW_COUNT} opiniones. Ver opiniones en Google Maps.`;

  return (
    <a
      href={SEDE.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={accessibleLabel}
      className="fade-up group mt-4 grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 border-y border-white/15 py-3 text-white no-underline transition-colors hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amarillo focus-visible:ring-offset-4 focus-visible:ring-offset-azul sm:grid-cols-[auto_minmax(0,1fr)_auto]"
      style={{ animationDelay: "0.38s" }}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Image
          src={GOOGLE_REVIEWS_ICON}
          alt=""
          aria-hidden
          width={25}
          height={22}
          unoptimized
          className="h-[22px] w-auto shrink-0"
        />
        <span className="min-w-0">
          <span
            translate="no"
            className="block whitespace-nowrap font-sans text-xs font-normal tracking-normal text-white sm:text-sm"
          >
            Google Maps
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-[9px] leading-none text-white/65 sm:text-[10px]">
            Opiniones de clientes
          </span>
        </span>
      </span>

      <span className="flex min-w-0 flex-wrap items-center justify-end gap-x-1.5 gap-y-1 border-white/15 sm:justify-start sm:border-l sm:pl-4">
        <strong className="font-display text-2xl font-extrabold italic leading-none text-white">
          {GOOGLE_RATING}
        </strong>
        <span
          aria-hidden
          className="whitespace-nowrap text-sm leading-none tracking-[0.08em] text-amarillo sm:text-base"
        >
          ★★★★★
        </span>
        <span className="w-full text-right text-[10px] leading-none text-white/70 sm:w-auto sm:text-left">
          {GOOGLE_REVIEW_COUNT} opiniones
        </span>
      </span>

      <span className="col-span-2 inline-flex min-h-9 items-center justify-center gap-1.5 justify-self-end rounded-lg bg-white px-4 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-tinta transition-transform group-hover:-translate-y-0.5 sm:col-span-1 sm:text-[10px]">
        Ver opiniones
        <ArrowUpRightIcon aria-hidden className="size-3.5" />
      </span>
    </a>
  );
}

