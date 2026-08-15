"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeftIcon,
  CookieIcon,
  CreditCardIcon,
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
import { track } from "@/lib/track";
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
import { trackableText } from "@/lib/analytics";
import { cartLineId } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { scoreMatch } from "@/lib/palette-search";
import { canonicalProductPath } from "@/lib/product-paths";
import { searchKeywords } from "@/lib/search-keywords";
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
  variantTitle?: string;
  hasMultipleVariants: boolean;
  handle: string;
  title: string;
  type: ProductType | null;
  momentos: Momento[];
  deportes: string[];
  price: number;
  image: string | null;
  inStock: boolean;
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
  const {
    add,
    items,
    count,
    subtotal,
    open: openCart,
    checkout,
  } = useCart();
  const isMac = useIsMac();
  const mod = isMac ? "⌘" : "Ctrl";

  const byHandle = useMemo(
    () => new Map(products.map((p) => [p.handle, p])),
    [products],
  );

  /** Los mismos términos con los que cmdk filtra cada fila. */
  const productKeywords = useCallback(
    (product: PaletteProduct) => [
      product.title,
      typeLabel(product.type),
      ...product.momentos.map((m) => MOMENTO_LABELS[m]),
      ...product.deportes.map((d) => DEPORTE_LABELS[d] ?? d),
      ...searchKeywords(product),
    ],
    [],
  );

  /**
   * Lo que se escribe en la paleta es demanda declarada y no deja rastro en
   * ningún pageview. `consulta` da el vocabulario real de los clientes y
   * `resultado` dice en qué producto terminó; las que terminan en
   * "sin-resultados" son las accionables (un nombre que no usamos, un
   * producto que no tenemos) y nadie las reporta a mano.
   */
  const trackSearch = useCallback(
    (resultado: string) => {
      const term = query.trim();
      if (term === "") return;
      track("busqueda_paleta", {
        consulta: trackableText(term.toLocaleLowerCase("es-CO")),
        resultado,
      });
    },
    [query],
  );

  /* Una búsqueda fallida no termina en ningún clic que registrar, así que se
     registra sola cuando la escritura se detiene. */
  useEffect(() => {
    const term = query.trim();
    if (!isOpen || term.length < 3) return;
    const timer = setTimeout(() => {
      const found = products.some(
        (product) => scoreMatch(product.handle, term, productKeywords(product)) > 0,
      );
      if (!found) trackSearch("sin-resultados");
    }, 1200);
    return () => clearTimeout(timer);
  }, [isOpen, productKeywords, products, query, trackSearch]);

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

  /** Abrir la ficha cierra la paleta y cuenta como resultado de la búsqueda. */
  const openProduct = useCallback(
    (product: PaletteProduct) => {
      trackSearch(product.handle);
      run(() => router.push(canonicalProductPath(product.handle)));
    },
    [router, run, trackSearch],
  );

  const addToCart = useCallback(
    (product: PaletteProduct, quantity: number) => {
      if (!product.inStock) return;
      const lineId = cartLineId(product);
      const total =
        (items.find((item) => cartLineId(item) === lineId)?.qty ?? 0) +
        quantity;
      add(product, quantity);
      /* La paleta no pasa por AddToCartButton: sin esto, todo lo que se agrega
         con ⌘K quedaría fuera del embudo. */
      track("agregar_al_carrito", { producto: product.handle, origen: "paleta" });
      trackSearch(product.handle);
      setPending(null);
      toast.success(product.title, {
        /* Un toast por producto, compartido con AddToCartButton: agregar de
           a uno actualiza el aviso en vez de apilar cuatro iguales. */
        id: `cart-${lineId}`,
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
    [add, items, openCart, setOpen, trackSearch],
  );

  /** Cierra la paleta, muestra el carrito y arranca el pago desde ahí. */
  const goToCheckout = useCallback(() => {
    setOpen(false);
    openCart();
    void checkout();
  }, [checkout, openCart, setOpen]);

  /** ⌘↵ agrega la cantidad preparada; ⌘↑ / ⌘↓ la suben y bajan. */
  const onCommandKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;

      if (e.shiftKey) {
        /* ⌘⇧↵ paga. Con el carrito vacío no se secuestra la tecla: no hay
           nada que cobrar y quien la apretó espera que no pase nada. */
        if (e.key !== "Enter" || count === 0) return;
        e.preventDefault();
        goToCheckout();
        return;
      }

      if (e.key !== "Enter" && e.key !== "ArrowUp" && e.key !== "ArrowDown") {
        return;
      }
      const value = selectedValue(e.currentTarget);
      const product = value !== null ? byHandle.get(value) : undefined;
      /* Sobre un momento o una ruta no hay nada que sumar: se deja pasar la
         tecla para que cmdk siga haciendo lo suyo (ir al primero/último). */
      if (product === undefined) return;

      /* Con variantes hay que elegir en la página; agotado no se agrega:
         en ambos casos Enter lleva a la página del producto. */
      if (product.hasMultipleVariants || !product.inStock) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        openProduct(product);
        return;
      }
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
    [addToCart, byHandle, count, goToCheckout, openProduct, qtyFor],
  );

  const pendingProduct =
    pending !== null ? byHandle.get(pending.handle) : undefined;

  /* Un "3" a secas se lee como "3 productos" y hace que el total parezca
     equivocado. Con una sola línea se nombra el producto y su cantidad; con
     varias se separan los productos de las unidades. */
  const cartLabel = useMemo(() => {
    const [first] = items;
    if (items.length === 1 && first !== undefined) {
      return first.qty === 1 ? first.title : `${first.title} ×${first.qty}`;
    }
    const productos = `${items.length} productos`;
    return count === items.length ? productos : `${productos} · ${count} unidades`;
  }, [count, items]);

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
              const qty = product.hasMultipleVariants
                ? 1
                : qtyFor(product.handle);
              return (
                <CommandItem
                  key={product.handle}
                  value={product.handle}
                  keywords={productKeywords(product)}
                  onSelect={() => openProduct(product)}
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
                  {!product.hasMultipleVariants && qty > 1 ? (
                    <span className="rounded-sm bg-amarillo px-1.5 font-mono text-[11px] font-bold tabular-nums text-tinta">
                      ×{qty}
                    </span>
                  ) : null}
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatCOP(product.price)}
                  </span>
                  {!product.inStock && !product.hasMultipleVariants ? (
                    <span className="flex h-11 shrink-0 items-center rounded-sm border border-input px-2 font-mono text-[9px] font-bold uppercase text-muted-foreground sm:h-6">
                      Agotado
                    </span>
                  ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size={product.hasMultipleVariants ? "xs" : "icon-xs"}
                    /* Fuera del tab: la lista se recorre con flechas, y con un
                       botón por fila el Tab abandonaba el campo de búsqueda. */
                    tabIndex={-1}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (product.hasMultipleVariants) {
                        openProduct(product);
                      } else {
                        addToCart(product, qty);
                      }
                    }}
                    aria-label={
                      product.hasMultipleVariants
                        ? `Elegir variante de ${product.title}`
                        : `Agregar ${qty} × ${product.title} al carrito`
                    }
                    className={
                      product.hasMultipleVariants
                        ? "h-11 shrink-0 rounded-sm px-2 text-muted-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground sm:h-6"
                        : "size-11 shrink-0 rounded-sm text-muted-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground sm:size-6"
                    }
                  >
                    {product.hasMultipleVariants ? (
                      <span className="font-mono text-[9px] font-bold uppercase">
                        Elegir
                      </span>
                    ) : (
                      <PlusIcon className="size-3.5" />
                    )}
                  </Button>
                  )}
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
          </CommandGroup>

          <CommandSeparator />

          {/* forceMount: el carrito se busca escribiendo "carrito" o "pagar",
              así que no puede desaparecer al filtrar. Puntúa 0, o sea que el
              orden de cmdk la manda al fondo sola y nunca le roba la primera
              selección. El acceso que siempre se ve es la fila de abajo. */}
          <CommandGroup heading="Carrito" className={GROUP_STYLE} forceMount>
            <CommandItem value="Ver carrito" onSelect={() => run(openCart)}>
              <ShoppingCartIcon className="text-muted-foreground" />
              <span className="flex-1">Ver carrito</span>
              {count > 0 ? (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCOP(subtotal)}
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Vacío
                </span>
              )}
            </CommandItem>
            {count > 0 ? (
              <CommandItem value="Finalizar compra" onSelect={goToCheckout}>
                <CreditCardIcon className="text-muted-foreground" />
                <span className="flex-1">Finalizar compra</span>
                <span className="hidden items-center gap-1 sm:flex">
                  <Kbd>{mod}</Kbd>
                  <Kbd>⇧</Kbd>
                  <Kbd>↵</Kbd>
                </span>
              </CommandItem>
            ) : null}
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

      {/* El carrito vive fuera de la lista: ni el filtro ni el scroll lo pueden
          esconder. Antes solo existía como un item al fondo de la lista y para
          verlo había que bajar por todo el catálogo. */}
      {count > 0 ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-border bg-muted/40 px-3 py-2">
          <button
            type="button"
            onClick={() => run(openCart)}
            aria-label={`Ver carrito: ${cartLabel}, total ${formatCOP(subtotal)}`}
            className="-my-1 flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-sm px-1.5 py-1 text-left hover:bg-muted"
          >
            <ShoppingCartIcon aria-hidden className="size-4 shrink-0 text-azul" />
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] tabular-nums text-muted-foreground">
              {cartLabel}
            </span>
            <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-foreground">
              {formatCOP(subtotal)}
            </span>
          </button>
          {/* Las teclas van al lado y no adentro del botón: `raceSun` está
              inclinado y arrastraría los Kbd con él. */}
          <span className="hidden shrink-0 items-center gap-1 sm:flex">
            <Kbd>{mod}</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>↵</Kbd>
          </span>
          <Button
            type="button"
            variant="raceSun"
            size="sm"
            onClick={goToCheckout}
            className="-my-1 h-7 shrink-0 font-mono text-[11px]"
          >
            Pagar
          </Button>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-3 py-2">
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
