"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { track } from "@vercel/analytics";
import { toast } from "sonner";
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
  /** Compra directa de una sola línea, sin tocar el carrito guardado. */
  buyNow: (line: CartLine, qty?: number) => Promise<void>;
  clearCheckoutError: () => void;
  /** Cédula de quien compra: Shopify no la pide en el checkout, va como atributo. */
  cedula: string;
  setCedula: (value: string) => void;
  /** Cédula faltante o mal escrita: se señala sobre el campo, no como falla del sistema. */
  cedulaError: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "actimax-cart-v3";
const CEDULA_STORAGE_KEY = "actimax-cedula";
const PENDING_CHECKOUT_KEY = "actimax-checkout-pendiente";
const PENDING_BUYNOW_KEY = "actimax-comprar-ahora-pendiente";
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
  const [cedulaError, setCedulaError] = useState<string | null>(null);
  const cedula = useSyncExternalStore(
    subscribeToCedula,
    getCedulaSnapshot,
    getServerCedulaSnapshot,
  );

  const setCedula = useCallback((value: string) => {
    setCedulaError(null);
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

  const clearCheckoutError = useCallback(() => {
    setCheckoutError(null);
    setCedulaError(null);
  }, []);

  const count = items.reduce((acc, i) => acc + i.qty, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.qty, 0);

  /* Separa "nunca abrió el carrito" de "vio el carrito (y la cédula) y se
     fue". Se registra el paso de cerrado a abierto: el ref evita repetirlo
     cuando los items cambian con el cajón ya abierto. */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      track("ver_carrito", { valor: subtotal, unidades: count });
    }
    wasOpen.current = isOpen;
  }, [isOpen, subtotal, count]);

  /* Volver desde Shopify restaura la página del bfcache con el estado tal
     cual quedó: sin esto el botón se queda congelado en "Abriendo pago". */
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsCheckingOut(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  /* Shopify elimina el carrito cuando la compra se completa: si un carrito
     que dejamos pendiente al ir al checkout ya no existe, el pedido se pagó.
     Es el único rastro de compra que ve el sitio (el pago ocurre en Shopify),
     así que `compra` subcuenta: solo dispara si el comprador vuelve al
     dominio. Sirve como tendencia y como alarma de "hoy no entró ninguna". */
  useEffect(() => {
    const verifyPendingCart = (
      storageKey: string,
      via: "carrito" | "comprar-ahora",
      onPaid: (() => void) | null,
    ) => {
      let pending: string | null;
      try {
        pending = window.localStorage.getItem(storageKey);
      } catch {
        return;
      }
      if (pending === null) return;
      let cartId = pending;
      let valor: number | null = null;
      try {
        const parsed: unknown = JSON.parse(pending);
        if (typeof parsed === "object" && parsed !== null) {
          const record = parsed as Record<string, unknown>;
          if (typeof record.cart === "string") cartId = record.cart;
          if (typeof record.valor === "number") valor = record.valor;
        }
      } catch {
        // pendiente guardado antes de rastrear `compra`: trae solo el id
      }
      fetch(`/api/checkout/estado/?cart=${encodeURIComponent(cartId)}`)
        .then((response) => (response.ok ? (response.json() as Promise<unknown>) : null))
        .then((data) => {
          if (
            typeof data === "object" &&
            data !== null &&
            (data as { existe?: unknown }).existe === false
          ) {
            try {
              window.localStorage.removeItem(storageKey);
            } catch {
              // sin almacenamiento: se reintentará en la próxima visita
            }
            track("compra", valor === null ? { via } : { valor, via });
            onPaid?.();
          }
        })
        .catch(() => {
          // sin conexión: se reintentará en la próxima visita
        });
    };
    const verifyPendingCheckout = () => {
      /* Solo el flujo de carrito vacía el carrito guardado al pagar:
         comprar-ahora nunca lo tocó. */
      verifyPendingCart(PENDING_CHECKOUT_KEY, "carrito", clear);
      verifyPendingCart(PENDING_BUYNOW_KEY, "comprar-ahora", null);
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
    setCedulaError(null);

    const valor = items.reduce((acc, i) => acc + i.price * i.qty, 0);
    /* La tienda ya perdió un día de ventas por un checkout roto que nadie vio
       hasta el día siguiente. `motivo` separa un problema de negocio (stock,
       cédula) de uno técnico (Shopify caído). El plan Pro de Vercel solo
       guarda 2 propiedades por evento —la tercera se descarta en silencio,
       verificado contra la API—, así que `via` desplazó a `valor`: comparar
       los dos embudos pesa más que el ticket de los intentos fallidos. */
    let failureTracked = false;
    const trackFailure = (motivo: string) => {
      failureTracked = true;
      track("checkout_fallido", { motivo, via: "carrito" });
    };

    if (items.length === 0) {
      setCheckoutError("Tu carrito está vacío.");
      trackFailure("carrito-vacio");
      return;
    }
    if (items.some((item) => item.variantId === null)) {
      setCheckoutError(
        "Uno o más productos vienen del catálogo de respaldo. Recarga la página para volver a conectarte con Shopify.",
      );
      trackFailure("catalogo-respaldo");
      return;
    }
    if (!isValidCedula(cedula)) {
      /* La paleta también dispara el checkout: se abre el cajón para que el
         campo de cédula quede a la vista con su error. */
      setCedulaError(
        normalizeCedula(cedula) === ""
          ? "Falta tu cédula para continuar."
          : "La cédula va solo con números, de 6 a 10 dígitos.",
      );
      setIsOpen(true);
      trackFailure("cedula");
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
            trackFailure("inventario");
            throw new Error(
              shortedCartMessage(
                shorted,
                (merchandiseId) =>
                  items.find((item) => item.variantId === merchandiseId)?.title,
              ),
            );
          }
        }
        trackFailure("shopify");
        const message = resultObj.error;
        throw new Error(typeof message === "string" ? message : "No se pudo iniciar el pago.");
      }
      if (typeof resultObj.cartId === "string") {
        try {
          /* El valor viaja junto al id: al volver del pago el carrito local
             ya pudo cambiar y `compra` debe reportar lo que se pagó. */
          window.localStorage.setItem(
            PENDING_CHECKOUT_KEY,
            JSON.stringify({ cart: resultObj.cartId, valor }),
          );
        } catch {
          // sin almacenamiento no habrá limpieza post-compra, nada más
        }
      }
      /* Último punto que controla el sitio: de acá en adelante el pago ocurre
         en Shopify. `valor` da el ticket de los carritos que sí llegan a
         pagar; `unidades` salió por el tope de 2 propiedades del plan Pro. */
      track("iniciar_checkout", { valor, via: "carrito" });
      window.location.assign(checkoutUrl);
    } catch (error) {
      /* Un fallo de red no pasó por ninguna de las ramas de arriba: se
         registra acá, y solo si esas ramas no lo marcaron ya al lanzar. */
      if (!failureTracked) trackFailure("conexion");
      setCheckoutError(
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Inténtalo de nuevo.",
      );
      setIsCheckingOut(false);
    }
  }, [isCheckingOut, items, cedula]);

  /* Compra directa desde la PDP: un checkout con esa única línea. El carrito
     guardado no participa ni se limpia al completar el pago; el pendiente va
     en su propia llave solo para detectar la compra, sin vaciar nada. Los
     errores van en toast porque el cajón —donde vive la alerta del checkout—
     no está abierto en este flujo. */
  const buyNow = useCallback(async (line: CartLine, qty = 1) => {
    if (isCheckingOut) return;

    const valor = line.price * qty;
    let failureTracked = false;
    const trackFailure = (motivo: string) => {
      failureTracked = true;
      track("checkout_fallido", { motivo, via: "comprar-ahora" });
    };

    if (line.variantId === null) {
      toast.error(
        "Este producto viene del catálogo de respaldo. Recarga la página para volver a conectarte con Shopify.",
      );
      trackFailure("catalogo-respaldo");
      return;
    }
    if (!isValidCedula(cedula)) {
      /* El botón pide la cédula en su diálogo antes de llegar acá; esto es
         solo el respaldo por si algún camino se lo salta. */
      toast.error("Ingresa tu cédula (solo números, de 6 a 10 dígitos) para continuar.");
      trackFailure("cedula");
      return;
    }

    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/checkout/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: [{ merchandiseId: line.variantId, quantity: qty }],
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
        if (response.status === 409 && Array.isArray(resultObj.shorted)) {
          const shorted = resultObj.shorted.filter(isShortedLine);
          if (shorted.length > 0) {
            trackFailure("inventario");
            throw new Error(
              shortedCartMessage(shorted, (merchandiseId) =>
                merchandiseId === line.variantId ? line.title : undefined,
              ),
            );
          }
        }
        trackFailure("shopify");
        const message = resultObj.error;
        throw new Error(typeof message === "string" ? message : "No se pudo iniciar el pago.");
      }
      if (typeof resultObj.cartId === "string") {
        try {
          window.localStorage.setItem(
            PENDING_BUYNOW_KEY,
            JSON.stringify({ cart: resultObj.cartId, valor }),
          );
        } catch {
          // sin almacenamiento no se detectará esta compra, nada más
        }
      }
      track("iniciar_checkout", { valor, via: "comprar-ahora" });
      window.location.assign(checkoutUrl);
    } catch (error) {
      if (!failureTracked) trackFailure("conexion");
      toast.error(
        error instanceof Error ? error.message : "No se pudo iniciar el pago. Inténtalo de nuevo.",
      );
      setIsCheckingOut(false);
    }
  }, [isCheckingOut, cedula]);

  const value = useMemo<CartContextValue>(() => {
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
      buyNow,
      clearCheckoutError,
      cedula,
      setCedula,
      cedulaError,
    };
  }, [
    items,
    count,
    subtotal,
    isOpen,
    isCheckingOut,
    checkoutError,
    cedulaError,
    add,
    setQty,
    remove,
    clear,
    open,
    close,
    checkout,
    buyNow,
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
