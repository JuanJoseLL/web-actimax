"use client";

import Image from "next/image";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowRightIcon, LoaderCircleIcon, RotateCcwIcon, SendIcon, ShoppingBagIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import type { MensajeAsesor, RecomendacionAsesor } from "@/lib/asesor/contrato";
import { formatCOP } from "@/lib/format";
import { track } from "@/lib/track";

const EJEMPLOS = [
  "Entreno 3 días por semana, ¿qué me recomiendas?",
  "Voy a correr una maratón, ¿qué debería llevar?",
  "Busco energía para mis salidas en bici, sin cafeína.",
];

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

function TarjetaRecomendacion({ item }: { item: RecomendacionAsesor }) {
  const { add, open } = useCart();
  const [comprando, setComprando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nutricion = item.variante.nutricion;
  const valores = [
    ["Carbohidratos", nutricion.nutrientes.carbohidratosG, "g"],
    ["Proteína", nutricion.nutrientes.proteinaG, "g"],
    ["Sodio", nutricion.nutrientes.sodioMg, "mg"],
    ["Cafeína", nutricion.nutrientes.cafeinaMg, "mg"],
  ] as const;

  async function agregar() {
    setComprando(true);
    setError(null);
    try {
      const response = await fetch("/api/asesor/carrito/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: item.producto.handle, variantId: item.variante.id, cantidad: item.cantidad, precioEsperado: item.variante.price }),
      });
      const data = await response.json() as { line?: CartLine; cantidad?: number; error?: string };
      if (!response.ok || !data.line || !data.cantidad) throw new Error(data.error ?? "No pudimos comprobar el producto.");
      add(data.line, data.cantidad);
      track("agregar_al_carrito", { producto: item.producto.handle, origen: "asesor" });
      open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Intenta de nuevo.");
    } finally {
      setComprando(false);
    }
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-sm border border-tinta/10 bg-white">
      <div className="flex items-center justify-between bg-tinta px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
        <span>{item.momento === "despues" ? "Después" : item.momento}</span>
        <span className="text-amarillo">Tu selección</span>
      </div>
      <div className="flex gap-4 p-4">
        {item.variante.image ? (
          <div className="relative size-20 shrink-0">
            <Image src={item.variante.image} alt={item.producto.title} fill sizes="80px" className="object-contain" />
          </div>
        ) : null}
        <div>
          <Link href={item.producto.path} className="font-display text-xl font-bold uppercase leading-tight hover:text-azul">
            {item.producto.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{item.variante.title} · {item.producto.envase}</p>
        </div>
      </div>
      <p className="px-4 text-sm leading-relaxed">{item.motivo}</p>
      <div className="m-4 rounded-sm bg-niebla p-3">
        <p className="mb-3 text-xs font-semibold">{nutricion.base}</p>
        <dl className="grid grid-cols-2 gap-3">
          {valores.map(([label, value, unit]) => (
            <div key={label}>
              <dt className="text-[10px] text-muted-foreground">{label}</dt>
              <dd className="font-mono text-sm font-bold">{value === null ? "No declarada" : `${value.toLocaleString("es-CO")} ${unit}`}</dd>
            </div>
          ))}
        </dl>
      </div>
      <details className="mx-4 mb-4 text-xs leading-relaxed">
        <summary className="cursor-pointer font-semibold text-azul">Preparación y guía del producto</summary>
        <p className="mt-2">{nutricion.uso}</p>
        {nutricion.preparacion ? <p className="mt-2">{nutricion.preparacion}</p> : null}
        <p className="mt-2">{item.producto.porcionesCompletas} porciones completas por envase.</p>
        {nutricion.notas.map((nota) => <p key={nota} className="mt-2 text-muted-foreground">{nota}</p>)}
        <p className="mt-2 text-muted-foreground">Fuente: Catálogo Actimax 2026.</p>
      </details>
      <div className="mt-auto border-t border-tinta/10 p-4">
        <div className="mb-3 flex items-end justify-between gap-2">
          <p className="text-xs text-muted-foreground">{item.cantidad} {item.cantidad === 1 ? "envase" : "envases"} × {formatCOP(item.variante.price)}</p>
          <p className="font-mono font-bold">{formatCOP(item.subtotal)}</p>
        </div>
        {item.porcionesNecesarias !== null ? <p className="mb-3 text-xs text-muted-foreground">Compra calculada para {item.porcionesNecesarias} porciones solicitadas.</p> : null}
        <Button variant="race" className="h-11 w-full" disabled={comprando} onClick={agregar}>
          {comprando ? <LoaderCircleIcon className="animate-spin" /> : <ShoppingBagIcon />}
          {comprando ? "Comprobando…" : "Agregar al carrito"}
        </Button>
        {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
      </div>
    </article>
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
  const lastAssistant = messages.findLast((message) => message.role === "assistant");
  const recomendacion = lastAssistant?.parts.find((part) => part.type === "data-recomendacion");
  const maxTurns = messages.length >= 24;

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, estado]);

  function enviar(text: string) {
    if (!text.trim() || busy || maxTurns) return;
    clearError();
    setEstado("Preparando tu consulta…");
    setInput("");
    track("consulta_asesor", { origen: "mi-plan" });
    void sendMessage({ text: text.trim() });
  }

  return (
    <section aria-labelledby="titulo-asesor" className="bg-niebla px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 grid gap-5 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-azul">Mi Plan Actimax · Asesor de productos</p>
            <h1 id="titulo-asesor" className="mt-3 font-display text-5xl font-extrabold uppercase italic leading-[0.95] text-tinta sm:text-7xl">Tu próxima meta.<br /><span className="text-azul">Tu combustible.</span></h1>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-tinta/70">Cuéntanos qué entrenas y qué quieres lograr. Encontraremos los productos Actimax que encajan contigo, antes, durante y después.</p>
        </div>

        <div className="overflow-hidden rounded-sm border border-tinta/10 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-tinta/10 px-5 py-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><span aria-hidden className="size-2 rounded-full bg-azul" /> Asesor Actimax</p>
            <Button variant="ghost" disabled={busy || messages.length === 0} onClick={() => { setMessages([]); clearError(); setInput(""); inputRef.current?.focus(); }}>
              <RotateCcwIcon /> Empezar de nuevo
            </Button>
          </div>
          <div ref={scrollRef} role="log" aria-label="Conversación con el asesor" aria-live="polite" className="max-h-[480px] min-h-64 space-y-5 overflow-y-auto p-5 sm:p-7">
            {messages.length === 0 ? (
              <div className="max-w-2xl py-3">
                <p className="font-display text-2xl font-bold uppercase">Cada rutina tiene su ritmo.</p>
                <p className="mt-2 text-sm text-muted-foreground">¿Cómo es la tuya? Puedes empezar por aquí:</p>
                <div className="mt-5 grid gap-2">
                  {EJEMPLOS.map((text) => <button key={text} type="button" onClick={() => enviar(text)} className="flex items-center justify-between gap-3 rounded-sm border border-azul/15 px-4 py-3 text-left text-sm transition-colors hover:border-azul hover:bg-azul/5 focus-visible:outline-2 focus-visible:outline-azul">{text}<ArrowRightIcon className="size-4 shrink-0 text-azul" /></button>)}
                </div>
              </div>
            ) : messages.map((message) => {
              const text = message.parts.filter((part) => part.type === "text").map((part) => part.text).join("");
              if (!text) return null;
              return (
                <div key={message.id} className={message.role === "user" ? "ml-auto max-w-2xl rounded-sm bg-azul px-4 py-3 text-white" : "max-w-3xl"}>
                  <p className={`mb-1 font-mono text-[9px] font-bold uppercase tracking-widest ${message.role === "user" ? "text-white/60" : "text-azul"}`}>{message.role === "user" ? "Tú" : "Actimax"}</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
                </div>
              );
            })}
            {busy ? <p role="status" className="flex items-center gap-2 text-sm text-azul"><LoaderCircleIcon className="size-4 animate-spin" />{estado}</p> : null}
          </div>
          {error ? (
            <div role="alert" className="mx-5 mb-4 rounded-sm bg-amber-50 p-3 text-sm text-tinta">
              <p>{error.message}</p>
              <button type="button" className="mt-2 font-semibold text-azul underline" onClick={() => { clearError(); void regenerate(); }}>Reintentar</button>
            </div>
          ) : null}
          <form className="border-t border-tinta/10 p-4 sm:p-5" onSubmit={(event) => { event.preventDefault(); enviar(input); }}>
            <label htmlFor="mensaje-asesor" className="sr-only">Cuéntanos sobre tu entrenamiento</label>
            <div className="flex items-end gap-3">
              <textarea ref={inputRef} id="mensaje-asesor" value={input} onChange={(event) => setInput(event.target.value)} maxLength={2000} rows={2} disabled={maxTurns} placeholder="Ej.: corro 90 minutos, 3 veces por semana…" className="min-w-0 flex-1 resize-y rounded-sm border border-tinta/20 p-3 text-base outline-none focus:border-azul focus:ring-1 focus:ring-azul" onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); enviar(input); }
              }} />
              {busy ? <Button type="button" variant="outline" className="h-12 w-12" aria-label="Detener respuesta" onClick={() => void stop()}><SquareIcon /></Button> : <Button type="submit" variant="race" className="h-12 w-12" aria-label="Enviar mensaje" disabled={!input.trim() || maxTurns}><SendIcon /></Button>}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">{maxTurns ? "Empieza una conversación nueva para seguir consultando." : "Recomendaciones basadas en el catálogo Actimax. Los precios y sabores se comprueban al agregar al carrito."}</p>
          </form>
        </div>

        {recomendacion?.type === "data-recomendacion" && !busy && !error ? (
          <section aria-labelledby="seleccion-asesor" className="mt-9">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-azul">Antes · Durante · Después</p><h2 id="seleccion-asesor" className="mt-2 font-display text-3xl font-extrabold uppercase italic">Tu selección Actimax</h2></div>
              <p className="text-sm">Productos: <strong className="font-mono">{formatCOP(recomendacion.data.total)}</strong><span className="block text-xs text-muted-foreground">Envío calculado en el checkout.</span></p>
            </div>
            <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recomendacion.data.recomendaciones.map((item) => <TarjetaRecomendacion key={`${lastAssistant?.id}-${item.variante.id}`} item={item} />)}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">¿Otro sabor o un presupuesto diferente? Díselo al asesor para ajustar la selección.</p>
          </section>
        ) : null}
      </div>
    </section>
  );
}
