import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const COLUMNS = [
  {
    title: "Productos",
    links: [
      { label: "Geles energéticos", href: "/productos?tipo=geles" },
      { label: "Bebidas deportivas", href: "/productos?tipo=bebidas" },
      { label: "Barras de proteína", href: "/productos?tipo=barras" },
      { label: "Energy Packs", href: "/productos?tipo=kits" },
      { label: "Comparar Energy Packs", href: "/productos/comparar" },
    ],
  },
  {
    title: "Por momento",
    links: [
      { label: "Antes del esfuerzo", href: "/productos?momento=antes" },
      { label: "Durante el esfuerzo", href: "/productos?momento=durante" },
      { label: "Después del esfuerzo", href: "/productos?momento=despues" },
    ],
  },
  {
    title: "Actimax",
    links: [
      { label: "Nuestra historia", href: "/#historia" },
      { label: "Actimax Club", href: "/#club" },
      { label: "Historias y estrategia", href: "/blog" },
      { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
      { label: "Equipos y tiendas", href: "/#mayoristas" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="section-noche text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <p className="font-display text-4xl font-extrabold uppercase italic leading-none tracking-wide">
            Actimax<span className="text-amarillo">.</span>
          </p>
          <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-white/60">
            El combustible de quienes entrenan para una versión de sí mismos
            que todavía no conocen. Medellín, Colombia.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-white/35">
            Antes · Durante · Después
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              {col.title}
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 transition-colors hover:text-amarillo"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <Separator className="bg-white/10" />
      <div>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 font-mono text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Actimax · Nutrición deportiva especializada</p>
          <p>Hecho en Colombia · Envíos a todo el país</p>
        </div>
      </div>
    </footer>
  );
}
