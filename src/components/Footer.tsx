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
  "group flex h-full min-w-0 items-start gap-3 rounded-sm border border-white/10 bg-white/[0.025] p-3.5 transition-colors hover:border-amarillo/35 hover:bg-white/[0.05]";

const CONTACT_ICON_STYLE =
  "grid size-8 shrink-0 place-items-center rounded-full bg-amarillo/10 text-amarillo transition-colors group-hover:bg-amarillo group-hover:text-tinta";

const FOOTER_HEADING_STYLE =
  "font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/45";

export function Footer() {
  return (
    <footer className="section-noche overflow-hidden text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-14 lg:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-display text-4xl font-extrabold uppercase italic leading-none tracking-wide">
              Actimax<span className="text-amarillo">.</span>
            </p>
            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-white/60">
              El combustible de quienes entrenan para una versión de sí mismos que todavía no conocen.
              Medellín, Colombia.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              Antes · Durante · Después
            </p>
            <ul className="mt-6 flex items-center gap-2.5">
              {REDES_VISIBLES.map(({ nombre, href }) => {
                const Icon = SOCIAL_ICONS[nombre];
                return (
                  <li key={nombre}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Actimax en ${nombre}`}
                      className="grid size-11 place-items-center rounded-full border border-white/15 text-white/65 transition-colors hover:border-amarillo hover:bg-amarillo hover:text-tinta"
                    >
                      <Icon className="size-4.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className={FOOTER_HEADING_STYLE}>Contacto directo</p>
            <p className="mt-2 font-display text-3xl font-bold uppercase italic leading-none tracking-wide">
              ¿Cómo podemos ayudarte?
            </p>
            <ul className="mt-5 grid auto-rows-fr gap-3 sm:grid-cols-2">
              <li>
                <a
                  href={SEDE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_ROW_STYLE}
                >
                  <span className={CONTACT_ICON_STYLE}>
                    <MapPinIcon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Visítanos
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-white/70 group-hover:text-white">
                      {SEDE.lineas.map((linea) => (
                        <span key={linea} className="block">
                          {linea}
                        </span>
                      ))}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl("Hola Actimax, tengo una pregunta.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_ROW_STYLE}
                >
                  <span className={CONTACT_ICON_STYLE}>
                    <WhatsAppIcon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      WhatsApp
                    </span>
                    <span className="mt-1 block text-sm text-white/70 group-hover:text-white">
                      {TELEFONO_DISPLAY}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`tel:${TELEFONO_E164}`} className={CONTACT_ROW_STYLE}>
                  <span className={CONTACT_ICON_STYLE}>
                    <PhoneIcon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Teléfono
                    </span>
                    <span className="mt-1 block text-sm text-white/70 group-hover:text-white">
                      {TELEFONO_DISPLAY}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className={CONTACT_ROW_STYLE}>
                  <span className={CONTACT_ICON_STYLE}>
                    <MailIcon aria-hidden className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
                      Correo
                    </span>
                    <span className="mt-1 block break-all text-sm text-white/70 group-hover:text-white">
                      {EMAIL}
                    </span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="grid gap-9 pt-10 sm:grid-cols-3 sm:gap-8 lg:gap-16">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-px w-5 bg-amarillo/70" />
                <p className={FOOTER_HEADING_STYLE}>{col.title}</p>
              </div>
              <ul className="mt-3 flex flex-col md:mt-4 md:gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="block py-2.5 text-sm text-white/65 transition-colors hover:text-amarillo md:py-0"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <Separator className="bg-white/10" />
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 pr-20 font-mono text-[10px] tracking-[0.04em] text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 Actimax · Nutrición deportiva especializada</p>
        <p>Hecho en Colombia · Envíos a todo el país</p>
      </div>
    </footer>
  );
}
