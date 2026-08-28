import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { landingParaPost } from "@/data/deportes";

/**
 * Enlace interno desde los posts que hablan de una categoría o de un deporte
 * hacia su landing, con el nombre de la landing como texto del ancla. Los
 * cuerpos de los artículos viven en Shopify y reimportarlos es destructivo,
 * así que el enlace se añade desde la plantilla y se decide por datos
 * (src/data/categorias.ts y src/data/deportes.ts). Un post sin landing no
 * muestra nada.
 */
export function CategoriaCta({ post }: { post: { slug: string; title: string } }) {
  const landing = landingParaPost(post);
  if (landing === undefined) return null;

  const nombre = landing.nombre.toLocaleLowerCase("es-CO");
  return (
    <Card className="mt-12 bg-muted py-0">
      <CardContent className="flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-azul">
            {landing.kicker}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-tinta/80">
            {landing.cta.antes}{" "}
            <Link
              href={landing.path}
              className="font-semibold text-azul underline-offset-4 hover:underline"
            >
              {nombre}
            </Link>{" "}
            {landing.cta.despues}
          </p>
        </div>
        <Button asChild variant="race" size="lg" className="shrink-0">
          <Link href={landing.path}>Ver {nombre}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
