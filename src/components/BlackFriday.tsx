import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { Button } from "@/components/ui/button";
import snapshot from "@/data/black-friday-precios.json";
import { BLACK_FRIDAY, faseBlackFriday } from "@/lib/black-friday";
import { formatCOP } from "@/lib/format";
import { canonicalProductPath } from "@/lib/product-paths";

/**
 * Los dos avisos de Black Friday: la cinta sobre el menú (todo el sitio) y la
 * primera diapositiva del hero del home. Se prenden y se apagan solos con las fechas de
 * src/lib/black-friday.ts.
 *
 * Miran el reloj dentro de un scope `use cache`, así que esa lectura se
 * congela con la entrada. No llevan una vida corta para compensarlo —la cinta
 * vive en el layout, y una hora de vida ahí pondría a regenerarse todas las
 * rutas del sitio cada hora—: usan la del catálogo y su misma etiqueta. El
 * cron que cambia los precios invalida `catalog` justo después de la hora de
 * inicio y de la de cierre, y ahí se vuelven a evaluar. O sea que el aviso
 * aparece y desaparece junto con los precios, que es lo que importa: nunca
 * anuncia un descuento que la tienda no tiene.
 */
export async function blackFridayActivo(): Promise<boolean> {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 86400, revalidate: 86400, expire: 604800 });
  /* Para ver los avisos en local antes de la fecha: BLACK_FRIDAY_PREVIEW=1 en
     .env.local. En producción no hace nada. */
  if (process.env.NODE_ENV !== "production" && process.env.BLACK_FRIDAY_PREVIEW === "1") {
    return true;
  }
  return faseBlackFriday(new Date()) === "activa";
}

const PORCENTAJE = BLACK_FRIDAY.porcentaje;

export async function BlackFridayCinta() {
  if (!(await blackFridayActivo())) return null;

  return (
    <Link
      href="/productos/"
      className="group flex min-h-10 items-center justify-center gap-x-3 bg-black px-3 py-2 text-center font-display text-[15px] font-semibold uppercase leading-tight tracking-wide text-white sm:text-base"
    >
      <span className="shrink-0 -skew-x-6 rounded-[3px] bg-amarillo px-2 py-0.5 font-extrabold italic text-black">
        Black Friday
      </span>
      <span>
        Toda la tienda con {PORCENTAJE}% de descuento
        <span className="hidden text-white/60 md:inline"> hasta el domingo 29</span>
      </span>
      <span className="hidden shrink-0 text-amarillo underline decoration-2 underline-offset-4 group-hover:no-underline sm:inline">
        Ver productos
      </span>
    </Link>
  );
}

/**
 * Tres precios de verdad en vez de más texto: lo que convence es ver cuánto
 * queda costando lo que uno ya compra. Salen del mismo archivo que usa el
 * cron, así que son exactamente los que están en la tienda.
 */
const EJEMPLOS = [
  { handle: "bebida-deportiva-elite-tarro-500gr", nombre: "Bebida Élite, tarro de 500 g" },
  { handle: "gel-energetico-actimax-caja-x8", nombre: "Gel Energético, caja de 8" },
  { handle: "energy-pack-maraton-42k", nombre: "Energy Pack Maratón 42K" },
];

function ejemplosDePrecio() {
  return EJEMPLOS.flatMap(({ handle, nombre }) => {
    const variante = snapshot.find((producto) => producto.handle === handle)?.variants[0];
    if (variante === undefined) return [];
    return [{ handle, nombre, antes: variante.promo.compareAt, ahora: variante.promo.price }];
  });
}

/** Los cuatro ojales del dorsal, por donde pasan los ganchos. */
function Ojal({ className }: { className: string }) {
  return <span className={`absolute size-2.5 rounded-full bg-black ${className}`} />;
}

/**
 * El descuento va en un dorsal de carrera: es el objeto que cualquier cliente
 * de Actimax ha tenido prendido en la camiseta, y deja el "20%" como número
 * de competidor en vez de un porcentaje gigante suelto.
 */
function Dorsal() {
  return (
    <div
      aria-hidden
      className="relative w-44 -rotate-3 rounded-md bg-amarillo text-black shadow-[0_24px_70px_rgb(255_210_60/0.2)] sm:w-64 lg:w-[22rem] xl:w-[26rem]"
    >
      <Ojal className="left-3 top-3" />
      <Ojal className="right-3 top-3" />
      <Ojal className="bottom-3 left-3" />
      <Ojal className="bottom-3 right-3" />
      <p className="border-b-2 border-black py-2 text-center font-display text-lg font-extrabold uppercase italic tracking-wide sm:text-2xl lg:py-3.5 lg:text-3xl">
        Black Friday
      </p>
      <p className="px-4 pt-2 text-center font-display text-[5.5rem] font-extrabold italic leading-[0.82] tracking-tighter sm:text-[8.5rem] lg:pt-4 lg:text-[12rem] xl:text-[14rem]">
        {PORCENTAJE}
        <span className="text-[0.55em]">%</span>
      </p>
      <p className="pb-7 pt-1.5 text-center font-display text-sm font-bold uppercase tracking-[0.2em] sm:text-xl lg:pb-11 lg:pt-3 lg:text-2xl">
        de descuento
      </p>
    </div>
  );
}

/**
 * La diapositiva que abre el hero mientras dura la promo. Reemplaza a la de
 * marca en vez de sumarse como banda aparte: dos vallas seguidas obligaban a
 * bajar para ver la oferta. Por ser la primera lleva el h1 del home.
 *
 * `alto` es la clase de alto mínimo que comparten las diapositivas del hero.
 */
export function BlackFridaySlide({ alto }: { alto: string }) {
  const ejemplos = ejemplosDePrecio();

  return (
    <div
      className={`grid h-full items-center gap-8 bg-black px-4 pt-8 pb-10 sm:px-8 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pr-14 lg:pl-[max(3.5rem,calc((100vw-1440px)/2+5rem))] xl:pr-20 xl:pl-[max(5rem,calc((100vw-1440px)/2+5rem))] ${alto}`}
    >
      <div className="flex justify-center lg:order-2">
        <Dorsal />
      </div>

      <div>
        <h1 className="max-w-2xl font-display text-[13vw] font-extrabold uppercase italic leading-[0.84] tracking-[-0.035em] sm:text-[5.5rem] lg:text-[6rem] xl:text-[7rem]">
          {/* El porcentaje lo dice el dorsal, que es decorativo: acá va solo
              para lectores de pantalla y buscadores. */}
          <span className="sr-only">Black Friday Actimax: {PORCENTAJE}% de descuento </span>
          En toda la tienda, hasta el domingo
        </h1>
        <p className="mt-5 max-w-lg text-base font-medium leading-relaxed text-white/72 sm:text-lg">
          El precio que ves ya tiene el descuento, sin códigos. Termina el domingo 29 de
          noviembre a la medianoche.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="raceSun" size="lg" className="h-auto px-8 py-4 text-lg">
            <Link href="/productos/">Ver productos</Link>
          </Button>
          <Button asChild variant="raceOutline" size="lg" className="h-auto px-8 py-4 text-lg">
            <Link href="/arma-tu-kit/">Armar mi kit</Link>
          </Button>
        </div>

        {ejemplos.length > 0 ? (
          <ul className="mt-8 max-w-lg divide-y divide-white/15 border-y border-white/15">
            {ejemplos.map((ejemplo) => (
              <li key={ejemplo.handle}>
                <Link
                  href={canonicalProductPath(ejemplo.handle)}
                  className="flex items-baseline justify-between gap-4 py-3 hover:text-amarillo"
                >
                  <span className="font-medium">{ejemplo.nombre}</span>
                  <span className="flex shrink-0 items-baseline gap-3 font-mono tabular-nums">
                    <s className="text-sm text-white/45">{formatCOP(ejemplo.antes)}</s>
                    <span className="text-lg font-bold text-amarillo">
                      {formatCOP(ejemplo.ahora)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
