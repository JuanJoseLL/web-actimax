import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CategoriaLandingContent,
  CategoriaLandingSkeleton,
  categoriaMetadata,
} from "@/components/CategoriaLanding";
import { categoriaRequerida } from "@/data/categorias";

/* La URL que WordPress posicionaba por "bebidas isotónicas"; las landings por
   ciudad (bebidas-isotonicas-medellin, …) redirigen aquí. Convive con los
   rewrites de las fichas (/productos/bebidas-deportivas/<handle>/): la ruta
   literal solo atiende la raíz. El contenido vive en src/data/categorias.ts. */
const categoria = categoriaRequerida("bebidas");

export const metadata: Metadata = categoriaMetadata(categoria);

export default function BebidasDeportivasPage() {
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
