/**
 * Perfil de ruta estilo track de GPS: la firma visual del demo.
 * La línea recorre la "carrera" y los tres puntos marcan los momentos
 * de nutrición (largada, en ruta, meta), con su kilómetro de referencia.
 */
const PROFILE =
  "M0,170 L30,166 L110,150 L200,154 L290,134 L380,138 L470,112 L560,102 L620,94 L700,62 L780,38 L840,50 L900,82 L980,112 L1060,128 L1120,124 L1170,130 L1200,128";

const DOTS = [
  { x: 30, y: 166, km: "K0", anchor: "start", delay: "0.6s" },
  { x: 620, y: 94, km: "K21", anchor: "middle", delay: "1.4s" },
  { x: 1170, y: 130, km: "K42", anchor: "end", delay: "2.4s" },
] as const;

export function RouteLine() {
  return (
    <svg
      viewBox="0 0 1200 200"
      fill="none"
      className="w-full"
      role="img"
      aria-label="Perfil de una ruta de carrera con tres puntos de nutrición: largada (km 0), en ruta (km 21) y meta (km 42)"
    >
      <path d={`${PROFILE} L1200,200 L0,200 Z`} className="fill-white/[0.04]" />
      <path
        d={PROFILE}
        stroke="#4d7fe8"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="route-draw"
      />
      {DOTS.map((dot) => (
        <g key={dot.x} className="route-dot" style={{ animationDelay: dot.delay }}>
          <circle cx={dot.x} cy={dot.y} r="14" className="fill-amarillo/25" />
          <circle cx={dot.x} cy={dot.y} r="7" className="fill-amarillo" />
          <text
            x={dot.x}
            y={dot.y - 22}
            textAnchor={dot.anchor}
            fontSize="13"
            className="fill-white/60 font-mono font-semibold"
          >
            {dot.km}
          </text>
        </g>
      ))}
    </svg>
  );
}
