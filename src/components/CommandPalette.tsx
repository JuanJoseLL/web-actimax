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
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { formatCOP } from "@/lib/format";
import { scoreMatch } from "@/lib/palette-search";
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

/** Cantidad preparada con el teclado, anclada al producto que la recibió. */
interface PendingQty {
  handle: string;
  qty: number;
}

const OPEN_EVENT = "actimax-palette-open";
const MAX_QTY = 99;

/** Abre la Torre de Control desde cualquier componente cliente. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * El item activo se lee del DOM y no del estado controlado de cmdk: cmdk
 * reposiciona la selección en un layout effect al cambiar el filtro, así que
 * el atributo siempre va un paso adelante de cualquier estado en React.
 */
function selectedValue(root: HTMLElement): string | null {
  return (
    root
      .querySelector('[cmdk-item][aria-selected="true"]')
      ?.getAttribute("data-value") ?? null
  );
}

const RUTAS = [
  { label: "Crear mi Plan Actimax", href: "/mi-plan", icon: RouteIcon },
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
  const [pending, setPending] = useState<PendingQty | null>(null);
  const router = useRouter();
  const { add, items, open: openCart } = useCart();
  const isMac = useIsMac();
  const mod = isMac ? "⌘" : "Ctrl";

  const byHandle = useMemo(
    () => new Map(products.map((p) => [p.handle, p])),
    [products],
  );

  /** La cantidad vive pegada a un producto: moverse por la lista no la arrastra. */
  const qtyFor = useCallback(
    (handle: string) => (pending?.handle === handle ? pending.qty : 1),
    [pending],
  );

  /** Cada apertura arranca en limpio: sin la búsqueda ni la cantidad anteriores. */
  const setOpen = useCallback((next: boolean) => {
    if (next) {
      setQuery("");
      setPending(null);
    }
    setIsOpen(next);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      /* e.key llega en mayúscula con Shift o Bloq Mayús: sin normalizar,
         el atajo se pierde justo cuando el usuario lo teclea más rápido. */
      if (e.key.toLowerCase() !== "k") return;
      /* En captura: cmdk trae Ctrl+K como binding vim de "subir", y en Windows
         eso movía la selección mientras el diálogo se cerraba. */
      e.preventDefault();
      setOpen(!isOpen);
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener(OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener(OPEN_EVENT, onOpenEvent);
    };
  }, [isOpen, setOpen]);

  const run = useCallback(
    (action: () => void) => {
      setOpen(false);
      action();
    },
    [setOpen],
  );

  const addToCart = useCallback(
    (product: PaletteProduct, quantity: number) => {
      const total =
        (items.find((i) => i.handle === product.handle)?.qty ?? 0) + quantity;
      add(product, quantity);
      setPending(null);
      toast.success(product.title, {
        /* Un toast por producto: agregar de a uno no debe apilar avisos. */
        id: `palette-${product.handle}`,
        description: `${total} × ${formatCOP(product.price)} · en tu carrito`,
        action: {
          label: "Ver carrito",
          onClick: () => {
            setOpen(false);
            openCart();
          },
        },
      });
    },
    [add, items, openCart, setOpen],
  );

  /** ⌘↵ agrega la cantidad preparada; ⌘↑ / ⌘↓ la suben y bajan. */
  const onCommandKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.key !== "Enter" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
      }
      const value = selectedValue(e.currentTarget);
      const product = value !== null ? byHandle.get(value) : undefined;
      /* Sobre un momento o una ruta no hay nada que sumar: se deja pasar la
         tecla para que cmdk siga haciendo lo suyo (ir al primero/último). */
      if (product === undefined) return;
      e.preventDefault();

      if (e.key === "Enter") {
        addToCart(product, qtyFor(product.handle));
        return;
      }
      const next = qtyFor(product.handle) + (e.key === "ArrowUp" ? 1 : -1);
      setPending(
        next <= 1
          ? null
          : { handle: product.handle, qty: Math.min(MAX_QTY, next) },
      );
    },
    [addToCart, byHandle, qtyFor],
  );

  const pendingProduct =
    pending !== null ? byHandle.get(pending.handle) : undefined;

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={setOpen}
      title="Torre de control"
      description="Busca productos o navega la tienda"
      className="top-2 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-xl translate-y-0 flex-col sm:top-1/2 sm:w-full sm:max-w-xl sm:-translate-y-1/2"
      showCloseButton
    >
      <div
        aria-hidden
        className="h-[3px] shrink-0 bg-[linear-gradient(90deg,#002f87_0%,#0a50d0_62%,#ffd23c_100%)]"
      />
      {/* CommandDialog no incluye el root de cmdk: sin <Command> el input
          y la lista quedan sin contexto y la página se cae al abrir. */}
      <Command
        className="h-auto! min-h-0 flex-1"
        filter={scoreMatch}
        onKeyDown={onCommandKeyDown}
      >
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Busca geles, kits, 21K…"
        />
        <CommandList className="min-h-0 max-h-none! flex-1">
          <CommandEmpty>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Sin resultados en la ruta
            </span>
          </CommandEmpty>

          <CommandGroup heading="Productos" className={GROUP_STYLE}>
            {products.map((product) => {
              const qty = qtyFor(product.handle);
              return (
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
                  {qty > 1 ? (
                    <span className="rounded-sm bg-amarillo px-1.5 font-mono text-[11px] font-bold tabular-nums text-tinta">
                      ×{qty}
                    </span>
                  ) : null}
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatCOP(product.price)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    /* Fuera del tab: la lista se recorre con flechas, y con un
                       botón por fila el Tab abandonaba el campo de búsqueda. */
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart(product, qty);
                    }}
                    aria-label={`Agregar ${qty} × ${product.title} al carrito`}
                    className="size-11 shrink-0 rounded-sm text-muted-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground sm:size-6"
                  >
                    <PlusIcon className="size-3.5" />
                  </Button>
                </CommandItem>
              );
            })}
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

      {pending !== null && pendingProduct !== undefined ? (
        <div
          aria-live="polite"
          className="flex shrink-0 items-center gap-2 border-t border-border bg-amarillo/15 px-3 py-1.5"
        >
          <span className="rounded-sm bg-amarillo px-1.5 font-mono text-[11px] font-bold tabular-nums text-tinta">
            ×{pending.qty}
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase tracking-wider text-tinta/70">
            {pendingProduct.title}
          </span>
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-tinta/70">
            {mod}+↵ agrega {pending.qty}
          </span>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-between border-t border-border px-3 py-2">
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amarillo" />
          Torre de control
        </span>
        <span className="hidden items-center gap-3 font-mono text-[10px] text-muted-foreground sm:flex">
          <span className="hidden items-center gap-1 md:flex">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> moverte
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> ir
          </span>
          <span className="flex items-center gap-1">
            <Kbd>{mod}</Kbd>
            <Kbd>↑</Kbd> cantidad
          </span>
          <span className="flex items-center gap-1">
            <Kbd>{mod}</Kbd>
            <Kbd>↵</Kbd> al carrito
          </span>
        </span>
      </div>
    </CommandDialog>
  );
}
