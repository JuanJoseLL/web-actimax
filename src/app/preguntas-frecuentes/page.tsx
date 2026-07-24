import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FAQ_ITEMS } from "@/data/faq";
import { SITE_URL, breadcrumbJsonLd, faqJsonLd, jsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Preguntas frecuentes: geles energéticos y nutrición deportiva — Actimax",
  description:
    "Qué es un gel energético, cuándo tomarlo, con o sin cafeína, qué usar antes, durante y después de entrenar y dónde comprar nutrición deportiva en Colombia.",
  alternates: { canonical: "/preguntas-frecuentes/" },
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd(FAQ_ITEMS)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Inicio", url: `${SITE_URL}/` },
              { name: "Preguntas frecuentes", url: `${SITE_URL}/preguntas-frecuentes/` },
            ]),
          ),
        }}
      />

      <nav aria-label="Ruta" className="mb-6 font-mono text-[11px] text-tinta/50">
        <Link href="/" className="hover:text-azul hover:underline">
          Inicio
        </Link>
        {" / "}
        <span className="text-tinta/80">Preguntas frecuentes</span>
      </nav>

      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Guía rápida
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl">
        Preguntas frecuentes
      </h1>
      <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-tinta/70">
        Respuestas directas sobre geles energéticos, hidratación, recuperación y
        cómo armar tu plan de nutrición para la próxima meta. Si te queda alguna
        duda, escríbenos.
      </p>

      <div className="mt-12 flex flex-col gap-10">
        {FAQ_ITEMS.map((item) => (
          <section key={item.question}>
            <h2 className="font-display text-2xl font-extrabold uppercase italic leading-tight">
              {item.question}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-tinta/80">{item.answer}</p>
          </section>
        ))}
      </div>

      <Separator className="mt-14" />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="race" size="lg">
          <Link href="/productos">Ver todos los productos</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/productos/comparar">Comparar Energy Packs</Link>
        </Button>
      </div>
    </div>
  );
}
