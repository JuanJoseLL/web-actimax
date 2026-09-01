import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { RedirigirAnclaLegada } from "@/components/RedirigirAnclaLegada";
import {
  INDICE_LEGAL_PATH,
  PAGINAS_LEGALES_ORDENADAS,
} from "@/data/politicas";
import { SITE_URL, breadcrumbJsonLd, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Políticas de la tienda — Actimax",
  description:
    "Términos y condiciones, cambios y garantía, derecho de retracto, tratamiento de datos personales, envíos y cookies de Actimax.",
  path: INDICE_LEGAL_PATH,
});

/**
 * Índice de las políticas. Esta URL era el documento único de WordPress: sigue
 * indexada y enlazada desde fuera, así que en vez de borrarla al separar el
 * contenido se quedó como puerta de entrada a las cinco páginas.
 */
export default function PoliticasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <RedirigirAnclaLegada />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Inicio", url: `${SITE_URL}/` },
              { name: "Políticas", url: `${SITE_URL}${INDICE_LEGAL_PATH}` },
            ]),
          ),
        }}
      />

      <nav aria-label="Ruta" className="mb-6 font-mono text-[11px] text-tinta/50">
        <Link href="/" className="hover:text-azul hover:underline">
          Inicio
        </Link>
        {" / "}
        <span className="text-tinta/80">Políticas</span>
      </nav>

      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Compra con confianza
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl">
        Políticas de la tienda
      </h1>
      <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-tinta/70">
        Estas son las condiciones aplicables a las compras hechas en actimax.com.co, de
        acuerdo con la legislación colombiana vigente. Cada una tiene su propia página para
        que encuentres rápido lo que buscas.
      </p>

      <ul className="mt-10 flex flex-col gap-3">
        {PAGINAS_LEGALES_ORDENADAS.map((pagina) => (
          <li key={pagina.path}>
            <Link
              href={pagina.path}
              className="group flex items-start gap-4 rounded-sm border border-tinta/10 p-5 transition-colors hover:border-azul/40 hover:bg-niebla"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-display text-2xl font-extrabold uppercase italic leading-tight text-tinta">
                  {pagina.titulo}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-tinta/65">
                  {pagina.description}
                </span>
              </span>
              <ArrowRightIcon
                aria-hidden
                className="mt-1 size-5 shrink-0 text-tinta/30 transition-colors group-hover:text-azul"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
