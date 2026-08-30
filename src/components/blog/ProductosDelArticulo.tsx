import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { esProductoDe, landingParaPost, type Landing } from "@/data/deportes";
import { BEST_SELLERS } from "@/data/destacados";
import type { BlogPost } from "@/lib/blog";
import { getAllProducts, typeLabel, type Product } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { canonicalProductPath } from "@/lib/product-paths";

/**
 * Los productos que resuelven lo que el artículo acaba de explicar.
 *
 * En pantallas anchas el artículo mide 896 px y el resto del ancho quedaba en
 * blanco; acá vive la columna lateral que lo ocupa y que sigue al lector
 * mientras baja (sticky). Abajo de `xl` no hay costados que llenar, así que
 * el mismo bloque cae en el flujo, al cerrar el artículo, como una tarjeta de
 * dos columnas.
 *
 * Qué se muestra sale de los datos, no de una lista por post: la landing de
 * la que trata el artículo (src/data/deportes.ts decide cuál por las palabras
 * del slug y del título) y su grilla de productos. Un post sin landing —los
 * de vida saludable, los de noticias— cae en los favoritos del home.
 *
 * Absorbe el antiguo CategoriaCta: la frase con el enlace interno de texto
 * clave ("toda la nutrición para ciclismo está…") sigue igual, pero ahora
 * acompaña a los productos en vez de ser una tarjeta aparte que repetía el
 * mismo botón dos veces seguidas.
 */
export async function ProductosDelArticulo({ post }: { post: BlogPost }) {
  const landing = landingParaPost(post);
  const productos = recomendados(landing, await getAllProducts());
  if (productos.length === 0) return null;

  const nombre = landing?.nombre.toLocaleLowerCase("es-CO");

  return (
    <aside
      aria-labelledby="productos-articulo"
      className="mx-auto w-full min-w-0 max-w-4xl xl:mx-0 xl:max-w-none xl:sticky xl:top-28 xl:self-start"
    >
      <div className="rounded-xl border border-tinta/10 bg-[#f4f2ec] p-5 sm:p-6 xl:p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-azul">
          Combustible Actimax
        </p>
        <h2
          id="productos-articulo"
          className="mt-2 font-display text-2xl font-extrabold uppercase italic leading-[0.98]"
        >
          {landing?.nombre ?? "Los que siempre vuelven"}
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-tinta/70">
          {landing === undefined ? (
            "Lo que más se llevan quienes entrenan con Actimax. Hecho en Colombia, con envío a todo el país."
          ) : (
            <>
              {landing.cta.antes}{" "}
              <Link
                href={landing.path}
                className="font-semibold text-azul underline-offset-4 hover:underline"
              >
                {nombre}
              </Link>{" "}
              {landing.cta.despues}
            </>
          )}
        </p>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {productos.map((producto) => (
            <ProductoFila key={producto.handle} product={producto} />
          ))}
        </ul>

        <Button asChild variant="race" className="mt-5 h-auto w-full py-3">
          <Link href={landing?.path ?? "/productos/"}>
            {nombre === undefined ? "Ver todos los productos" : `Ver ${nombre}`}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-tinta/60">
          ¿Vas por una distancia?{" "}
          <Link
            href="/productos/?tipo=kits"
            className="font-semibold text-azul underline-offset-4 hover:underline"
          >
            Energy Packs
          </Link>
        </p>
      </div>
    </aside>
  );
}

/**
 * El mismo criterio de las landings —solo lo que hay en stock, del más barato
 * al más caro— recortado a cuatro. Si la landing deja menos de tres (o el post
 * no tiene landing), completa con los favoritos del home sin repetir.
 */
function recomendados(landing: Landing | undefined, todos: Product[]): Product[] {
  const disponibles = todos.filter((producto) => producto.inStock);
  const orden = (a: Product, b: Product) =>
    a.price - b.price || a.title.localeCompare(b.title, "es");

  const elegidos =
    landing === undefined
      ? []
      : disponibles
          .filter((producto) => esProductoDe(landing, producto))
          .toSorted(orden)
          .slice(0, 4);

  if (elegidos.length >= 3) return elegidos;

  const puestos = new Set(elegidos.map((producto) => producto.handle));
  for (const handle of BEST_SELLERS) {
    if (elegidos.length === 4) break;
    if (puestos.has(handle)) continue;
    const favorito = disponibles.find((producto) => producto.handle === handle);
    if (favorito === undefined) continue;
    elegidos.push(favorito);
    puestos.add(handle);
  }
  return elegidos;
}

function ProductoFila({ product }: { product: Product }) {
  const productPath = canonicalProductPath(product.handle);

  return (
    <li>
      <Link
        href={productPath}
        className="group flex h-full items-center gap-3 rounded-md border border-transparent bg-white p-2 transition-colors hover:border-azul/25"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded bg-muted">
          {product.images[0] !== undefined ? (
            <Image
              src={product.images[0]}
              alt=""
              fill
              sizes="64px"
              className="object-contain p-1 mix-blend-multiply"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-azul">
            {typeLabel(product.type)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug group-hover:text-azul">
            {product.title}
          </p>
          <p className="mt-1 font-mono text-[13px] font-bold tabular-nums">
            {formatCOP(product.price)}
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Reserva el hueco de la columna para que el artículo no salte al llegar. */
export function ProductosDelArticuloSkeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto w-full min-w-0 max-w-4xl xl:mx-0 xl:max-w-none xl:sticky xl:top-28 xl:self-start"
    >
      <div className="rounded-xl border border-tinta/10 bg-[#f4f2ec] p-5 sm:p-6 xl:p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-7 w-52" />
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {[0, 1, 2, 3].map((fila) => (
            <Skeleton key={fila} className="h-20 rounded-md" />
          ))}
        </div>
        <Skeleton className="mt-5 h-11 rounded-sm" />
      </div>
    </div>
  );
}
