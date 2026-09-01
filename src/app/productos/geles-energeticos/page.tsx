import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriaLandingContent,
  CategoriaLandingSkeleton,
  landingMetadata,
} from "@/components/CategoriaLanding";
import { categoriaRequerida } from "@/data/categorias";

/* La URL que WordPress posicionaba por "geles energéticos". Una ruta literal
   gana al segmento dinámico [handle], y la vista filtrada
   /productos/?tipo=geles declara esta como canónica. El contenido vive en
   src/data/categorias.ts; esta ruta solo lo elige. */
const landing = categoriaRequerida("geles");

export const metadata: Metadata = landingMetadata(landing);

export default function GelesEnergeticosPage() {
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
