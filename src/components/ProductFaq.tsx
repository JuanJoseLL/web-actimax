import { PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { FaqItem } from "@/data/faq";
import { faqJsonLd, jsonLd } from "@/lib/seo";

/**
 * FAQ del producto con <details> nativos (funciona sin JS y los buscadores
 * leen todo el texto) y su JSON-LD de FAQPage para SEO/AEO.
 */
export function ProductFaq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd(items)) }}
      />
      <Separator className="mb-8" />
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Resuelve tus dudas
      </p>
      <h2 className="mt-2 font-display text-3xl font-extrabold uppercase italic">
        Preguntas frecuentes
      </h2>
      <div className="mt-5 divide-y divide-tinta/10 border-y border-tinta/10">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-tinta transition-colors hover:text-azul [&::-webkit-details-marker]:hidden">
              {item.question}
              <PlusIcon
                aria-hidden
                className="size-4 shrink-0 text-azul transition-transform duration-200 group-open:rotate-45"
              />
            </summary>
            <p className="mt-3 pr-8 text-sm leading-relaxed text-tinta/70">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
