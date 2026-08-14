"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { Badge } from "@/components/ui/badge";

/**
 * Chip de faceta del catálogo. Es cliente solo por el evento: los filtros
 * navegan con querystring y Vercel guarda el pageview sin él, así que hoy no
 * hay forma de saber por qué faceta entra la gente a /productos/.
 *
 * `filtro` da el ranking de facetas sueltas y `combinacion` dice si se apilan
 * —y si alguna combinación popular está quedando sin resultados—. El chip
 * activo no registra nada: volver a pulsarlo no cambia la vista.
 */
export function FilterChip({
  href,
  active,
  filtro,
  combinacion,
  children,
}: {
  href: string;
  active: boolean;
  /** Faceta que aplica este chip, como `tipo=geles` o `tipo=todos`. */
  filtro: string;
  /** Estado resultante del catálogo, como `tipo=geles&deporte=running`. */
  combinacion: string;
  children: React.ReactNode;
}) {
  return (
    <Badge
      asChild
      variant={active ? "default" : "outline"}
      className={`h-8 rounded-sm px-3.5 font-mono text-xs font-semibold uppercase tracking-wide ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "bg-background text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <Link
        href={href}
        onClick={() => {
          if (active) return;
          track("filtro_catalogo", { filtro, combinacion });
        }}
      >
        {children}
      </Link>
    </Badge>
  );
}
