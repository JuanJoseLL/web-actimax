"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { cartLineId } from "@/lib/cart";

/** Datos mínimos de un producto para mostrarlo en el carrito. */
export interface CartLine {
  variantId: string | null;
  variantTitle?: string;
  handle: string;
  title: string;
  price: number;
  image: string | null;
}

export interface CartItem extends CartLine {
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** Pago en curso: el carrito ya se pidió a Shopify y falta el redirect. */
  isCheckingOut: boolean;
  checkoutError: string | null;
  add: (line: CartLine, qty?: number) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  /** Vive en el provider, no en el cajón: la paleta también lo dispara. */
  checkout: () => Promise<void>;
  clearCheckoutError: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "actimax-cart-v3";
const CHANGE_EVENT = "actimax-cart-change";
let fallbackCart = "[]";

function subscribeToCart(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function getCartSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return fallbackCart;
  }
}

function getServerCartSnapshot() {
  return "[]";
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    (item.variantId === null || typeof item.variantId === "string") &&
    (item.variantTitle === undefined || typeof item.variantTitle === "string") &&
    typeof item.handle === "string" &&
    typeof item.title === "string" &&
    typeof item.price === "number" &&
    (item.image === null || typeof item.image === "string") &&
    typeof item.qty === "number"
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const serializedItems = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getServerCartSnapshot,
  );
  const items = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(serializedItems);
      return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
    } catch {
      return [];
    }
  }, [serializedItems]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const updateItems = useCallback((recipe: (items: CartItem[]) => CartItem[]) => {
    try {
      const saved = getCartSnapshot();
      const parsed: unknown = JSON.parse(saved);
      const current = Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
      const next = JSON.stringify(recipe(current));
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        fallbackCart = next;
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // almacenamiento no disponible: se conserva la interfaz sin lanzar errores
    }
  }, []);

  const add = useCallback((line: CartLine, qty = 1) => {
    updateItems((prev) => {
      const lineId = cartLineId(line);
      const existing = prev.find((item) => cartLineId(item) === lineId);
      if (existing !== undefined) {
        return prev.map((i) =>
          cartLineId(i) === lineId ? { ...i, ...line, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { ...line, qty }];
    });
  }, [updateItems]);

  const setQty = useCallback((lineId: string, qty: number) => {
    updateItems((prev) =>
      qty <= 0
        ? prev.filter((i) => cartLineId(i) !== lineId)
        : prev.map((i) => (cartLineId(i) === lineId ? { ...i, qty } : i)),
    );
  }, [updateItems]);

  const remove = useCallback((lineId: string) => {
    updateItems((prev) => prev.filter((i) => cartLineId(i) !== lineId));
  }, [updateItems]);

  const clear = useCallback(() => updateItems(() => []), [updateItems]);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const clearCheckoutError = useCallback(() => setCheckoutError(null), []);

  /* Volver desde Shopify restaura la página del bfcache con el estado tal
     cual quedó: sin esto el botón se queda congelado en "Abriendo pago". */
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const checkout = useCallback(async () => {
    if (isCheckingOut) return;
    setCheckoutError(null);

    if (items.length === 0) {
      setCheckoutError("Tu carrito está vacío.");
      return;
    }
    if (items.some((item) => item.variantId === null)) {
      setCheckoutError(
        "Uno o más productos vienen del catálogo de respaldo. Recarga la página para volver a conectarte con Shopify.",
      );
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((item) => ({
            merchandiseId: item.variantId,
            quantity: item.qty,
          })),
        }),
      });
      const result: unknown = await response.json();
      const checkoutUrl =
        typeof result === "object" && result !== null && "checkoutUrl" in result
          ? (result as { checkoutUrl?: unknown }).checkoutUrl
          : undefined;
      if (!response.ok || typeof checkoutUrl !== "string") {
        const message =
          typeof result === "object" && result !== null && "error" in result
            ? (result as { error?: unknown }).error
            : undefined;
        throw new Error(typeof message === "string" ? message : "No se pudo iniciar el pago.");
      }
      window.location.assign(checkoutUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Inténtalo de nuevo.",
      );
      setIsCheckingOut(false);
    }
  }, [isCheckingOut, items]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      isCheckingOut,
      checkoutError,
      add,
      setQty,
      remove,
      clear,
      open,
      close,
      checkout,
      clearCheckoutError,
    };
  }, [
    items,
    isOpen,
    isCheckingOut,
    checkoutError,
    add,
    setQty,
    remove,
    clear,
    open,
    close,
    checkout,
    clearCheckoutError,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}
