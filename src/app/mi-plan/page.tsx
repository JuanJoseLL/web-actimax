import type { Metadata } from "next";
import { Suspense } from "react";
import type { PlanPack } from "@/components/ActimaxPlanBuilder";
import { MiPlanExperiencia } from "@/components/MiPlanExperiencia";
import { SeoBreadcrumbs } from "@/components/SeoBreadcrumbs";
import { getProducts } from "@/lib/catalog";
import {
  getDefaultPlanInput,
  PLAN_PACK_HANDLES,
  type PlanSport,
} from "@/lib/mi-plan";
import { initialProductVariant } from "@/lib/product-variants";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Mi Plan Actimax — Nutrición para tu próximo reto",
  description:
    "Conversa con el asesor Actimax para encontrar productos según tu entrenamiento, o calcula un plan orientativo para tu próxima carrera.",
  path: "/mi-plan/",
  ogTitle: "Mi Plan Actimax — Tu meta tiene un plan",
  ogDescription:
    "Define distancia, tiempo, clima y tolerancia para construir una estrategia antes, durante y después.",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseSport(value: string | string[] | undefined): PlanSport {
  return value === "ciclismo" || value === "triatlon" ? value : "running";
}

function parseDistance(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const distance = Number(value);
  return Number.isFinite(distance) ? distance : undefined;
}

export default function MiPlanPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <SeoBreadcrumbs
        items={[
          { name: "Inicio", url: "/" },
          { name: "Mi Plan", url: "/mi-plan/" },
        ]}
      />
      <Suspense fallback={<PlanLoading />}>
        <PlanContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function PlanLoading() {
  return (
    <div className="grid min-h-[70svh] place-items-center bg-tinta px-4 text-center text-white">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amarillo">
          Mi Plan Actimax
        </p>
        <p className="mt-3 font-display text-5xl font-extrabold uppercase italic">
          Preparando la ruta…
        </p>
      </div>
    </div>
  );
}

async function PlanContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialInput = getDefaultPlanInput(
    parseSport(params.deporte),
    parseDistance(params.distancia),
  );
  const packs: PlanPack[] = (await getProducts([...PLAN_PACK_HANDLES])).map((product) => {
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
    };
  });

  return <MiPlanExperiencia initialInput={initialInput} packs={packs} usarCalculadora={params.deporte !== undefined || params.distancia !== undefined} />;
}
