"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { PackageOpenIcon, ShoppingBagIcon, TruckIcon, XIcon } from "lucide-react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cartSurface } from "@/lib/analytics";
import {
  AYUDA_MOMENTO,
  MINIMO_UNIDADES,
  TITULO_MOMENTO,
  faltaParaEnvioGratis,
  faltanParaMinimo,
  resumenKit,
  subtotalKit,
  totalUnidades,
  unidadesPorMomento,
  type SeleccionKit,
  type UnidadKit,
} from "@/lib/arma-kit";
import {
  guardarKit,
  kitDelServidor,
  kitGuardado,
  kitGuardadoCrudo,
  saboresDeSeleccion,
  suscribirseAlKit,
} from "@/lib/kit-guardado";
import { ENVIO_GRATIS_UMBRAL } from "@/lib/envio";
import { formatCOP } from "@/lib/format";
import { track } from "@/lib/track";
import type { Momento } from "@/lib/taxonomia";

/**
 * El marcador de cada sección es la hora de carrera, no un número de paso.
 *
 * Es el mismo reloj que usa la línea de tiempo de /mi-plan ("30 min antes",
 * "Min 45", "Meta +30 min"), y dice algo que un 01/02/03 no diría: acá el
 * orden no es una lista de pasos, es un cronómetro.
 */
const MARCA_MOMENTO: Record<Momento, string> = {
  antes: "–30 min",
  durante: "En ruta",
  despues: "Meta +30",
};

/**
 * Cuántas casillas dibuja la tira de móvil antes de resumir el resto en "+N".
 *
 * La tira pone una casilla por línea —un producto en un sabor, con la
 * cantidad en la esquina—, no una por unidad. Doce sachets iguales en fila no
 * decían nada que un "×12" no diga mejor, y en la barra fija no caben.
 */
const MAX_LINEAS_VISIBLES = 8;

/** Un renglón del kit: un producto en un sabor, con cuántos lleva. */
interface LineaKit {
  variantId: string;
  handle: string;
  titulo: string;
  sabor: string | null;
  image: string | null;
  cantidad: number;
  /** El precio de una unidad; la línea lo multiplica por la cantidad. */
  precio: number;
}

/** El sabor que aparece elegido al abrir: el primero que se pueda comprar. */
function saboresIniciales(unidades: readonly UnidadKit[]): Record<string, string> {
  const inicial: Record<string, string> = {};
  for (const unidad of unidades) {
    const sabor = unidad.sabores.find((s) => s.inStock) ?? unidad.sabores[0];
    if (sabor !== undefined) inicial[unidad.handle] = sabor.variantId;
  }
  return inicial;
}

/** Lo que lleva el kit, un renglón por variante y en orden de carrera. */
function lineasDelKit(
  grupos: ReturnType<typeof unidadesPorMomento>,
  seleccion: SeleccionKit,
): LineaKit[] {
  const lineas: LineaKit[] = [];
  for (const grupo of grupos) {
    for (const unidad of grupo.unidades) {
      for (const sabor of unidad.sabores) {
        const cantidad = seleccion[sabor.variantId] ?? 0;
        if (cantidad <= 0) continue;
        lineas.push({
          variantId: sabor.variantId,
          handle: unidad.handle,
          titulo: unidad.title,
          sabor: sabor.nombre,
          image: sabor.image,
          cantidad,
          precio: unidad.price,
        });
      }
    }
  }
  return lineas;
}

/** Cómo se lee un sabor en el selector, con su disponibilidad al lado. */
function etiquetaSabor(
  sabor: UnidadKit["sabores"][number],
  unidad: UnidadKit,
  marcarAgotados: boolean,
): string {
  const nombre = sabor.nombre ?? unidad.title;
  return marcarAgotados && !sabor.inStock ? `${nombre} · agotado` : nombre;
}

/** Por qué no se puede pagar todavía. Null cuando sí se puede. */
function motivoBloqueo(hayInventario: boolean, faltan: number): string | null {
  if (!hayInventario) return "Sin inventario todavía";
  if (faltan > 0) return `Faltan ${faltan} ${faltan === 1 ? "unidad" : "unidades"}`;
  return null;
}

/* Llevar a la vista la tarjeta de una unidad desde su casilla en la tira.
   El salto instantáneo es lo correcto para quien pidió menos movimiento. */
function irALaUnidad(handle: string): void {
  const tarjeta = document.getElementById(`unidad-${handle}`);
  if (tarjeta === null) return;
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tarjeta.scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth", block: "center" });
}

export function ArmaTuKit({ unidades }: { unidades: UnidadKit[] }) {
  const { add, open } = useCart();
  /* El kit no vive en un useState: vive en localStorage y React se suscribe,
     igual que el carrito. Así sobrevive a la recarga y a que el comprador
     vuelva mañana, sin efectos que restauren al montar. */
  const serializado = useSyncExternalStore(
    suscribirseAlKit,
    kitGuardadoCrudo,
    kitDelServidor,
  );
  const seleccion = useMemo(
    () => kitGuardado(serializado, unidades),
    [serializado, unidades],
  );
  const setSeleccion = (siguiente: SeleccionKit) => guardarKit(siguiente);

  /* Solo los sabores que el comprador tocó a mano. El resto se deduce: manda
     el que ya está en el kit —volver con tres geles de mango y ver
     "Fresa-Banano" en el selector es peor que no restaurar nada— y a falta de
     eso, el primero disponible. */
  const [saborElegido, setSaborElegido] = useState<Record<string, string>>({});
  const saborPorUnidad = useMemo(
    () => ({
      ...saboresIniciales(unidades),
      ...saboresDeSeleccion(seleccion, unidades),
      ...saborElegido,
    }),
    [unidades, seleccion, saborElegido],
  );

  const grupos = useMemo(() => unidadesPorMomento(unidades), [unidades]);
  const lineas = useMemo(() => lineasDelKit(grupos, seleccion), [grupos, seleccion]);

  const total = totalUnidades(seleccion);
  const subtotal = subtotalKit(seleccion, unidades);
  const faltan = faltanParaMinimo(seleccion);
  const faltaEnvio = faltaParaEnvioGratis(subtotal);
  const hayInventario = unidades.some((unidad) => unidad.sabores.some((s) => s.inStock));
  const motivo = motivoBloqueo(hayInventario, faltan);

  function cambiarCantidad(variantId: string, cantidad: number) {
    {
      const siguiente = { ...seleccion };
      /* Las variantes en cero se borran en vez de guardarse: así la selección
         es siempre la lista de lo que lleva el kit y no acumula ceros por
         cada sabor que alguien subió y volvió a bajar. */
      if (cantidad <= 0) delete siguiente[variantId];
      else siguiente[variantId] = cantidad;
      setSeleccion(siguiente);
    }
  }

  function agregarKit() {
    const lineas: Array<{ line: CartLine; qty: number }> = [];
    const handles: string[] = [];
    const momentos = new Set<Momento>();

    for (const grupo of grupos) {
      for (const unidad of grupo.unidades) {
        let llevaAlgo = false;
        for (const sabor of unidad.sabores) {
          const cantidad = seleccion[sabor.variantId] ?? 0;
          if (cantidad <= 0) continue;
          llevaAlgo = true;
          lineas.push({
            qty: cantidad,
            line: {
              variantId: sabor.variantId,
              variantTitle: sabor.nombre ?? undefined,
              handle: unidad.handle,
              title: unidad.title,
              price: unidad.price,
              image: sabor.image,
            },
          });
        }
        if (llevaAlgo) {
          handles.push(unidad.handle);
          momentos.add(unidad.momento);
        }
      }
    }
    if (lineas.length === 0) return;

    for (const { line, qty } of lineas) add(line, qty);

    /* Un `agregar_al_carrito` por producto, no por sabor ni por unidad: es lo
       que mantiene comparable este ranking con el del catálogo, donde cada
       clic cuenta un handle sin importar la cantidad. */
    const origen = cartSurface(window.location.pathname);
    for (const handle of handles) track("agregar_al_carrito", { producto: handle, origen });

    /* El pageview de /arma-tu-kit/ no dice nada del kit que salió. `unidades`
       responde si el mínimo de seis estorba o se queda corto —es el número
       que habría que mover— y `momentos` dice si la gente arma la carrera
       completa o solo pasa por los geles, que es la apuesta de agrupar la
       página así. La plata no viaja acá: el carrito entero se mide en
       `iniciar_checkout` y contarla dos veces inflaría los ingresos. Vercel
       solo admite 2 propiedades por evento. */
    track("kit_armado", { unidades: total, momentos: momentos.size });

    /* El kit se vacía al pasar al carrito: ya no está "a medio armar", está
       comprándose. Sin esto queda guardado en el navegador y quien vuelva la
       semana entrante se encuentra el kit que ya pidió, con el botón listo
       para pedirlo por segunda vez sin darse cuenta. Nada se pierde: lo que
       había ahora se edita en el carrito, que es lo que se abre enseguida. */
    setSeleccion({});

    /* Sin toast: el carrito que se abre es el acuse de recibo, igual que en
       el botón grande de la ficha de producto. */
    open();
  }

  const estado = (
    <EstadoKit motivo={motivo} subtotal={subtotal} faltaEnvio={faltaEnvio} />
  );

  return (
    <div className="bg-[#f4f2ec]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
        {hayInventario ? null : <AvisoSinInventario />}

        {grupos.length === 0 ? (
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            No pudimos cargar las unidades. Vuelve a intentarlo en un momento o escríbenos
            por WhatsApp y te armamos el kit a mano.
          </p>
        ) : (
          /* `min-w-0` en las dos columnas: una pista `fr` no es un techo, es
             un reparto del sobrante, y su mínimo automático es el min-content
             de lo que lleva dentro. Sin esto, lo que no quepa en el panel
             —antes, la tira de una casilla por unidad— ensancha su columna y
             le roba el ancho al catálogo. */
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start lg:gap-12">
            <div className="grid min-w-0 gap-12">
              {grupos.map((grupo) => (
                <section key={grupo.momento}>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-azul">
                      {MARCA_MOMENTO[grupo.momento]}
                    </p>
                    <span aria-hidden className="h-px flex-1 bg-tinta/15" />
                  </div>
                  <h2 className="mt-3 font-display text-4xl font-extrabold uppercase italic leading-none sm:text-5xl">
                    {TITULO_MOMENTO[grupo.momento]}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {AYUDA_MOMENTO[grupo.momento]}
                  </p>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {grupo.unidades.map((unidad) => (
                      <TarjetaUnidad
                        key={unidad.handle}
                        unidad={unidad}
                        seleccion={seleccion}
                        variantIdElegida={saborPorUnidad[unidad.handle]}
                        onElegirSabor={(variantId) =>
                          setSaborElegido((actual) => ({
                            ...actual,
                            [unidad.handle]: variantId,
                          }))
                        }
                        onCambiarCantidad={cambiarCantidad}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* El panel de escritorio y la barra de móvil son el mismo kit en
                dos formatos; solo uno está visible a la vez, así que el lector
                de pantalla nunca lo oye dos veces. */}
            <aside className="hidden min-w-0 lg:sticky lg:top-24 lg:block">
              <PanelKit
                lineas={lineas}
                total={total}
                subtotal={subtotal}
                faltan={faltan}
                texto={resumenKit(seleccion, unidades)}
                motivo={motivo}
                estado={estado}
                onQuitar={(variantId) => cambiarCantidad(variantId, 0)}
                onAgregar={agregarKit}
              />
            </aside>
          </div>
        )}
      </div>

      {grupos.length === 0 ? null : (
        <>
          {/* Espacio para que la barra fija no tape el final de la página. */}
          <div aria-hidden className="h-40 lg:hidden" />
          <BarraKit
            lineas={lineas}
            total={total}
            subtotal={subtotal}
            faltan={faltan}
            motivo={motivo}
            estado={estado}
            onAgregar={agregarKit}
          />
        </>
      )}
    </div>
  );
}

function AvisoSinInventario() {
  return (
    <div className="mb-10 border-l-4 border-amarillo bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2 text-azul">
        <PackageOpenIcon className="size-4" />
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
          Inventario en camino
        </p>
      </div>
      <h2 className="mt-2 font-display text-3xl font-extrabold uppercase italic leading-none sm:text-4xl">
        Todavía no hay unidades sueltas
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Estamos cargando las primeras. Los sabores y los precios de abajo ya son los
        definitivos, así que puedes ir decidiendo qué llevas. Si compites este fin de
        semana, los Energy Packs salen hoy mismo.
      </p>
      <Button asChild variant="raceInk" size="lg" className="mt-5">
        <Link href="/productos/?tipo=kits">Ver los Energy Packs</Link>
      </Button>
    </div>
  );
}

function TarjetaUnidad({
  unidad,
  seleccion,
  variantIdElegida,
  onElegirSabor,
  onCambiarCantidad,
}: {
  unidad: UnidadKit;
  seleccion: SeleccionKit;
  variantIdElegida: string | undefined;
  onElegirSabor: (variantId: string) => void;
  onCambiarCantidad: (variantId: string, cantidad: number) => void;
}) {
  const sabor =
    unidad.sabores.find((s) => s.variantId === variantIdElegida) ?? unidad.sabores[0];
  const cantidad = sabor === undefined ? 0 : (seleccion[sabor.variantId] ?? 0);
  const elegidos = unidad.sabores.filter((s) => (seleccion[s.variantId] ?? 0) > 0);
  const enElKit = elegidos.reduce((suma, s) => suma + (seleccion[s.variantId] ?? 0), 0);
  const unidadAgotada = !unidad.sabores.some((s) => s.inStock);
  /* Solo hay sabores que elegir cuando el producto los tiene: la barra de
     proteína existe en Shopify con la opción "Title / Default Title". */
  const hayQueElegirSabor = unidad.sabores.length > 1;
  /* El "agotado" al lado de cada sabor solo informa si algún otro sí está;
     con la unidad entera agotada repetiría cuatro veces lo que ya dice la foto. */
  const marcarAgotados = !unidadAgotada;

  return (
    <article
      id={`unidad-${unidad.handle}`}
      className={`flex scroll-mt-24 flex-col border bg-white p-3 transition-colors sm:p-4 ${
        enElKit > 0
          ? "border-tinta shadow-[inset_4px_0_0_0_var(--color-amarillo)]"
          : "border-tinta/10"
      }`}
    >
      <div className="flex flex-1 gap-4">
        <div className="relative size-24 shrink-0 bg-niebla sm:size-28">
          {sabor?.image != null ? (
            <Image
              src={sabor.image}
              alt={`${unidad.title}${sabor.nombre !== null ? ` · ${sabor.nombre}` : ""}`}
              fill
              sizes="112px"
              className={`object-contain p-2 mix-blend-multiply ${
                unidadAgotada ? "opacity-45" : ""
              }`}
            />
          ) : null}
          {enElKit > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center bg-amarillo font-mono text-[11px] font-bold tabular-nums text-tinta">
              {enElKit}
            </span>
          ) : null}
          {unidadAgotada ? (
            <span className="absolute inset-x-0 bottom-0 bg-tinta/85 py-1 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white">
              Agotado
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {unidad.etiqueta}
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold uppercase italic leading-[0.95]">
            {unidad.title}
          </h3>
          <p className="mt-1.5 font-mono text-sm font-bold tabular-nums">
            {formatCOP(unidad.price)}
            <span className="ml-1.5 text-[10px] font-normal uppercase tracking-[0.12em] text-muted-foreground">
              c/u
            </span>
          </p>
        </div>
      </div>

      {/* Los controles van debajo y a todo el ancho: en la columna angosta el
          selector cortaba justo "(sin cafeína)", que es lo que más importa
          saber antes de elegir. */}
      <div className="mt-3">
        {!hayQueElegirSabor ? null : unidadAgotada ? (
          /* Sin inventario no hay nada que elegir. Un selector con todas las
             opciones deshabilitadas es un callejón sin salida; la lista al
             menos deja ver qué sabores va a traer. */
          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-muted-foreground">
            <span className="font-bold text-tinta/70">{unidad.nombreOpcion}: </span>
            {unidad.sabores.map((s) => s.nombre).join(" · ")}
          </p>
        ) : (
          <Select value={sabor?.variantId} onValueChange={onElegirSabor}>
            <SelectTrigger
              className="h-10 w-full rounded-none font-mono text-xs"
              aria-label={`${unidad.nombreOpcion} de ${unidad.title}`}
            >
              {/* Con hijos, el sabor elegido ya viaja en el HTML: sin ellos
                  Radix lo pinta solo al hidratar y el campo llega en blanco
                  justo en la página que se trata de elegir sabor. */}
              <SelectValue>
                {sabor === undefined ? "" : etiquetaSabor(sabor, unidad, marcarAgotados)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {unidad.sabores.map((opcion) => (
                <SelectItem
                  key={opcion.variantId}
                  value={opcion.variantId}
                  disabled={!opcion.inStock}
                >
                  {etiquetaSabor(opcion, unidad, marcarAgotados)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {unidadAgotada ? null : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            {sabor?.inStock === true ? (
              <QuantitySelector
                value={cantidad}
                min={0}
                onChange={(valor) => onCambiarCantidad(sabor.variantId, valor)}
                label={`unidades de ${unidad.title}${
                  sabor.nombre !== null ? ` ${sabor.nombre}` : ""
                }`}
              />
            ) : (
              <p className="border border-dashed border-tinta/25 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Sin existencias
              </p>
            )}
            {cantidad > 0 ? (
              <p className="font-mono text-xs font-bold tabular-nums text-azul">
                {formatCOP(unidad.price * cantidad)}
              </p>
            ) : null}
          </div>
        )}

        {/* Con dos sabores del mismo producto en el kit, el contador solo
            muestra el del sabor a la vista; esta línea enseña el resto. */}
        {elegidos.length > 1 ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {elegidos
              .map((s) => `${s.nombre ?? "unidad"} ×${seleccion[s.variantId]}`)
              .join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/** El kit en la columna de escritorio, fijo mientras se recorre el catálogo. */
function PanelKit({
  lineas,
  total,
  subtotal,
  faltan,
  texto,
  motivo,
  estado,
  onQuitar,
  onAgregar,
}: {
  lineas: LineaKit[];
  total: number;
  subtotal: number;
  faltan: number;
  texto: string;
  motivo: string | null;
  estado: ReactNode;
  onQuitar: (variantId: string) => void;
  onAgregar: () => void;
}) {
  const completo = faltan === 0 && total > 0;

  return (
    <section
      aria-label="Tu kit"
      className={`border-t-4 bg-tinta text-white transition-colors ${
        completo ? "border-amarillo" : "border-white/15"
      }`}
    >
      {/* El contador va arriba a la derecha, en la línea del rótulo: es el
          número que decide si el botón se puede pulsar, y ahí se lee sin
          tener que recorrer el panel entero. */}
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amarillo">
          {completo ? "Kit listo" : "Tu kit"}
        </p>
        <p className="shrink-0 font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.14em] text-white/50">
          {total}/{MINIMO_UNIDADES}
        </p>
      </div>

      {/* Lo único que crece con el kit es la lista, y crece hacia adentro: al
          quinto renglón se desplaza sola en vez de empujar el subtotal y el
          botón fuera de la pantalla, que es lo que tiene que quedar a la
          vista mientras se recorre el catálogo. */}
      <ListaDelKit lineas={lineas} onQuitar={onQuitar} />

      <div className="px-5 pb-5">
        {total > 0 ? (
          /* Qué momentos de la carrera quedaron cubiertos: es lo único que la
             lista no dice sola y la razón de agrupar la página así. */
          <p className="mt-3 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/50">
            {texto}
          </p>
        ) : null}

        <div className="mt-4 border-t border-white/15 pt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
            Subtotal
          </p>
          <p className="font-display text-4xl font-extrabold italic leading-none tabular-nums">
            {formatCOP(subtotal)}
          </p>
        </div>

        <Button
          type="button"
          /* Sobre el panel oscuro un botón azul apagado sigue pareciendo
             pulsable; el contorno dice "todavía no" sin ambigüedad. */
          variant={motivo === null ? "raceSun" : "raceOutline"}
          size="lg"
          disabled={motivo !== null}
          onClick={onAgregar}
          className="mt-4 w-full py-3 text-base"
        >
          <ShoppingBagIcon data-icon="inline-start" />
          Agregar mi kit
        </Button>

        {estado}
      </div>
    </section>
  );
}

/** El mismo kit en móvil: una barra fija, del alto de un pulgar. */
function BarraKit({
  lineas,
  total,
  subtotal,
  faltan,
  motivo,
  estado,
  onAgregar,
}: {
  lineas: LineaKit[];
  total: number;
  subtotal: number;
  faltan: number;
  motivo: string | null;
  estado: ReactNode;
  onAgregar: () => void;
}) {
  const completo = faltan === 0 && total > 0;

  return (
    /* `data-buy-bar` es el gancho con el que globals.css esconde el botón de
       WhatsApp mientras hay una acción de compra abajo, el mismo que usa la
       barra fija de la ficha de producto. */
    <div
      data-buy-bar
      aria-hidden="false"
      className={`fixed inset-x-0 bottom-0 z-40 border-t-4 bg-tinta text-white transition-colors lg:hidden ${
        completo ? "border-amarillo" : "border-white/15"
      }`}
    >
      <section
        aria-label="Tu kit"
        className="px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <TiraDelKit lineas={lineas} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-amarillo">
              {completo ? "Kit listo" : "Tu kit"}
            </p>
            <p className="flex items-baseline gap-2">
              <span className="font-mono text-lg font-bold leading-tight tabular-nums">
                {formatCOP(subtotal)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
                {completo ? `${total} unidades` : `${total}/${MINIMO_UNIDADES}`}
              </span>
            </p>
          </div>
          <Button
            type="button"
            variant={motivo === null ? "raceSun" : "raceOutline"}
            size="lg"
            disabled={motivo !== null}
            onClick={onAgregar}
            className="shrink-0 px-4 py-3"
          >
            <ShoppingBagIcon data-icon="inline-start" />
            Agregar
          </Button>
        </div>
        {estado}
      </section>
    </div>
  );
}

/**
 * La línea de estado bajo el botón: o el motivo por el que no se puede pagar,
 * o lo que falta para el envío gratis.
 *
 * Nunca las dos: bajo el mínimo, el envío gratis todavía no es la decisión.
 */
function EstadoKit({
  motivo,
  subtotal,
  faltaEnvio,
}: {
  motivo: string | null;
  subtotal: number;
  faltaEnvio: number;
}) {
  if (motivo !== null) {
    return (
      <p className="mt-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amarillo">
        {motivo}
      </p>
    );
  }
  return (
    <div className="mt-2.5">
      <Progress
        value={Math.min(100, (subtotal / ENVIO_GRATIS_UMBRAL) * 100)}
        className="h-1 bg-white/15 [&_[data-slot=progress-indicator]]:bg-amarillo"
      />
      <p className="mt-1.5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">
        <TruckIcon className="size-3.5 shrink-0 text-amarillo" />
        {faltaEnvio > 0
          ? `${formatCOP(faltaEnvio)} para envío gratis`
          : "Envío gratis incluido"}
      </p>
    </div>
  );
}

/**
 * La tira del kit en la barra de móvil: una casilla por línea, en el orden en
 * que se consumen.
 *
 * Sigue siendo la mesa de la noche anterior con los sobres puestos en fila,
 * pero un sobre por producto y sabor, con la cantidad en la esquina. Una
 * casilla por unidad llenaba la barra de miniaturas idénticas apenas alguien
 * pedía media docena de geles, que es justo el kit que la página promueve.
 */
function TiraDelKit({ lineas }: { lineas: LineaKit[] }) {
  if (lineas.length === 0) {
    return (
      <p className="flex h-10 items-center border border-dashed border-white/25 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50">
        Mínimo {MINIMO_UNIDADES} unidades para despachar
      </p>
    );
  }

  const visibles = lineas.slice(0, MAX_LINEAS_VISIBLES);
  const ocultas = lineas.length - visibles.length;

  return (
    <ol className="flex gap-1.5 overflow-x-auto pb-1">
      {visibles.map((linea) => (
        <li key={linea.variantId} className="shrink-0">
          <button
            type="button"
            onClick={() => irALaUnidad(linea.handle)}
            title={linea.sabor !== null ? `${linea.titulo} · ${linea.sabor}` : linea.titulo}
            className="relative block size-10 bg-white/95 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
          >
            <span className="sr-only">
              Ver {linea.titulo}
              {linea.sabor !== null ? ` ${linea.sabor}` : ""} ({linea.cantidad})
            </span>
            {linea.image !== null ? (
              <Image
                src={linea.image}
                alt=""
                fill
                sizes="40px"
                className="object-contain p-0.5 mix-blend-multiply"
              />
            ) : null}
            {/* La cantidad va dentro de la casilla, no asomada por la esquina:
                la tira se desplaza en horizontal y lo que sobresalga del
                recuadro lo recorta el borde del scroll. */}
            <span
              aria-hidden
              className="absolute bottom-0 right-0 grid h-4 min-w-4 place-items-center bg-amarillo px-0.5 font-mono text-[9px] font-bold leading-none tabular-nums text-tinta"
            >
              {linea.cantidad}
            </span>
          </button>
        </li>
      ))}
      {ocultas > 0 ? (
        <li className="grid size-10 shrink-0 place-items-center border border-white/25 font-mono text-[11px] font-bold tabular-nums text-white/70">
          +{ocultas}
        </li>
      ) : null}
    </ol>
  );
}

/**
 * Lo que lleva el kit en el panel de escritorio, renglón por renglón.
 *
 * Acá había una casilla por unidad: doce sachets del mismo sabor eran doce
 * miniaturas repetidas que no decían ni qué sabor era ni cuánto costaba esa
 * línea, y al no caber en la columna se la ensanchaban al catálogo. Un
 * renglón por producto y sabor dice las tres cosas y no crece con la
 * cantidad, que es lo que sí crece de verdad.
 */
function ListaDelKit({
  lineas,
  onQuitar,
}: {
  lineas: LineaKit[];
  onQuitar: (variantId: string) => void;
}) {
  if (lineas.length === 0) {
    return (
      <p className="mx-5 mt-4 border border-dashed border-white/25 px-4 py-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-white/50">
        Tu kit está vacío
        <br />
        Mínimo {MINIMO_UNIDADES} unidades para despachar
      </p>
    );
  }

  return (
    <ul className="mt-3 max-h-64 overflow-y-auto px-5">
      {lineas.map((linea) => (
        <li
          key={linea.variantId}
          className="flex items-center gap-2 border-b border-white/10 py-2.5 last:border-b-0"
        >
          {/* El renglón entero lleva a su tarjeta: la cantidad se cambia allá,
              con el mismo selector de todas las unidades, y así el panel no
              tiene dos maneras distintas de contar lo mismo. */}
          <button
            type="button"
            onClick={() => irALaUnidad(linea.handle)}
            className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
          >
            <span className="relative block size-10 shrink-0 bg-white/95">
              {linea.image !== null ? (
                <Image
                  src={linea.image}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-contain p-0.5 mix-blend-multiply"
                />
              ) : null}
              <span
                aria-hidden
                className="absolute bottom-0 right-0 grid h-5 min-w-5 place-items-center bg-amarillo px-1 font-mono text-[10px] font-bold leading-none tabular-nums text-tinta"
              >
                {linea.cantidad}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-[13px] font-semibold leading-tight">
                {linea.titulo}
              </span>
              <span className="mt-1 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
                {linea.sabor !== null ? `${linea.sabor} · ` : ""}
                {linea.cantidad} u
              </span>
            </span>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums">
              {formatCOP(linea.precio * linea.cantidad)}
            </span>
          </button>
          {/* Bajar de doce a cero con el selector son doce clics; acá la línea
              entera se va de una. */}
          <button
            type="button"
            onClick={() => onQuitar(linea.variantId)}
            aria-label={`Quitar ${linea.titulo}${
              linea.sabor !== null ? ` ${linea.sabor}` : ""
            } del kit`}
            className="grid size-7 shrink-0 place-items-center text-white/40 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
          >
            <XIcon className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
