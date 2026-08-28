import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriaLandingContent,
  CategoriaLandingSkeleton,
  landingMetadata,
} from "@/components/CategoriaLanding";
import { deporteRequerido } from "@/data/deportes";

/* La categoría de WordPress de triatlón, que desde el corte era un 308 a un filtro sin texto.
   Una ruta literal gana al segmento dinámico [handle], y la vista filtrada
   /productos/?deporte=triatlon declara esta como canónica. El contenido vive en
   src/data/deportes.ts; esta ruta solo lo elige. */
const landing = deporteRequerido("triatlon");

export const metadata: Metadata = landingMetadata(landing);

export default function TriatlonPage() {
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
