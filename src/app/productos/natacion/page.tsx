import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriaLandingContent,
  CategoriaLandingSkeleton,
  landingMetadata,
} from "@/components/CategoriaLanding";
import { deporteRequerido } from "@/data/deportes";

/* La categoría de WordPress de natación (292 impresiones al mes en agosto de 2026), que desde el corte era un 308 a un filtro.
   Una ruta literal gana al segmento dinámico [handle], y la vista filtrada
   /productos/?deporte=natacion declara esta como canónica. El contenido vive en
   src/data/deportes.ts; esta ruta solo lo elige. */
const landing = deporteRequerido("natacion");

export const metadata: Metadata = landingMetadata(landing);

export default function NatacionPage() {
  return (
    <div
      data-catalog-page
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8"
    >
      <Suspense fallback={<CategoriaLandingSkeleton />}>
        <CategoriaLandingContent landing={landing} />
      </Suspense>
    </div>
  );
}
