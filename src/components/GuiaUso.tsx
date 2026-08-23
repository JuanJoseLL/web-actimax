import { MOMENTO_LABELS, type GuiaUsoPaso, type Momento } from "@/lib/taxonomia";
import { cn } from "@/lib/utils";

/* Mismo lenguaje que los mojones de la portada (KmMarker): línea punteada y
   un punto anillado por paso. El anillo toma el color del momento cuando
   Operaciones lo indica; si no, el amarillo de marca. */
const DOT: Record<Momento, string> = {
  antes: "border-azul",
  durante: "border-amarillo",
  despues: "border-tinta",
};

/**
 * "Cuándo tomar qué": la guía de carrera del pack como línea de tiempo
 * horizontal. Los pasos vienen del metafield `custom.guia_uso` en el orden
 * en que Operaciones los cargó (ver docs/metafields-packs.md).
 */
export function GuiaUso({ pasos, className }: { pasos: GuiaUsoPaso[]; className?: string }) {
  if (pasos.length === 0) return null;
  return (
    <section aria-labelledby="guia-uso" className={cn(className)}>
      <h2
        id="guia-uso"
        className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-azul"
      >
        Cuándo tomar qué
      </h2>
      <ol className="product-gallery-scroll -mx-4 mt-3 flex snap-x scroll-pl-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-pl-0 sm:px-0">
        {pasos.map((paso, index) => (
          <li
            key={`${paso.cuando}-${index}`}
            className="relative w-36 shrink-0 snap-start pr-3 sm:w-40"
          >
            <div className="flex items-center">
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0 rounded-full border-2 bg-background",
                  DOT[paso.momento ?? "durante"],
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "h-0 flex-1 border-t border-dashed border-tinta/25",
                  index === pasos.length - 1 && "invisible",
                )}
              />
            </div>
            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-azul">
              {paso.cuando}
              {paso.momento !== undefined ? (
                <span className="sr-only"> ({MOMENTO_LABELS[paso.momento]})</span>
              ) : null}
            </p>
            <p className="mt-1 pr-1 text-sm font-semibold leading-snug text-tinta">{paso.que}</p>
            {paso.nota !== undefined ? (
              <p className="mt-1 pr-1 text-xs leading-snug text-tinta/60">{paso.nota}</p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
