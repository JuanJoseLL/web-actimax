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
import { isValidCedula, normalizeCedula } from "@/lib/cedula";
import { isShortedLine, shortedCartMessage } from "@/lib/checkout-lines";

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
  /** Cédula de quien compra: Shopify no la pide en el checkout, va como atributo. */
  cedula: string;
  setCedula: (value: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "actimax-cart-v3";
const CEDULA_STORAGE_KEY = "actimax-cedula";
const PENDING_CHECKOUT_KEY = "actimax-checkout-pendiente";
const CHANGE_EVENT = "actimax-cart-change";
const CEDULA_CHANGE_EVENT = "actimax-cedula-change";
let fallbackCart = "[]";
let fallbackCedula = "";

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

function subscribeToCedula(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CEDULA_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CEDULA_CHANGE_EVENT, onStoreChange);
  };
}

function getCedulaSnapshot() {
  try {
    return window.localStorage.getItem(CEDULA_STORAGE_KEY) ?? "";
  } catch {
    return fallbackCedula;
  }
}

function getServerCedulaSnapshot() {
  return "";
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
  const cedula = useSyncExternalStore(
    subscribeToCedula,
    getCedulaSnapshot,
    getServerCedulaSnapshot,
  );

  const setCedula = useCallback((value: string) => {
    try {
      window.localStorage.setItem(CEDULA_STORAGE_KEY, value);
    } catch {
      fallbackCedula = value;
    }
    window.dispatchEvent(new Event(CEDULA_CHANGE_EVENT));
  }, []);

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

  /* Shopify elimina el carrito cuando la compra se completa: si el carrito
     que dejamos pendiente al ir al checkout ya no existe, el pedido se pagó
     y el carrito local se vacía. Si sigue existiendo, el cliente abandonó el
     checkout y sus productos se conservan. */
  useEffect(() => {
    const verifyPendingCheckout = () => {
      let pending: string | null;
      try {
        pending = window.localStorage.getItem(PENDING_CHECKOUT_KEY);
      } catch {
        return;
      }
      if (pending === null) return;
      fetch(`/api/checkout/estado/?cart=${encodeURIComponent(pending)}`)
        .then((response) => (response.ok ? (response.json() as Promise<unknown>) : null))
        .then((data) => {
          if (
            typeof data === "object" &&
            data !== null &&
            (data as { existe?: unknown }).existe === false
          ) {
            try {
              window.localStorage.removeItem(PENDING_CHECKOUT_KEY);
            } catch {
              // sin almacenamiento: se reintentará en la próxima visita
            }
            clear();
          }
        })
        .catch(() => {
          // sin conexión: se reintentará en la próxima visita
        });
    };
    verifyPendingCheckout();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) verifyPendingCheckout();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [clear]);

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
    if (!isValidCedula(cedula)) {
      /* La paleta también dispara el checkout: se abre el cajón para que el
         campo de cédula quede a la vista junto al error. */
      setCheckoutError("Ingresa tu cédula (solo números, de 6 a 10 dígitos) para continuar.");
      setIsOpen(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((item) => ({
            merchandiseId: item.variantId,
            quantity: item.qty,
          })),
          cedula: normalizeCedula(cedula),
        }),
      });
      const result: unknown = await response.json();
      const resultObj =
        typeof result === "object" && result !== null
          ? (result as Record<string, unknown>)
          : {};
      const checkoutUrl = resultObj.checkoutUrl;
      if (!response.ok || typeof checkoutUrl !== "string") {
        /* Inventario insuficiente: Shopify descartó o recortó líneas y la
           ruta abortó en vez de redirigir a un checkout distinto al carrito. */
        if (response.status === 409 && Array.isArray(resultObj.shorted)) {
          const shorted = resultObj.shorted.filter(isShortedLine);
          if (shorted.length > 0) {
            throw new Error(
              shortedCartMessage(
                shorted,
                (merchandiseId) =>
                  items.find((item) => item.variantId === merchandiseId)?.title,
              ),
            );
          }
        }
        const message = resultObj.error;
        throw new Error(typeof message === "string" ? message : "No se pudo iniciar el pago.");
      }
      if (typeof resultObj.cartId === "string") {
        try {
          window.localStorage.setItem(PENDING_CHECKOUT_KEY, resultObj.cartId);
        } catch {
          // sin almacenamiento no habrá limpieza post-compra, nada más
        }
      }
      window.location.assign(checkoutUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Inténtalo de nuevo.",
      );
      setIsCheckingOut(false);
    }
  }, [isCheckingOut, items, cedula]);

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
      cedula,
      setCedula,
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
    cedula,
    setCedula,
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
