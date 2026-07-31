import Link from "next/link";
import type { ComponentType } from "react";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/BrandIcons";
import { Separator } from "@/components/ui/separator";
import {
  EMAIL,
  REDES_VISIBLES,
  SEDE,
  TELEFONO_DISPLAY,
  TELEFONO_E164,
  whatsappUrl,
} from "@/lib/contacto";

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
      { label: "Blog", href: "/blog" },
      { label: "Preguntas frecuentes", href: "/preguntas-frecuentes" },
      { label: "Mi cuenta", href: "/mi-cuenta/" },
      { label: "Políticas de la tienda", href: "/politicas-devolucion-privacidad" },
      { label: "Equipos y tiendas", href: "/#mayoristas" },
    ],
  },
];

/* Las URLs viven en contacto.ts (única fuente); aquí solo el ícono. */
const SOCIAL_ICONS: Record<
  (typeof REDES_VISIBLES)[number]["nombre"],
  ComponentType<{ className?: string }>
> = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
  YouTube: YouTubeIcon,
};

const CONTACT_ROW_STYLE =
  "flex items-start gap-2.5 py-3 text-sm text-white/75 transition-colors hover:text-amarillo md:py-0";

export function Footer() {
  return (
    <footer className="section-noche text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8 xl:grid-cols-[1.35fr_1fr_1fr_1fr_1.15fr]">
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
          <ul className="mt-6 flex items-center gap-2">
            {REDES_VISIBLES.map(({ nombre, href }) => {
              const Icon = SOCIAL_ICONS[nombre];
              return (
                <li key={nombre}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Actimax en ${nombre}`}
                    className="grid size-10 place-items-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-amarillo hover:text-amarillo"
                  >
                    <Icon className="size-4.5" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              {col.title}
            </p>
            <ul className="mt-2 flex flex-col md:mt-4 md:gap-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="block py-3 text-sm text-white/75 transition-colors hover:text-amarillo md:py-0"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white/40">
            Contacto
          </p>
          <ul className="mt-2 flex flex-col md:mt-4 md:gap-3">
            <li>
              <a
                href={SEDE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={CONTACT_ROW_STYLE}
              >
                <MapPinIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-amarillo" />
                <span>
                  {SEDE.lineas.map((linea) => (
                    <span key={linea} className="block">
                      {linea}
                    </span>
                  ))}
                </span>
              </a>
            </li>
            <li>
              <a href={whatsappUrl("Hola Actimax, tengo una pregunta.")} target="_blank" rel="noopener noreferrer" className={CONTACT_ROW_STYLE}>
                <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-amarillo" />
                <span>WhatsApp: {TELEFONO_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a href={`tel:${TELEFONO_E164}`} className={CONTACT_ROW_STYLE}>
                <PhoneIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-amarillo" />
                <span>{TELEFONO_DISPLAY}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className={CONTACT_ROW_STYLE}>
                <MailIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-amarillo" />
                <span className="break-all">{EMAIL}</span>
              </a>
            </li>
          </ul>
        </div>
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
