import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowDownIcon, PackageIcon, TruckIcon } from "lucide-react";
import { ArmaTuKit } from "@/components/ArmaTuKit";
import { SeoBreadcrumbs } from "@/components/SeoBreadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ETIQUETA_UNIDAD, tituloUnidad, type UnidadKit } from "@/lib/arma-kit";
import { getUnidadesDeKit } from "@/lib/catalog";
import { ENVIO_GRATIS_UMBRAL } from "@/lib/envio";
import { formatCOP } from "@/lib/format";
import { selectableProductOptions } from "@/lib/product-variants";
import { pageMetadata } from "@/lib/seo";
import type { Product } from "@/lib/taxonomia";

export const metadata: Metadata = pageMetadata({
  title: "Arma tu kit — Geles, bebidas y barras por unidad",
  description:
    "Combina tus geles, bebidas y barras favoritos para entrenar o competir. Elige sabores y cantidades desde una sola unidad, sin mínimo de compra. Envío gratis desde $120.000 en Colombia.",
  path: "/arma-tu-kit/",
  ogTitle: "Arma tu kit Actimax — Tus favoritos, a tu manera",
  ogDescription:
    "Elige tus productos, combina sabores y lleva lo que necesitas para tus próximos entrenamientos y carreras. Desde una unidad.",
});

export default function ArmaTuKitPage() {
  return (
    <>
      <SeoBreadcrumbs
        items={[
          { name: "Inicio", url: "/" },
          { name: "Arma tu kit", url: "/arma-tu-kit/" },
        ]}
      />
      <Hero />
      <Suspense fallback={<ArmadorCargando />}>
        <Armador />
      </Suspense>
    </>
  );
}

function Hero() {
  return (
    <section className="hero-course overflow-hidden text-white">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-8">
        <div>
          <Badge className="rounded-sm bg-amarillo font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-tinta">
            Arma tu kit
          </Badge>
          <h1 className="mt-4 font-display text-6xl font-extrabold uppercase italic leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl">
            Tus favoritos,
            <span className="block text-amarillo">a tu manera.</span>
          </h1>
        </div>
        <div>
          <p className="max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Combina los geles, bebidas y barras que más te gustan. Tú eliges los
            sabores y cuántos llevar para tus próximos entrenamientos o carreras.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/75">
            <span className="flex items-center gap-2">
              <PackageIcon className="size-4 text-amarillo" />
              Desde una unidad, como quieras combinarlas
            </span>
            <span className="flex items-center gap-2">
              <TruckIcon className="size-4 text-amarillo" />
              Envío gratis desde {formatCOP(ENVIO_GRATIS_UMBRAL)}
            </span>
          </div>
          <Button asChild variant="raceSun" className="mt-6 h-11 px-6">
            <a href="#productos-kit">
              Empezar mi kit <ArrowDownIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ArmadorCargando() {
  return (
    <div className="bg-[#f4f2ec]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-azul">
          Cargando las unidades…
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-none" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Un producto suelto de Shopify, recortado a lo que el armador dibuja.
 *
 * Devuelve null en vez de una unidad a medias: sin momento no hay sección
 * donde ponerla y sin variantes vendibles no hay nada que sumar al kit, y en
 * los dos casos una tarjeta rota se vería peor que la ausencia.
 */
function aUnidadKit(product: Product): UnidadKit | null {
  const momento = product.momentos[0];
  if (momento === undefined) return null;

  /* `selectableProductOptions` es lo que decide si hay sabores que elegir:
     esconde la opción "Title / Default Title" que Shopify le inventa a un
     producto de variante única, como la barra de proteína. */
  const opciones = selectableProductOptions(product.options, product.variants);
  const conSabores = opciones.length > 0;

  const sabores = product.variants.flatMap((variant) =>
    variant.id === null
      ? []
      : [
          {
            variantId: variant.id,
            nombre: conSabores ? variant.title : null,
            /* La foto de la variante manda sobre la del producto: el gel sin
               cafeína viene en un empaque distinto al que lleva cafeína, y
               mostrar el primero de la lista vendería el sabor equivocado. */
            image: variant.image ?? product.images[0] ?? null,
            inStock: variant.inStock,
          },
        ],
  );
  if (sabores.length === 0) return null;

  return {
    handle: product.handle,
    title: tituloUnidad(product.title),
    etiqueta: product.type === null ? "Unidad" : ETIQUETA_UNIDAD[product.type],
    momento,
    price: product.price,
    nombreOpcion: opciones[0]?.name ?? "Sabores",
    sabores,
  };
}

async function Armador() {
  const unidades = (await getUnidadesDeKit())
    .flatMap((product) => aUnidadKit(product) ?? [])
    /* De más barata a más cara dentro de cada momento: un orden estable que
       no depende de cuándo Operaciones creó cada producto en Shopify, y que
       deja al frente la unidad con la que cuesta menos empezar el kit. */
    .sort((a, b) => a.price - b.price);

  return <ArmaTuKit unidades={unidades} />;
}
