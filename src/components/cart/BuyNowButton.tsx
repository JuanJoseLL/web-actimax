"use client";

import { LoaderCircleIcon, ZapIcon } from "lucide-react";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";

interface Props {
  product: CartLine;
  qty?: number;
  disabled?: boolean;
  /** "full": botón grande de la página. "bar": botón compacto de la barra fija. */
  variant?: "full" | "bar";
}

/** Compra en un toque desde la PDP: directo al pago de Shopify, que ya pide
    la cédula (campo "CC o NIT" obligatorio de la dirección de envío). */
export function BuyNowButton({ product, qty = 1, disabled = false, variant = "full" }: Props) {
  const { buyNow, isCheckingOut } = useCart();

  return (
    <Button
      type="button"
      onClick={() => void buyNow(product, qty)}
      disabled={disabled || isCheckingOut}
      variant="raceSun"
      size="lg"
      className={variant === "full" ? "w-full py-3.5" : "h-11 px-3 text-sm"}
    >
      {isCheckingOut ? (
        <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
      ) : (
        <ZapIcon data-icon="inline-start" />
      )}
      {isCheckingOut ? "Abriendo pago..." : "Comprar ahora"}
    </Button>
  );
}
