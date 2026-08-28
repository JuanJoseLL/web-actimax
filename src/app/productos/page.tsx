import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { FilterChip } from "@/components/FilterChip";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEPORTE_LABELS,
  MOMENTO_LABELS,
  TYPE_LABELS,
  getAllProducts,
  isMomento,
  isProductType,
} from "@/lib/catalog";
import { categoriaPorTipo } from "@/data/categorias";
import { deportePorSlug, type Landing } from "@/data/deportes";
import { itemListJsonLd, jsonLd, pageMetadata } from "@/lib/seo";
import type { Momento, Product, ProductType } from "@/lib/taxonomia";

interface Filters {
  tipo?: ProductType;
  momento?: Momento;
  deporte?: string;
}

type SearchParams = Promise<{ tipo?: string; momento?: string; deporte?: string }>;

/** Ignora valores fuera de la taxonomía: /productos/?tipo=basura ≡ /productos/. */
async function resolveFilters(searchParams: SearchParams): Promise<Filters> {
  const params = await searchParams;
  return {
    tipo: params.tipo !== undefined && isProductType(params.tipo) ? params.tipo : undefined,
    momento:
      params.momento !== undefined && isMomento(params.momento) ? params.momento : undefined,
    deporte:
      params.deporte !== undefined && params.deporte in DEPORTE_LABELS
        ? params.deporte
        : undefined,
  };
}

function filterUrl(current: Filters, patch: Partial<Filters>): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.tipo !== undefined) params.set("tipo", next.tipo);
  if (next.momento !== undefined) params.set("momento", next.momento);
  if (next.deporte !== undefined) params.set("deporte", next.deporte);
  const qs = params.toString();
  return qs === "" ? "/productos/" : `/productos/?${qs}`;
}

/* Las landings viejas de categoría y de ciudad (bebidas-isotonicas-bogota,
   …) redirigen a estas vistas filtradas; cada una necesita canonical, título
   y descripción propios para no consolidarse todas en /productos/ y perder
   lo que rankeaban. Cuando el tipo o el deporte tiene landing propia
   (src/data/categorias.ts, src/data/deportes.ts), la vista filtrada por ese
   único criterio declara la landing como canónica: es la misma grilla con el
   texto que posiciona. */

/** La landing que equivale a la vista filtrada, si el único filtro la tiene. */
function landingDe({ tipo, momento, deporte }: Filters): Landing | undefined {
  if (momento !== undefined) return undefined;
  if (tipo !== undefined && deporte === undefined) return categoriaPorTipo(tipo);
  if (deporte !== undefined && tipo === undefined) return deportePorSlug(deporte);
  return undefined;
}
const TYPE_DESCRIPTIONS: Record<ProductType, string> = {
  geles:
    "Geles energéticos colombianos con y sin cafeína para running, ciclismo y triatlón. Compra en línea con envíos a Bogotá, Medellín, Cali y toda Colombia.",
  bebidas:
    "Bebidas deportivas e isotónicas de hidratación, pre-entreno y recuperación hechas en Colombia. Envíos a Bogotá, Medellín, Cali, Barranquilla y todo el país.",
  barras:
    "Barras de proteína para recuperar después del ejercicio, hechas en Colombia. Compra en línea con envíos a todo el país.",
  kits: "Energy Packs armados por distancia: 10K, 15K, 21K, 42K, Gran Fondo y triatlón. Nutrición deportiva colombiana con envíos a todo el país.",
};

const CATALOG_PRIORITY = new Map(
  [
    "energy-pack-de-10k",
    "energy-pack-15k",
    "energy-pack-media-maraton-21k",
  ].map((handle, index) => [handle, index]),
);

function catalogOrder(a: Product, b: Product): number {
  if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;

  const priorityA = CATALOG_PRIORITY.get(a.handle) ?? Number.POSITIVE_INFINITY;
  const priorityB = CATALOG_PRIORITY.get(b.handle) ?? Number.POSITIVE_INFINITY;
  if (priorityA !== priorityB) return priorityA - priorityB;

  return a.price - b.price || a.title.localeCompare(b.title, "es");
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const filters = await resolveFilters(searchParams);
  const { tipo, momento, deporte } = filters;

  if (tipo === undefined && momento === undefined && deporte === undefined) {
    return pageMetadata({
      title: "Geles energéticos, bebidas y barras — Catálogo Actimax",
      description:
        "Catálogo de nutrición deportiva colombiana: geles energéticos con y sin cafeína, bebidas de hidratación y recuperación, barras de proteína y Energy Packs por distancia. Envíos a toda Colombia.",
      path: "/productos/",
    });
  }

  const head = tipo !== undefined ? TYPE_LABELS[tipo] : "Nutrición deportiva";
  const momentoPart =
    momento !== undefined ? ` para ${MOMENTO_LABELS[momento].toLowerCase()} del esfuerzo` : "";
  const deportePart =
    deporte !== undefined
      ? momento !== undefined
        ? ` · ${DEPORTE_LABELS[deporte]}`
        : ` para ${DEPORTE_LABELS[deporte].toLowerCase()}`
      : "";

  const title = `${head}${momentoPart}${deportePart} — Catálogo Actimax`;
  const soloTipo = tipo !== undefined && momento === undefined && deporte === undefined;
  const description = soloTipo
    ? TYPE_DESCRIPTIONS[tipo]
    : `${head}${momentoPart}${deportePart} de Actimax: nutrición deportiva hecha en Colombia, con envíos a todo el país.`;
  const landing = landingDe(filters);

  return pageMetadata({ title, description, path: landing?.path ?? filterUrl(filters, {}) });
}

/** La faceta que aplica un chip: `tipo=geles`, `momento=todos`, … */
function facetLabel(patch: Partial<Filters>): string {
  const [key, value] = Object.entries(patch)[0] ?? ["", undefined];
  return `${key}=${value ?? "todos"}`;
}

/** El estado del catálogo al que lleva el chip, sin la parte de la ruta. */
function combinationLabel(current: Filters, patch: Partial<Filters>): string {
  return filterUrl(current, patch).split("?")[1] ?? "sin-filtros";
}

function Chip({
  current,
  patch,
  active,
  children,
}: {
  current: Filters;
  patch: Partial<Filters>;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <FilterChip
      href={filterUrl(current, patch)}
      active={active}
      filtro={facetLabel(patch)}
      combinacion={combinationLabel(current, patch)}
    >
      {children}
    </FilterChip>
  );
}

export default function ProductosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div
      data-catalog-page
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8"
    >
      <Suspense fallback={null}>
        <DynamicMetadataMarker />
      </Suspense>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function DynamicMetadataMarker() {
  await connection();
  return null;
}

function CatalogSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-16 w-72" />
      <div className="mt-8 flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-2">
            {[0, 1, 2, 3].map((chip) => (
              <Skeleton key={chip} className="h-8 w-28 rounded-sm" />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-square" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-6 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function CatalogContent({ searchParams }: { searchParams: SearchParams }) {
  const current = await resolveFilters(searchParams);
  const { tipo, momento, deporte } = current;

  const products = await getAllProducts();
  const filtered = products
    .filter(
      (p) =>
        (tipo === undefined || p.type === tipo) &&
        (momento === undefined || p.momentos.includes(momento)) &&
        (deporte === undefined || p.deportes.includes(deporte)),
    )
    .toSorted(catalogOrder);

  const hasFilters = tipo !== undefined || momento !== undefined || deporte !== undefined;
  const landing = landingDe(current);

  /* La lista estructurada debe describir lo que se ve: con filtros activos
     anunciar el catálogo entero le declara a los buscadores una página que
     no existe. Sin resultados no se emite nada. */
  const activeLabels = [
    tipo !== undefined ? TYPE_LABELS[tipo] : null,
    momento !== undefined ? MOMENTO_LABELS[momento] : null,
    deporte !== undefined ? DEPORTE_LABELS[deporte] : null,
  ].filter((label): label is string => label !== null);
  const listName =
    activeLabels.length === 0
      ? "Catálogo Actimax de nutrición deportiva"
      : `Actimax · ${activeLabels.join(" · ")}`;

  return (
    <>
      {filtered.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(itemListJsonLd(listName, filtered)) }}
        />
      ) : null}
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Catálogo
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-7xl">
        {tipo !== undefined ? TYPE_LABELS[tipo] : "Productos"}
      </h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-tinta/50">
        {filtered.length === 1 ? "1 producto" : `${filtered.length} productos`}
        {momento !== undefined ? ` · para ${MOMENTO_LABELS[momento].toLowerCase()} del esfuerzo` : ""}
        {deporte !== undefined ? ` · ${DEPORTE_LABELS[deporte]}` : ""}
      </p>
      {landing !== undefined ? (
        <p className="mt-3 text-sm text-tinta/70">
          Cuándo, cuánto y preguntas frecuentes:{" "}
          <Link
            href={landing.path}
            className="font-semibold text-azul underline-offset-4 hover:underline"
          >
            guía de {landing.nombre.toLocaleLowerCase("es-CO")} →
          </Link>
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-tinta/55 sm:w-20">
            Tipo
          </span>
          <Chip current={current} patch={{ tipo: undefined }} active={tipo === undefined}>
            Todos
          </Chip>
          {(Object.keys(TYPE_LABELS) as Array<keyof typeof TYPE_LABELS>).map((t) => (
            <Chip key={t} current={current} patch={{ tipo: t }} active={tipo === t}>
              {TYPE_LABELS[t]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-tinta/55 sm:w-20">
            Momento
          </span>
          <Chip current={current} patch={{ momento: undefined }} active={momento === undefined}>
            Todos
          </Chip>
          {(Object.keys(MOMENTO_LABELS) as Array<keyof typeof MOMENTO_LABELS>).map((m) => (
            <Chip key={m} current={current} patch={{ momento: m }} active={momento === m}>
              {MOMENTO_LABELS[m]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-tinta/55 sm:w-20">
            Deporte
          </span>
          <Chip current={current} patch={{ deporte: undefined }} active={deporte === undefined}>
            Todos
          </Chip>
          {Object.entries(DEPORTE_LABELS).map(([slug, label]) => (
            <Chip key={slug} current={current} patch={{ deporte: slug }} active={deporte === slug}>
              {label}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-xl bg-muted px-6 py-16 text-center">
          <p className="font-display text-3xl font-bold uppercase italic text-muted-foreground">
            No hay productos con esa combinación
          </p>
          <Button asChild variant="race" size="lg" className="mt-6">
            <Link href="/productos/">Quitar filtros</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.handle} product={product} />
          ))}
        </div>
      )}

      {hasFilters && filtered.length > 0 ? (
        <div className="mt-12 text-center">
          <Link
            href="/productos/"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-azul underline-offset-4 hover:underline"
          >
            Quitar filtros y ver todo →
          </Link>
        </div>
      ) : null}
    </>
  );
}
