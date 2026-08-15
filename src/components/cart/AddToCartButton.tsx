"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";
import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { cartSurface } from "@/lib/analytics";
import { cartLineId } from "@/lib/cart";
import { formatCOP } from "@/lib/format";

interface Props {
  product: CartLine;
  qty?: number;
  /** "card": botón compacto en tarjetas. "full": botón grande de página de
      producto. "bar": solo ícono, para la barra fija de compra. "full" y
      "bar" abren el carrito al agregar. */
  variant?: "card" | "full" | "bar";
  disabled?: boolean;
  /** Sobrescribe la página visible cuando el botón vive en una superficie global. */
  origin?: string;
}

export function AddToCartButton({
  product,
  qty = 1,
  variant = "card",
  disabled = false,
  origin,
}: Props) {
  const { add, items, open } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Salir de la grilla antes de que expire el "Listo" dejaba el timer vivo. */
  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  const handleClick = () => {
    const lineId = cartLineId(product);
    const total =
      (items.find((item) => cartLineId(item) === lineId)?.qty ?? 0) + qty;
    add(product, qty);
    /* Qué se agrega y desde dónde: el ranking de lo agregado no coincide con
       el de lo visto, y `origen` es lo único que dice si las herramientas
       propias (mi-plan, comparador, paleta) terminan en carrito. La plata del
       carrito se mide entera en `iniciar_checkout`, para no contarla dos
       veces acá. */
    track("agregar_al_carrito", {
      producto: product.handle,
      origen: origin ?? cartSurface(window.location.pathname),
    });
    if (variant === "full" || variant === "bar") {
      open();
      return;
    }
    setAdded(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
    toast.success(product.title, {
      /* Un toast por producto, compartido con la paleta: agregar de a uno
         actualiza el aviso en vez de apilar cuatro iguales. Por eso muestra
         el total de la línea y no lo que se acaba de sumar. */
      id: `cart-${lineId}`,
      description: `${total} × ${formatCOP(product.price)} · en tu carrito`,
      action: { label: "Ver carrito", onClick: open },
    });
  };

  if (variant === "full") {
    return (
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        variant="race"
        size="lg"
        className="w-full py-4 text-xl"
      >
        <ShoppingBagIcon data-icon="inline-start" />
        {disabled ? "Agotado" : "Agregar al carrito"}
      </Button>
    );
  }

  if (variant === "bar") {
    return (
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-label={disabled ? "Agotado" : "Agregar al carrito"}
        variant="race"
        size="icon-lg"
        className="size-11"
      >
        <ShoppingBagIcon />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Agregar al carrito"
      variant={added ? "raceSun" : "race"}
      size="sm"
      className={`w-full font-mono text-xs sm:w-auto ${
        disabled ? "bg-muted text-muted-foreground" : ""
      }`}
    >
      {added ? <CheckIcon data-icon="inline-start" /> : <ShoppingBagIcon data-icon="inline-start" />}
      {added ? "Listo" : disabled ? "Agotado" : "Agregar"}
    </Button>
  );
}
