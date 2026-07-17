"use client";

import Image from "next/image";
import Link from "next/link";
import { FlagIcon, InfoIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/components/cart/CartProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ENVIO_GRATIS_UMBRAL } from "@/lib/envio";
import { formatCOP } from "@/lib/format";

/** Barra de progreso hacia el envío gratis, al estilo ruta de carrera. */
function EnvioGratisMeta({ subtotal }: { subtotal: number }) {
  const reached = subtotal >= ENVIO_GRATIS_UMBRAL;
  return (
    <div className="border-b border-border px-5 py-3">
      {reached ? (
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-azul">
          ¡Meta! Envío gratis desbloqueado
        </p>
      ) : (
        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          Te faltan{" "}
          <span className="font-bold tabular-nums text-foreground">
            {formatCOP(ENVIO_GRATIS_UMBRAL - subtotal)}
          </span>{" "}
          para envío gratis
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Progress
          value={Math.min(100, (subtotal / ENVIO_GRATIS_UMBRAL) * 100)}
          aria-label="Progreso hacia envío gratis"
          className="h-1.5 [&_[data-slot=progress-indicator]]:bg-[linear-gradient(90deg,#002f87_0%,#0a50d0_62%,#ffd23c_100%)]"
        />
        <FlagIcon
          aria-hidden
          className={`size-4 shrink-0 ${reached ? "fill-amarillo text-azul" : "text-muted-foreground/50"}`}
        />
      </div>
    </div>
  );
}

export function CartDrawer() {
  const { items, subtotal, isOpen, close, setQty, remove } = useCart();
  const [checkoutNote, setCheckoutNote] = useState(false);

  const handleClose = () => {
    setCheckoutNote(false);
    close();
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent side="right" className="w-full max-w-md gap-0 p-0 sm:max-w-md">
        <div
          aria-hidden
          className="h-[3px] shrink-0 bg-[linear-gradient(90deg,#002f87_0%,#0a50d0_62%,#ffd23c_100%)]"
        />
        <SheetHeader className="border-b border-border px-5 py-4 pr-14">
          <div className="flex items-baseline justify-between gap-3">
            <SheetTitle className="font-display text-2xl font-bold uppercase italic tracking-wide">
              Tu carrito
            </SheetTitle>
            {items.length > 0 ? (
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {items.length === 1 ? "1 producto" : `${items.length} productos`}
              </span>
            ) : null}
          </div>
          <SheetDescription className="sr-only">
            Revisa los productos de tu carrito y modifica sus cantidades.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-display text-3xl font-bold uppercase italic text-muted-foreground/60">
              Carrito vacío
            </p>
            <p className="text-sm text-muted-foreground">
              Agrega geles, bebidas o un Energy Pack para tu próxima carrera.
            </p>
            <Button asChild variant="race" size="lg">
              <Link href="/productos" onClick={handleClose}>
                Ver productos
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <EnvioGratisMeta subtotal={subtotal} />
            <ul className="flex-1 overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.handle} className="flex gap-4 border-b border-dashed border-border py-4">
                  <Link
                    href={`/productos/${item.handle}`}
                    onClick={handleClose}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted"
                  >
                    {item.image !== null ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-contain p-1.5 mix-blend-multiply"
                      />
                    ) : null}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                      {formatCOP(item.price)}
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      <QuantitySelector
                        value={item.qty}
                        onChange={(qty) => setQty(item.handle, qty)}
                        min={0}
                        label={`cantidad de ${item.title}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(item.handle)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Eliminar ${item.title}`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {formatCOP(item.price * item.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <SheetFooter className="border-t border-border bg-background px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Subtotal
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums">{formatCOP(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {subtotal >= ENVIO_GRATIS_UMBRAL
                  ? "Envío gratis aplicado al finalizar la compra."
                  : "Envío calculado al finalizar la compra."}
              </p>
              <Button
                type="button"
                variant="raceSun"
                size="lg"
                className="mt-2 w-full py-3.5"
                onClick={() => setCheckoutNote(true)}
              >
                Finalizar compra
              </Button>
              {checkoutNote ? (
                <Alert className="mt-1 bg-muted">
                  <InfoIcon />
                  <AlertTitle>Demo de checkout</AlertTitle>
                  <AlertDescription>
                    En la versión final este botón llevará al pago seguro con tarjeta, PSE y Nequi.
                  </AlertDescription>
                </Alert>
              ) : null}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
