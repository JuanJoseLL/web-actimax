import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriaLandingContent,
  CategoriaLandingSkeleton,
  categoriaMetadata,
} from "@/components/CategoriaLanding";
import { categoriaRequerida } from "@/data/categorias";

/* La URL que WordPress posicionaba por "barras de proteína". La vista
   filtrada /productos/?tipo=barras declara esta como canónica. El contenido
   vive en src/data/categorias.ts; esta ruta solo lo elige. */
const categoria = categoriaRequerida("barras");

export const metadata: Metadata = categoriaMetadata(categoria);

export default function BarrasDeProteinaPage() {
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
