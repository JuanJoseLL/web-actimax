import { cn } from "@/lib/utils";

/**
 * Secuencia numérica que la marca quiere presente en todo el sitio.
 *
 * El pedido era lo contrario a numerana.com, donde los números son el
 * protagonista: aquí van como marca de agua. Se imprimen en el borde inferior
 * del pie —a esa opacidad leen como un código de lote, no como un mensaje— y
 * como atributo del <body>, así que están en el HTML de cada página aunque
 * nadie baje hasta el footer.
 *
 * Van `aria-hidden` y sin seleccionar a propósito: no son contenido, no se
 * leen en voz alta y no se copian junto al resto del texto.
 */
export const SECUENCIA = [
  "319817318",
  "11981",
  "288-471-314917",
  "619481578491",
  "498317519641",
  "519-7148",
] as const;

export const SECUENCIA_TEXTO = SECUENCIA.join(" · ");

export function SecuenciaNumerica({ className }: { className?: string }) {
  return (
    <p
      aria-hidden
      className={cn(
        "pointer-events-none select-none overflow-hidden whitespace-nowrap text-center",
        "font-mono text-[9px] leading-none tracking-[0.3em] text-white/8",
        className,
      )}
    >
      {SECUENCIA_TEXTO}
    </p>
  );
}
