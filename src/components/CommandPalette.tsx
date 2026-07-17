"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeftIcon,
  CookieIcon,
  CupSodaIcon,
  MedalIcon,
  NewspaperIcon,
  PackageIcon,
  PlusIcon,
  RouteIcon,
  ShoppingCartIcon,
  TimerIcon,
  ZapIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { formatCOP } from "@/lib/format";
import {
  DEPORTE_LABELS,
  MOMENTO_LABELS,
  typeLabel,
  type Momento,
  type ProductType,
} from "@/lib/taxonomia";
import { useIsMac } from "@/lib/useIsMac";

/** Datos mínimos de un producto para buscarlo desde la paleta. */
export interface PaletteProduct {
  variantId: string | null;
  handle: string;
  title: string;
  type: ProductType | null;
  momentos: Momento[];
  deportes: string[];
  price: number;
  image: string | null;
}

const OPEN_EVENT = "actimax-palette-open";

/** Abre la Torre de Control desde cualquier componente cliente. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Prefijo de cantidad al estilo power user: "3x gel" busca "gel" con
 * cantidad 3. Exige la "x" para no confundirse con distancias ("21k").
 */
function parseQuery(query: string): { qty: number; term: string } {
  const match = query.match(/^\s*(\d{1,3})\s*[x×]\s*(.*)$/i);
  if (match !== null) {
    return { qty: Math.max(1, Number(match[1])), term: match[2] };
  }
  return { qty: 1, term: query };
}

/** Sin tildes ni mayúsculas: "cafeina" debe encontrar "cafeína". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const RUTAS = [
  { label: "Geles energéticos", href: "/productos?tipo=geles", icon: ZapIcon },
  {
    label: "Bebidas deportivas",
    href: "/productos?tipo=bebidas",
    icon: CupSodaIcon,
  },
  {
    label: "Barras de proteína",
    href: "/productos?tipo=barras",
    icon: CookieIcon,
  },
  { label: "Energy Packs", href: "/productos?tipo=kits", icon: PackageIcon },
  {
    label: "Comparar kits",
    href: "/productos/comparar",
    icon: ArrowRightLeftIcon,
  },
  { label: "Consejos del equipo", href: "/blog", icon: NewspaperIcon },
] as const;

const MOMENTOS = [
  { momento: "antes", label: "Antes · Largada", icon: TimerIcon },
  { momento: "durante", label: "Durante · En ruta", icon: RouteIcon },
  { momento: "despues", label: "Después · Meta", icon: MedalIcon },
] as const;

const GROUP_STYLE =
  "**:[[cmdk-group-heading]]:font-mono **:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-bold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[0.2em]";

export function CommandPalette({ products }: { products: PaletteProduct[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { add, open: openCart } = useCart();
  const isMac = useIsMac();

  const { qty } = parseQuery(query);
  const byHandle = useMemo(
    () => new Map(products.map((p) => [p.handle, p])),
    [products],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const onOpenEvent = () => setIsOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, []);

  const run = useCallback((action: () => void) => {
    setIsOpen(false);
    action();
  }, []);

  /* El término puede llevar prefijo de cantidad y venir con o sin tildes;
     todas las palabras deben aparecer en el valor o las keywords. */
  const filter = useCallback(
    (value: string, search: string, keywords?: string[]) => {
      const tokens = normalize(parseQuery(search).term).split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return 1;
      const haystack = normalize([value, ...(keywords ?? [])].join(" "));
      return tokens.every((t) => haystack.includes(t)) ? 1 : 0;
    },
    [],
  );

  const addToCart = useCallback(
    (product: PaletteProduct, quantity: number) => {
      add(product, quantity);
      toast.success(product.title, {
        description: `${quantity} × ${formatCOP(product.price)} · en tu carrito`,
        action: {
          label: "Ver carrito",
          onClick: () => {
            setIsOpen(false);
            openCart();
          },
        },
      });
    },
    [add, openCart],
  );

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      title="Torre de control"
      description="Busca productos o navega la tienda"
      className="top-[18%] sm:top-1/4"
    >
      <div
        aria-hidden
        className="h-[3px] shrink-0 bg-[linear-gradient(90deg,#002f87_0%,#0a50d0_62%,#ffd23c_100%)]"
      />
      {/* CommandDialog no incluye el root de cmdk: sin <Command> el input
          y la lista quedan sin contexto y la página se cae al abrir. */}
      <Command
        filter={filter}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            /* Selección leída del DOM al momento de la tecla: el estado
               controlado de cmdk queda obsoleto al cambiar el filtro. */
            const handle = e.currentTarget
              .querySelector('[cmdk-item][aria-selected="true"]')
              ?.getAttribute("data-value");
            const product = handle != null ? byHandle.get(handle) : undefined;
            if (product !== undefined) {
              e.preventDefault();
              addToCart(product, qty);
            }
          }
        }}
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Busca geles, kits, 21K… (3x gel = cantidad)"
        />
        <CommandList className="max-h-80">
          <CommandEmpty>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Sin resultados en la ruta
            </span>
          </CommandEmpty>

          <CommandGroup heading="Productos" className={GROUP_STYLE}>
            {products.map((product) => (
              <CommandItem
                key={product.handle}
                value={product.handle}
                keywords={[
                  product.title,
                  typeLabel(product.type),
                  ...product.momentos.map((m) => MOMENTO_LABELS[m]),
                  ...product.deportes.map((d) => DEPORTE_LABELS[d] ?? d),
                ]}
                onSelect={() =>
                  run(() => router.push(`/productos/${product.handle}`))
                }
              >
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-sm bg-muted">
                  {product.image !== null ? (
                    <Image
                      src={product.image}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-contain p-0.5 mix-blend-multiply"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {product.title}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {typeLabel(product.type)}
                  </span>
                </span>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCOP(product.price)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addToCart(product, qty);
                  }}
                  aria-label={`Agregar ${product.title} al carrito`}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-border text-muted-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Momentos" className={GROUP_STYLE}>
            {MOMENTOS.map(({ momento, label, icon: Icon }) => (
              <CommandItem
                key={momento}
                value={label}
                onSelect={() =>
                  run(() => router.push(`/productos?momento=${momento}`))
                }
              >
                <Icon className="text-muted-foreground" />
                <span>{label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Rutas" className={GROUP_STYLE}>
            {RUTAS.map(({ label, href, icon: Icon }) => (
              <CommandItem
                key={href}
                value={label}
                onSelect={() => run(() => router.push(href))}
              >
                <Icon className="text-muted-foreground" />
                <span>{label}</span>
              </CommandItem>
            ))}
            <CommandItem value="Abrir carrito" onSelect={() => run(openCart)}>
              <ShoppingCartIcon className="text-muted-foreground" />
              <span>Abrir carrito</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>

      {qty > 1 ? (
        <div className="flex items-center gap-2 border-t border-border bg-amarillo/15 px-3 py-1.5">
          <span className="rounded-sm bg-amarillo px-1.5 font-mono text-[11px] font-bold tabular-nums text-tinta">
            ×{qty}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-tinta/70">
            {isMac ? "⌘" : "Ctrl"}+↵ agrega {qty} unidades al carrito
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amarillo" />
          Torre de control
        </span>
        <span className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> moverte
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> ir
          </span>
          <span className="flex items-center gap-1">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>↵</Kbd> al carrito
          </span>
        </span>
      </div>
    </CommandDialog>
  );
}
