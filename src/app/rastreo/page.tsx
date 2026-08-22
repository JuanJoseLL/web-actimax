import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { RastreoGuia } from "@/components/RastreoGuia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappUrl } from "@/lib/contacto";
import {
  TRANSPORTADORAS,
  guiaLegible,
  normalizarGuia,
  rutaRastreo,
  transportadoraPorSlug,
  type Transportadora,
} from "@/lib/rastreo";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Rastrea tu pedido — Actimax",
    description:
      "Consulta dónde va tu pedido Actimax con el número de guía de tu envío.",
    path: "/rastreo/",
  }),
  // Cada visita trae la guía de un pedido concreto: no hay nada que indexar
  // y no queremos números de guía de clientes en los buscadores.
  robots: { index: false, follow: true },
};

interface RastreoSearchParams {
  guia?: string | string[];
  t?: string | string[];
}

function primerValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

export default function RastreoPage({
  searchParams,
}: {
  searchParams: Promise<RastreoSearchParams>;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-16">
      <nav aria-label="Ruta" className="mb-6 font-mono text-[11px] text-muted-foreground">
        <Link href="/" className="hover:text-primary hover:underline">
          Inicio
        </Link>
        {" / "}
        <span className="text-foreground/80">Rastreo</span>
      </nav>

      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        Tu envío
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl">
        Rastrea tu pedido
      </h1>

      <div className="mt-10">
        <Suspense fallback={<RastreoSkeleton />}>
          <RastreoContenido searchParams={searchParams} />
        </Suspense>
      </div>

      <Separator className="mt-12" />
      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        ¿La guía no aparece todavía o algo no cuadra? Las transportadoras suelen
        tardar unas horas en registrarla después de recogerla.{" "}
        <a
          href={whatsappUrl("Hola, quiero saber cómo va mi pedido.")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          Escríbenos por WhatsApp
        </a>{" "}
        y lo miramos contigo.
      </p>
    </div>
  );
}

async function RastreoContenido({
  searchParams,
}: {
  searchParams: Promise<RastreoSearchParams>;
}) {
  const parametros = await searchParams;
  const guia = normalizarGuia(primerValor(parametros.guia));
  const transportadora = transportadoraPorSlug(primerValor(parametros.t));

  if (guia === "") return <BuscadorDeGuia />;

  return (
    <div className="flex flex-col gap-6">
      {transportadora !== null && (
        <p className="text-base font-medium leading-relaxed text-muted-foreground">
          Tu envío va con{" "}
          <span className="font-semibold text-foreground">{transportadora.nombre}</span>.
        </p>
      )}

      <RastreoGuia guia={guia} legible={guiaLegible(guia)} />

      {transportadora === null ? (
        <ElegirTransportadora guia={guia} />
      ) : (
        <AccionTransportadora guia={guia} transportadora={transportadora} />
      )}
    </div>
  );
}

/**
 * Con enlace directo (Coordinadora) el botón cae en la guía. Sin él (Envía)
 * lo mejor que se puede hacer es dejar el número copiado y abrir su página
 * en otra pestaña, para que esta siga a mano al momento de pegarlo.
 */
function AccionTransportadora({
  guia,
  transportadora,
}: {
  guia: string;
  transportadora: Transportadora;
}) {
  const enlaceDirecto = transportadora.enlaceGuia?.(guia) ?? null;

  return (
    <div>
      {transportadora.instruccion !== null && (
        <ol className="mb-5 flex flex-col gap-2 text-[15px] leading-relaxed text-foreground/80">
          <li>
            <span className="font-mono text-xs font-bold text-primary">1.</span> Copia el
            número de guía.
          </li>
          <li>
            <span className="font-mono text-xs font-bold text-primary">2.</span>{" "}
            {transportadora.instruccion}
          </li>
        </ol>
      )}

      <Button asChild variant="race" size="lg">
        <a href={enlaceDirecto ?? transportadora.sitio} target="_blank" rel="noopener noreferrer">
          {enlaceDirecto !== null
            ? `Rastrear en ${transportadora.nombre}`
            : `Abrir ${transportadora.nombre}`}
          <ArrowUpRight aria-hidden />
        </a>
      </Button>
    </div>
  );
}

/**
 * Cuando en el panel prepararon el pedido con "Otra" sin escribir el nombre,
 * Shopify no guarda cuál transportadora es. Preguntarlo es mejor que mandar
 * al cliente a rastrear su guía en la transportadora equivocada.
 */
function ElegirTransportadora({ guia }: { guia: string }) {
  return (
    <div>
      <p className="mb-4 text-[15px] leading-relaxed text-foreground/80">
        ¿Con cuál transportadora salió tu pedido? Lo dice el correo de envío que
        te llegó.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {TRANSPORTADORAS.map((transportadora) => (
          <Button key={transportadora.slug} asChild variant="outline" size="lg">
            <Link href={rutaRastreo(guia, transportadora.slug)}>{transportadora.nombre}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

/** Para quien llegue a /rastreo sin guía (un marcador, por ejemplo). */
function BuscadorDeGuia() {
  return (
    <form action="/rastreo/" method="get" className="flex flex-col gap-4">
      <label htmlFor="guia" className="text-[15px] leading-relaxed text-foreground/80">
        Escribe el número de guía que viene en tu correo de envío.
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="guia"
          name="guia"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          placeholder="Ej. 034058245387"
          className="sm:flex-1"
        />
        <Button type="submit" variant="race" size="lg">
          Rastrear
        </Button>
      </div>
    </form>
  );
}

function RastreoSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-5 w-56" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-9 w-48" />
    </div>
  );
}
