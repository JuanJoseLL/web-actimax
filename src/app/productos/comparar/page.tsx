import type { Metadata } from "next";
import { PackComparator, type ComparablePack } from "@/components/PackComparator";
import { getAllProducts } from "@/lib/catalog";
import { initialProductVariant } from "@/lib/product-variants";

export const metadata: Metadata = {
  title: "Comparar Energy Packs — Actimax",
  description: "Compara Energy Packs Actimax y encuentra una estrategia de nutrición para tu próximo reto.",
};

export default async function CompararPacksPage() {
  const packs: ComparablePack[] = (await getAllProducts())
    .filter((product) => product.type === "kits")
    .map((product) => {
      const variant = initialProductVariant(product.variants);
      return {
        variantId: product.variantId,
        variantTitle: variant?.title,
        handle: product.handle,
        title: product.title,
        price: product.price,
        regularPrice: product.regularPrice,
        onSale: product.onSale,
        inStock: product.inStock,
        excerpt: product.excerpt,
        image: variant?.image ?? product.images[0] ?? null,
        deportes: product.deportes,
      };
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">Energy Packs</p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-7xl">
        Compara tu estrategia
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        Contrasta dos kits por reto, enfoque y precio. La mejor elección es la que puedas probar antes del día de la competencia.
      </p>
      <div className="mt-10">
        <PackComparator packs={packs} />
      </div>
    </div>
  );
}
