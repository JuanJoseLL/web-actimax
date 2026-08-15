"use client";

import { useState } from "react";
import { LoaderCircleIcon, ZapIcon } from "lucide-react";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { isValidCedula } from "@/lib/cedula";

interface Props {
  product: CartLine;
  qty?: number;
  disabled?: boolean;
  /** "full": botón grande de la página. "bar": botón compacto de la barra fija. */
  variant?: "full" | "bar";
}

/** Compra en un toque desde la PDP. La cédula comparte almacenamiento con el
    cajón: quien ya la escribió alguna vez va directo al pago, y al resto se
    le pide una sola vez en el diálogo. */
export function BuyNowButton({ product, qty = 1, disabled = false, variant = "full" }: Props) {
  const { buyNow, isCheckingOut, cedula, setCedula } = useCart();
  const [askCedula, setAskCedula] = useState(false);

  const handleClick = () => {
    if (!isValidCedula(cedula)) {
      setAskCedula(true);
      return;
    }
    void buyNow(product, qty);
  };

  const submitCedula = () => {
    if (!isValidCedula(cedula)) return;
    setAskCedula(false);
    void buyNow(product, qty);
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleClick}
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

      <Dialog open={askCedula} onOpenChange={setAskCedula}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold uppercase italic tracking-wide">
              Tu cédula para la factura
            </DialogTitle>
            <DialogDescription>
              La necesitamos para tu factura y la guía de envío. Queda guardada para tu
              próxima compra.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitCedula();
            }}
            className="grid gap-3"
          >
            <label htmlFor="cedula-comprar-ahora" className="sr-only">
              Cédula de quien compra
            </label>
            <Input
              id="cedula-comprar-ahora"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              placeholder="Ej: 1035467890"
              value={cedula}
              onChange={(event) => setCedula(event.target.value)}
              className="h-11 font-mono tabular-nums"
            />
            <p className="text-xs text-muted-foreground">Solo números, de 6 a 10 dígitos.</p>
            <Button
              type="submit"
              variant="raceSun"
              size="lg"
              disabled={!isValidCedula(cedula)}
              className="w-full py-3"
            >
              <ZapIcon data-icon="inline-start" />
              Ir a pagar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
