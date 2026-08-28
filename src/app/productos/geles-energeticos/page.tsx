import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriaLandingContent,
  CategoriaLandingSkeleton,
  categoriaMetadata,
} from "@/components/CategoriaLanding";
import { categoriaRequerida } from "@/data/categorias";

/* La URL que WordPress posicionaba por "geles energéticos". Una ruta literal
   gana al segmento dinámico [handle], y la vista filtrada
   /productos/?tipo=geles declara esta como canónica. El contenido vive en
   src/data/categorias.ts; esta ruta solo lo elige. */
const categoria = categoriaRequerida("geles");

export const metadata: Metadata = categoriaMetadata(categoria);

export default function GelesEnergeticosPage() {
  return (
    <div
      data-catalog-page
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8"
    >
      <Suspense fallback={<CategoriaLandingSkeleton />}>
        <CategoriaLandingContent categoria={categoria} />
      </Suspense>
    </div>
  );
}
