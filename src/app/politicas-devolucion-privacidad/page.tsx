import type { Metadata } from "next";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getStorePolicies } from "@/lib/policies";
import { SITE_URL, breadcrumbJsonLd, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Políticas de devolución, privacidad y envíos — Actimax",
  description:
    "Condiciones de devolución y cambios, tratamiento de datos personales y política de envíos de Actimax: envío gratis desde $120.000 en Colombia.",
  alternates: { canonical: "/politicas-devolucion-privacidad/" },
};

const SECTION_LABELS: Record<string, string> = {
  devolucion: "Devoluciones y cambios",
  privacidad: "Privacidad y datos personales",
  envios: "Envíos",
};

export default async function PoliticasPage() {
  const policies = await getStorePolicies();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Inicio", url: `${SITE_URL}/` },
              { name: "Políticas", url: `${SITE_URL}/politicas-devolucion-privacidad/` },
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

      {policies.length === 0 ? (
        <p className="mt-8 text-base font-medium leading-relaxed text-tinta/70">
          No pudimos cargar las políticas en este momento. Escríbenos a{" "}
          <a href="mailto:ventas@actimax.com.co" className="text-azul underline">
            ventas@actimax.com.co
          </a>{" "}
          y con gusto resolvemos tus dudas sobre devoluciones, privacidad o envíos.
        </p>
      ) : (
        <>
          <nav aria-label="Secciones" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {policies.map((policy) => (
              <a
                key={policy.anchor}
                href={`#${policy.anchor}`}
                className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-azul hover:underline"
              >
                {SECTION_LABELS[policy.anchor] ?? policy.title}
              </a>
            ))}
          </nav>

          <div className="mt-10 flex flex-col gap-12">
            {policies.map((policy, index) => (
              <section key={policy.anchor} id={policy.anchor} className="scroll-mt-24">
                {index > 0 ? <Separator className="mb-10" /> : null}
                <h2 className="font-display text-3xl font-extrabold uppercase italic leading-tight">
                  {SECTION_LABELS[policy.anchor] ?? policy.title}
                </h2>
                <div
                  className="prose-actimax mt-4 text-[15px] text-foreground/85"
                  dangerouslySetInnerHTML={{ __html: policy.bodyHtml }}
                />
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
