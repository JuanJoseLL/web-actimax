/**
 * Valla LED de día de carrera: anuncios de servicio en bucle continuo.
 * Con movimiento reducido queda estática mostrando el primer tramo.
 */
const ITEMS = [
  "Envíos a toda Colombia",
  "Geles · Bebidas · Barras · Energy Packs",
  "Kits armados por nutricionistas deportivos",
  "Pago seguro: tarjeta · PSE · Nequi",
  "Paga a cuotas con Addi",
  "20+ años alimentando el rendimiento",
];

function Tramo({ hidden = false }: { hidden?: boolean }) {
  return (
    <span aria-hidden={hidden} className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="flex shrink-0 items-center">
          <span className="px-6">{item}</span>
          <span aria-hidden className="inline-block h-1.5 w-1.5 rotate-45 bg-tinta/40" />
        </span>
      ))}
    </span>
  );
}

export function Ticker() {
  return (
    <div className="marquee border-y border-tinta/15 bg-amarillo text-tinta">
      <div className="marquee-track py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.15em]">
        <Tramo />
        <Tramo hidden />
      </div>
    </div>
  );
}
