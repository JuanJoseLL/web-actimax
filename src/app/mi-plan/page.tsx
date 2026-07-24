import type { Metadata } from "next";
import { Suspense } from "react";
import { ActimaxPlanBuilder, type PlanPack } from "@/components/ActimaxPlanBuilder";
import { getProducts } from "@/lib/catalog";
import {
  getDefaultPlanInput,
  PLAN_PACK_HANDLES,
  type PlanSport,
} from "@/lib/mi-plan";

export const metadata: Metadata = {
  title: "Mi Plan Actimax — Nutrición para tu próximo reto",
  description:
    "Crea un plan orientativo de nutrición e hidratación para running, ciclismo o triatlón y encuentra el Energy Pack Actimax más cercano a tu reto.",
  alternates: { canonical: "/mi-plan/" },
  openGraph: {
    title: "Mi Plan Actimax — Tu meta tiene un plan",
    description:
      "Define distancia, tiempo, clima y tolerancia para construir una estrategia antes, durante y después.",
  },
};

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
    <Suspense fallback={<PlanLoading />}>
      <PlanContent searchParams={searchParams} />
    </Suspense>
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
  const packs: PlanPack[] = (await getProducts([...PLAN_PACK_HANDLES])).map((product) => ({
    variantId: product.variantId,
    handle: product.handle,
    title: product.title,
    price: product.price,
    regularPrice: product.regularPrice,
    onSale: product.onSale,
    inStock: product.inStock,
    excerpt: product.excerpt,
    image: product.images[0] ?? null,
  }));

  return <ActimaxPlanBuilder initialInput={initialInput} packs={packs} />;
}
