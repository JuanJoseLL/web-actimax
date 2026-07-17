"use client";

import { useRef, useState } from "react";
import { CheckIcon, ShoppingBagIcon } from "lucide-react";
import { toast } from "sonner";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/format";

interface Props {
  product: CartLine;
  qty?: number;
  /** "card": botón compacto en tarjetas. "full": botón grande de página de producto (abre el carrito). */
  variant?: "card" | "full";
  disabled?: boolean;
}

export function AddToCartButton({ product, qty = 1, variant = "card", disabled = false }: Props) {
  const { add, open } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    add(product, qty);
    if (variant === "full") {
      open();
      return;
    }
    setAdded(true);
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1400);
    toast.success(product.title, {
      description: `${qty} × ${formatCOP(product.price)} · en tu carrito`,
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

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Agregar al carrito"
      variant={added ? "raceSun" : "race"}
      size="sm"
      className={`font-mono text-xs ${
        disabled ? "bg-muted text-muted-foreground" : ""
      }`}
    >
      {added ? <CheckIcon data-icon="inline-start" /> : <ShoppingBagIcon data-icon="inline-start" />}
      {added ? "Listo" : disabled ? "Agotado" : "Agregar"}
    </Button>
  );
}
