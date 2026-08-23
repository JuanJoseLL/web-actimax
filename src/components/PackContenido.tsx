import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Qué trae el pack, como bloque fijo arriba del botón de compra. Antes esta
 * lista vivía en la descripción larga, tres pantallas abajo en móvil, y era
 * lo primero que un corredor necesita para decidir entre dos packs.
 */
export function PackContenido({ items, className }: { items: string[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="pack-contenido" className={cn("rounded-md bg-niebla/70 px-4 py-3.5", className)}>
      <h2
        id="pack-contenido"
        className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-azul"
      >
        Qué trae el pack
      </h2>
      <ul className="mt-2 grid gap-x-4 gap-y-1 text-[13px] font-medium text-tinta/85 sm:grid-cols-2 sm:text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <CheckIcon aria-hidden className="mt-px size-4 shrink-0 text-azul" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
