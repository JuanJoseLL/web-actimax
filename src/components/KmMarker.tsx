/**
 * Marcador kilométrico: la firma del sitio. Cada sección de la portada
 * es un punto de la ruta (KM 0 largada → KM 42 meta) y este componente
 * es el mojón que la marca sobre el recorrido.
 */
type Tone = "claro" | "noche" | "sol";

const TONES: Record<Tone, { km: string; label: string; rule: string; dot: string }> = {
  claro: {
    km: "text-azul",
    label: "text-tinta/50",
    rule: "border-tinta/20",
    dot: "border-amarillo",
  },
  noche: {
    km: "text-amarillo",
    label: "text-white/50",
    rule: "border-white/25",
    dot: "border-amarillo",
  },
  sol: {
    km: "text-tinta",
    label: "text-tinta/60",
    rule: "border-tinta/30",
    dot: "border-tinta",
  },
};

export function KmMarker({
  km,
  label,
  tone = "claro",
}: {
  km: string;
  label: string;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <p className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-[0.2em]">
      <span aria-hidden className={`w-8 border-t border-dashed ${t.rule}`} />
      <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full border-2 ${t.dot}`} />
      <span className={t.km}>{km}</span>
      <span className={t.label}>· {label}</span>
    </p>
  );
}
