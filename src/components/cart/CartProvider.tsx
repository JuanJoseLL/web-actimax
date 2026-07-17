"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

/** Datos mínimos de un producto para mostrarlo en el carrito. */
export interface CartLine {
  variantId: string | null;
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
  add: (line: CartLine, qty?: number) => void;
  setQty: (handle: string, qty: number) => void;
  remove: (handle: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
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
      const existing = prev.find((i) => i.handle === line.handle);
      if (existing !== undefined) {
        return prev.map((i) =>
          i.handle === line.handle ? { ...i, ...line, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { ...line, qty }];
    });
  }, [updateItems]);

  const setQty = useCallback((handle: string, qty: number) => {
    updateItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.handle !== handle)
        : prev.map((i) => (i.handle === handle ? { ...i, qty } : i)),
    );
  }, [updateItems]);

  const remove = useCallback((handle: string) => {
    updateItems((prev) => prev.filter((i) => i.handle !== handle));
  }, [updateItems]);

  const clear = useCallback(() => updateItems(() => []), [updateItems]);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);
    return { items, count, subtotal, isOpen, add, setQty, remove, clear, open, close };
  }, [items, isOpen, add, setQty, remove, clear, open, close]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}
