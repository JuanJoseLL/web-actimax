import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageIcon, TruckIcon } from "lucide-react";
import { ArmaTuKit } from "@/components/ArmaTuKit";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ETIQUETA_UNIDAD,
  MINIMO_UNIDADES,
  tituloUnidad,
  type UnidadKit,
} from "@/lib/arma-kit";
import { getUnidadesDeKit } from "@/lib/catalog";
import { ENVIO_GRATIS_UMBRAL } from "@/lib/envio";
import { formatCOP } from "@/lib/format";
import { selectableProductOptions } from "@/lib/product-variants";
import { pageMetadata } from "@/lib/seo";
import type { Product } from "@/lib/taxonomia";

export const metadata: Metadata = pageMetadata({
  title: "Arma tu kit — Geles, bebidas y barras por unidad",
  description:
    "Arma el kit de tu próxima carrera unidad por unidad: los geles, sobres y barras que ya probaste, en la cantidad que pide tu distancia. Desde 6 unidades, con envíos a toda Colombia.",
  path: "/arma-tu-kit/",
  ogTitle: "Arma tu kit Actimax — Nada que no hayas probado",
  ogDescription:
    "Gel por gel y sobre por sobre: los sabores que ya te caen bien, la cafeína que toleras y la cantidad que pide tu distancia.",
});

export default function ArmaTuKitPage() {
  return (
    <>
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
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:px-8">
        <div>
          <Badge className="rounded-sm bg-amarillo font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-tinta">
            Arma tu kit · Unidades sueltas
          </Badge>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-extrabold uppercase italic leading-[0.84] tracking-tight sm:text-8xl lg:text-9xl">
            Nada que
            <span className="block">no hayas</span>
            <span className="block text-amarillo">probado.</span>
          </h1>
        </div>
        <div className="border-l border-white/20 pl-4 sm:pl-6">
          <p className="text-lg font-medium leading-relaxed text-white/75">
            El día de la carrera no se estrena nada. Un Energy Pack trae un contenido fijo;
            este kit lo armas unidad por unidad con los geles que ya sabes que te caen bien,
            la cafeína que toleras y la cantidad que pide tu distancia.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
            <span className="flex items-center gap-2">
              <PackageIcon className="size-4 text-amarillo" />
              Desde {MINIMO_UNIDADES} unidades
            </span>
            <span className="flex items-center gap-2">
              <TruckIcon className="size-4 text-amarillo" />
              Envío gratis desde {formatCOP(ENVIO_GRATIS_UMBRAL)}
            </span>
          </div>
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
