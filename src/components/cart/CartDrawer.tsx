"use client";

import Image from "next/image";
import Link from "next/link";
import { FlagIcon, LoaderCircleIcon, TriangleAlertIcon, Trash2Icon } from "lucide-react";
import { QuantitySelector } from "@/components/QuantitySelector";
import { useCart } from "@/components/cart/CartProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cartLineId } from "@/lib/cart";
import { formatCOP } from "@/lib/format";
import { canonicalProductPath } from "@/lib/product-paths";

function displayVariantTitle(title: string | undefined): string | null {
  if (title === undefined || title.trim().toLowerCase() === "default title") {
    return null;
  }
  return title;
}

function cartLineLabel(title: string, variantTitle: string | undefined): string {
  const variant = displayVariantTitle(variantTitle);
  return variant === null ? title : `${title}, ${variant}`;
}

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
  const {
    items,
    subtotal,
    isOpen,
    close,
    setQty,
    remove,
    checkout,
    isCheckingOut,
    checkoutError,
    clearCheckoutError,
    cedula,
    setCedula,
  } = useCart();

  const handleClose = () => {
    clearCheckoutError();
    close();
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <SheetContent side="right" className="h-dvh w-full max-w-md gap-0 p-0 sm:max-w-md">
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
            <ul className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
              {items.map((item) => (
                <li
                  key={cartLineId(item)}
                  className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 border-b border-dashed border-border py-4"
                >
                  <Link
                    href={canonicalProductPath(item.handle)}
                    onClick={handleClose}
                    className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted"
                  >
                    {item.image !== null ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="64px"
                        className="object-contain p-1.5 mix-blend-multiply"
                      />
                    ) : null}
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</p>
                        {displayVariantTitle(item.variantTitle) !== null ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.variantTitle}
                          </p>
                        ) : null}
                        <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                          {formatCOP(item.price)} c/u
                        </p>
                      </div>
                      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">
                        {formatCOP(item.price * item.qty)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <QuantitySelector
                        value={item.qty}
                        onChange={(qty) => setQty(cartLineId(item), qty)}
                        min={0}
                        label={`cantidad de ${cartLineLabel(item.title, item.variantTitle)}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(cartLineId(item))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Eliminar ${cartLineLabel(item.title, item.variantTitle)}`}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="border-t border-border bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
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
              <div className="mt-2">
                <label
                  htmlFor="cedula-comprador"
                  className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-foreground"
                >
                  Cédula de quien compra
                </label>
                <Input
                  id="cedula-comprador"
                  inputMode="numeric"
                  autoComplete="off"
                  required
                  placeholder="Ej: 1035467890"
                  value={cedula}
                  onChange={(event) => setCedula(event.target.value)}
                  className="mt-1.5 font-mono tabular-nums"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  La necesitamos para tu factura y la guía de envío.
                </p>
              </div>
              <Button
                type="button"
                variant="raceSun"
                size="lg"
                className="mt-2 w-full py-3.5"
                onClick={() => void checkout()}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? <LoaderCircleIcon className="animate-spin" /> : null}
                {isCheckingOut ? "Abriendo pago seguro..." : "Finalizar compra"}
              </Button>
              {checkoutError !== null ? (
                <Alert variant="destructive" className="mt-1">
                  <TriangleAlertIcon />
                  <AlertTitle>No se pudo iniciar el pago</AlertTitle>
                  <AlertDescription>{checkoutError}</AlertDescription>
                </Alert>
              ) : null}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
