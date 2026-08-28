import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { categoriaParaPost } from "@/data/categorias";

/**
 * Enlace interno desde los posts que hablan de una categoría hacia su
 * landing, con el nombre de la categoría como texto del ancla. Los cuerpos
 * de los artículos viven en Shopify y reimportarlos es destructivo, así que
 * el enlace se añade desde la plantilla y se decide por datos
 * (src/data/categorias.ts). Un post sin categoría no muestra nada.
 */
export function CategoriaCta({ post }: { post: { slug: string; title: string } }) {
  const categoria = categoriaParaPost(post);
  if (categoria === undefined) return null;

  const nombre = categoria.nombre.toLocaleLowerCase("es-CO");
  return (
    <Card className="mt-12 bg-muted py-0">
      <CardContent className="flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-azul">
            {categoria.kicker}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-tinta/80">
            Todo lo de este artículo aplica a los{" "}
            <Link
              href={categoria.path}
              className="font-semibold text-azul underline-offset-4 hover:underline"
            >
              {nombre}
            </Link>{" "}
            Actimax: hechos en Colombia, con envío a todo el país.
          </p>
        </div>
        <Button asChild variant="race" size="lg" className="shrink-0">
          <Link href={categoria.path}>Ver {nombre}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
