"use client";

import Image from "next/image";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowRightIcon, CheckIcon, LoaderCircleIcon, RotateCcwIcon, SendIcon, ShoppingBagIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import type { MensajeAsesor, RecomendacionAsesor, ResultadoAsesor } from "@/lib/asesor/contrato";
import { cartLineId } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { track } from "@/lib/track";

const EJEMPLOS = [
  "Entreno 3 días por semana, ¿qué me recomiendas?",
  "Voy a correr una maratón, ¿qué debería llevar?",
  "Busco energía para mis salidas en bici, sin cafeína.",
];

/* La selección es un recorrido: se lee en el orden en que se consume, no en
   el que responde el modelo. */
const MOMENTOS = ["antes", "durante", "despues"] as const;
const ETIQUETA_MOMENTO = { antes: "Antes", durante: "Durante", despues: "Después" } as const;

const transport = new DefaultChatTransport<MensajeAsesor>({
  api: "/api/asesor/",
  prepareSendMessagesRequest: ({ messages }) => ({
    body: {
      messages: messages.map((message) => ({
        role: message.role,
        parts: message.parts.flatMap((part) => {
          if (part.type === "text") return [part];
          // Contexto para «cambia ese sabor». El servidor lo trata como texto
          // no confiable y vuelve a consultar todos los productos.
          if (part.type === "data-recomendacion") return [{ type: "text" as const, text: `Selección anterior: ${part.data.recomendaciones.map((item) => `${item.producto.title}, ${item.variante.title}, ${item.cantidad} envase(s)`).join("; ")}` }];
          return [];
        }),
      })),
    },
  }),
  fetch: async (input, init) => {
    const response = await fetch(input, init);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(typeof body?.error === "string" ? body.error : "No pudimos conectar con el asesor. Intenta de nuevo.");
    }
    return response;
  },
});

/** El servidor vuelve a comprobar sabor y precio antes de tocar el carrito. */
async function comprobarSeleccion(items: readonly RecomendacionAsesor[]): Promise<Array<{ line: CartLine; cantidad: number }>> {
  const response = await fetch("/api/asesor/carrito/", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: items.map((item) => ({
        handle: item.producto.handle, variantId: item.variante.id,
        cantidad: item.cantidad, precioEsperado: item.variante.price,
      })),
    }),
  });
  const data = await response.json() as { items?: Array<{ line: CartLine; cantidad: number }>; error?: string };
  if (!response.ok || !data.items?.length) throw new Error(data.error ?? "No pudimos comprobar los productos.");
  return data.items;
}

/** Los valores nutricionales en una línea: la tabla completa vive en la ficha
 *  y aquí competiría con el motivo de la recomendación. Se omite lo que el
 *  catálogo no declara; el cero de cafeína sí se dice, porque a quien la
 *  evita le responde la pregunta que venía a hacer. */
function DatosPorcion({ item }: { item: RecomendacionAsesor }) {
  const { nutrientes } = item.variante.nutricion;
  const declarados = ([
    [nutrientes.carbohidratosG, "g carbohidratos"],
    [nutrientes.proteinaG, "g proteína"],
    [nutrientes.sodioMg, "mg sodio"],
  ] as const).flatMap(([valor, unidad]) => (
    valor === null || valor === 0 ? [] : [`${valor.toLocaleString("es-CO")} ${unidad}`]
  ));
  if (nutrientes.cafeinaMg !== null) {
    declarados.push(nutrientes.cafeinaMg === 0 ? "sin cafeína" : `${nutrientes.cafeinaMg.toLocaleString("es-CO")} mg cafeína`);
  }
  if (!declarados.length) return null;
  return (
    <p className="mt-2 font-mono text-[11px] leading-relaxed text-tinta/60">
      {[item.variante.nutricion.base, ...declarados].join(" · ")}
    </p>
  );
}

/**
 * Artefacto de la conversación: la selección aparece dentro del turno que la
 * produjo, no en una sección aparte, para que se lea sin salir del chat.
 * Los momentos van sobre la línea de ruta —la firma del sitio— porque antes,
 * durante y después sí son una secuencia real de consumo.
 */
function SeleccionAsesor({ resultado, vigente }: { resultado: ResultadoAsesor; vigente: boolean }) {
  const { add, items: enCarrito, open } = useCart();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = [...resultado.recomendaciones].sort(
    (a, b) => MOMENTOS.indexOf(a.momento) - MOMENTOS.indexOf(b.momento),
  );

  async function agregar(seleccion: readonly RecomendacionAsesor[], clave: string) {
    setCargando(clave);
    setError(null);
    try {
      const lineas = await comprobarSeleccion(seleccion);
      for (const { line, cantidad } of lineas) {
        add(line, cantidad);
        track("agregar_al_carrito", { producto: line.handle, origen: "asesor" });
      }
      if (clave === "todo") {
        open();
        return;
      }
      const [{ line, cantidad }] = lineas;
      const total = (enCarrito.find((item) => cartLineId(item) === cartLineId(line))?.qty ?? 0) + cantidad;
      toast.success(line.title, {
        id: `cart-${cartLineId(line)}`,
        description: `${total} × ${formatCOP(line.price)} · en tu carrito`,
        action: { label: "Ver carrito", onClick: open },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Intenta de nuevo.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <section
      aria-label={vigente ? "Selección del asesor" : "Selección anterior del asesor"}
      className="asesor-artefacto mt-4 max-w-3xl overflow-hidden rounded-sm border border-tinta/12 bg-white shadow-[0_10px_32px_rgba(10,17,40,0.08)]"
    >
      <div className="flex items-center justify-between gap-3 bg-tinta px-4 py-2.5 text-white">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
          {vigente ? "Tu selección" : "Selección anterior"}
        </p>
        <p className="font-mono text-[11px] font-bold tabular-nums text-amarillo">
          {items.length} {items.length === 1 ? "producto" : "productos"} · {formatCOP(resultado.total)}
        </p>
      </div>

      <ol className="px-4 py-4 sm:px-5 sm:py-5">
        {items.map((item, index) => {
          /* El carrito manda: si se quita desde el cajón, vuelve a ofrecerse. */
          const agregado = enCarrito.some((linea) => cartLineId(linea) === cartLineId({ variantId: item.variante.id, handle: item.producto.handle }));
          return (
            <li key={item.variante.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2 pb-5 last:pb-0">
              <div aria-hidden className="relative flex justify-center">
                <span className="mt-1 size-2.5 shrink-0 rounded-full border-2 border-amarillo bg-white" />
                {index < items.length - 1 ? (
                  <span className="absolute bottom-0 left-1/2 top-4 -translate-x-1/2 border-l border-dashed border-tinta/25" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-azul">
                  {ETIQUETA_MOMENTO[item.momento]}
                </p>
                <div className="mt-2 flex items-start gap-3">
                  {item.variante.image ? (
                    <Image src={item.variante.image} alt="" width={64} height={64} className="size-14 shrink-0 object-contain sm:size-16" />
                  ) : null}
                  <div className="min-w-0">
                    <Link href={item.producto.path} className="font-display text-lg font-bold uppercase leading-[1.05] hover:text-azul sm:text-xl">
                      {item.producto.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.variante.title} · {item.producto.envase}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{item.motivo}</p>
                <DatosPorcion item={item} />
                <details className="mt-2 text-xs leading-relaxed">
                  <summary className="cursor-pointer py-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-azul">
                    Cómo se toma
                  </summary>
                  <p className="mt-1">{item.variante.nutricion.uso}</p>
                  {item.variante.nutricion.preparacion ? <p className="mt-2">{item.variante.nutricion.preparacion}</p> : null}
                  <p className="mt-2">{item.producto.porcionesCompletas} porciones completas por envase.</p>
                  {item.variante.nutricion.notas.map((nota) => <p key={nota} className="mt-2 text-muted-foreground">{nota}</p>)}
                  <p className="mt-2 text-muted-foreground">Fuente: catálogo Actimax 2026.</p>
                </details>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-base font-bold leading-none tabular-nums">{formatCOP(item.subtotal)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.cantidad} {item.cantidad === 1 ? "envase" : "envases"} × {formatCOP(item.variante.price)}
                      {item.porcionesNecesarias !== null ? ` · ${item.porcionesNecesarias} porciones` : ""}
                    </p>
                  </div>
                  <Button
                    type="button" variant={agregado ? "raceSun" : "race"} size="sm"
                    className="h-11 shrink-0 px-4 font-mono text-xs"
                    disabled={cargando !== null}
                    onClick={() => void agregar([item], item.producto.handle)}
                  >
                    {cargando === item.producto.handle ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
                      : agregado ? <CheckIcon data-icon="inline-start" /> : <ShoppingBagIcon data-icon="inline-start" />}
                    {agregado ? "Agregado" : "Agregar"}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-tinta/10 bg-niebla/70 p-4 sm:px-5">
        {items.length > 1 ? (
          <Button
            type="button" variant="race" className="h-12 w-full text-base"
            disabled={cargando !== null}
            onClick={() => void agregar(items, "todo")}
          >
            {cargando === "todo" ? <LoaderCircleIcon className="animate-spin" data-icon="inline-start" /> : <ShoppingBagIcon data-icon="inline-start" />}
            Agregar los {items.length} · {formatCOP(resultado.total)}
          </Button>
        ) : null}
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Comprobamos precio y sabor al agregar. El envío se calcula en el checkout.
        </p>
        {error ? <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p> : null}
      </div>
      <div aria-hidden className="finish-line text-tinta/12" />
    </section>
  );
}

export function AsesorActimax() {
  const [input, setInput] = useState("");
  const [estado, setEstado] = useState("Preparando tu consulta…");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, error, stop, setMessages, clearError, regenerate } = useChat<MensajeAsesor>({
    transport,
    onData: (part) => {
      if (part.type === "data-estado") setEstado(part.data);
    },
  });
  const busy = status === "submitted" || status === "streaming";
  const ultimoAsistente = messages.findLast((message) => message.role === "assistant")?.id;
  const maxTurns = messages.length >= 24;

  /* Mientras llega la respuesta se sigue el final del texto; al terminar, el
     turno se ancla arriba para que la selección quede a la vista sin buscarla. */
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !messages.length) return;
    if (busy || !ultimoAsistente) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    const turno = container.querySelector<HTMLElement>(`[data-turno="${CSS.escape(ultimoAsistente)}"]`);
    if (!turno) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    container.scrollTo({ top: turno.offsetTop - 12, behavior: suave ? "smooth" : "auto" });
  }, [messages, estado, busy, ultimoAsistente]);

  /* El campo crece con el texto y vuelve a una línea al enviarlo. Va en un
     efecto porque al enviar se limpia el valor en el mismo evento: medirlo
     antes del repintado devolvía el alto del mensaje que ya se fue. */
  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, [input]);

  function reiniciar() {
    setMessages([]);
    clearError();
    setInput("");
    inputRef.current?.focus();
  }

  function enviar(text: string) {
    if (!text.trim() || busy || maxTurns) return;
    clearError();
    setEstado("Preparando tu consulta…");
    setInput("");
    track("consulta_asesor", { origen: "mi-plan" });
    void sendMessage({ text: text.trim() });
  }

  return (
    <section aria-labelledby="titulo-asesor" className="flex min-h-0 flex-1 flex-col bg-white pt-3 md:bg-niebla md:px-6 md:pb-6 md:pt-8">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        {/* En el teléfono esto es la barra de la vista —título y reinicio en
            una fila— para que la pantalla se la quede la conversación. En
            escritorio vuelve a ser la portada de la sección. */}
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-tinta/10 px-4 pb-3 md:mb-6 md:grid md:grid-cols-[1fr_0.72fr] md:items-end md:gap-6 md:border-0 md:px-0 md:pb-0">
          <div className="min-w-0">
            <p className="hidden font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-azul md:block">Mi Plan Actimax · Asesor de productos</p>
            <h1 id="titulo-asesor" className="font-display text-xl font-extrabold uppercase italic leading-[0.95] text-tinta md:mt-2 md:text-5xl md:leading-[0.92] lg:text-6xl xl:text-7xl">
              Tu próxima meta. <span className="text-azul md:block">Tu combustible.</span>
            </h1>
          </div>
          <p className="hidden max-w-md text-sm leading-relaxed text-tinta/70 md:block">
            Cuéntanos qué entrenas y qué quieres lograr. Encontraremos los productos Actimax que encajan contigo, antes, durante y después.
          </p>
          <Button variant="ghost" size="icon" aria-label="Empezar de nuevo" className="size-9 shrink-0 md:hidden" disabled={busy || messages.length === 0} onClick={reiniciar}>
            <RotateCcwIcon />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white md:rounded-sm md:border md:border-tinta/10 md:shadow-sm">
          <div className="hidden shrink-0 items-center justify-between gap-3 border-b border-tinta/10 px-5 py-4 md:flex">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className="size-2 rounded-full bg-azul" /> Asesor Actimax
            </p>
            <Button variant="ghost" aria-label="Empezar de nuevo" className="h-9 px-3" disabled={busy || messages.length === 0} onClick={reiniciar}>
              <RotateCcwIcon /> Empezar de nuevo
            </Button>
          </div>

          <div ref={scrollRef} role="log" aria-label="Conversación con el asesor" aria-live="polite" className="relative min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 md:p-6">
            {messages.length === 0 ? (
              <div className="max-w-2xl">
                <p className="font-display text-2xl font-bold uppercase md:text-3xl">Cada rutina tiene su ritmo.</p>
                <p className="mt-2 text-sm text-muted-foreground">¿Cómo es la tuya? Puedes empezar por aquí:</p>
                <div className="mt-4 grid gap-2">
                  {EJEMPLOS.map((text) => (
                    <button key={text} type="button" onClick={() => enviar(text)} className="flex min-h-12 items-center justify-between gap-3 rounded-sm border border-azul/15 px-4 py-3 text-left text-sm transition-colors hover:border-azul hover:bg-azul/5 focus-visible:outline-2 focus-visible:outline-azul">
                      {text}<ArrowRightIcon className="size-4 shrink-0 text-azul" />
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-muted-foreground">Recomendamos solo sobre el catálogo Actimax, con la tabla nutricional de cada producto.</p>
              </div>
            ) : messages.map((message) => {
              const texto = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
              const seleccion = message.parts.find((part) => part.type === "data-recomendacion");
              if (!texto && !seleccion) return null;
              return (
                <div key={message.id} data-turno={message.id} className={message.role === "user" ? "ml-auto max-w-2xl rounded-sm bg-azul px-4 py-3 text-white" : "max-w-3xl"}>
                  <p className={`mb-1 font-mono text-[9px] font-bold uppercase tracking-widest ${message.role === "user" ? "text-white/60" : "text-azul"}`}>{message.role === "user" ? "Tú" : "Actimax"}</p>
                  {texto ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{texto}</p> : null}
                  {seleccion?.type === "data-recomendacion" ? (
                    <SeleccionAsesor resultado={seleccion.data} vigente={message.id === ultimoAsistente} />
                  ) : null}
                </div>
              );
            })}
            {busy ? <p role="status" className="flex items-center gap-2 text-sm text-azul"><LoaderCircleIcon className="size-4 animate-spin" />{estado}</p> : null}
          </div>

          {error ? (
            <div role="alert" className="mx-4 mb-3 shrink-0 rounded-sm bg-amber-50 p-3 text-sm text-tinta md:mx-5">
              <p>{error.message}</p>
              <button type="button" className="mt-2 font-semibold text-azul underline" onClick={() => { clearError(); void regenerate(); }}>Reintentar</button>
            </div>
          ) : null}

          <form className="shrink-0 border-t border-tinta/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4" onSubmit={(event) => { event.preventDefault(); enviar(input); }}>
            <label htmlFor="mensaje-asesor" className="sr-only">Cuéntanos sobre tu entrenamiento</label>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef} id="mensaje-asesor" value={input} maxLength={2000} rows={1} disabled={maxTurns}
                placeholder="Ej.: corro 90 minutos, 3 veces por semana…"
                className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-sm border border-tinta/20 px-3 py-3 text-base leading-tight outline-none focus:border-azul focus:ring-1 focus:ring-azul"
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); enviar(input); }
                }}
              />
              {busy
                ? <Button type="button" variant="outline" className="size-11 shrink-0" aria-label="Detener respuesta" onClick={() => void stop()}><SquareIcon /></Button>
                : <Button type="submit" variant="race" className="size-11 shrink-0" aria-label="Enviar mensaje" disabled={!input.trim() || maxTurns}><SendIcon /></Button>}
            </div>
            {maxTurns ? <p className="mt-2 text-[11px] text-muted-foreground">Empieza una conversación nueva para seguir consultando.</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
