"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { TruckIcon } from "lucide-react";
import { track } from "@/lib/track";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import type { CartLine } from "@/components/cart/CartProvider";
import { useProductPurchase } from "@/components/ProductPurchase";
import { QuantitySelector } from "@/components/QuantitySelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP } from "@/lib/format";
import { ENVIO_GRATIS_UMBRAL } from "@/lib/envio";
import {
  selectableProductOptions,
  selectedOptionValue,
  selectProductVariant,
} from "@/lib/product-variants";
import type { ProductOption, ProductVariant } from "@/lib/taxonomia";

interface BuyBoxProduct extends CartLine {
  regularPrice?: number;
  options?: ProductOption[];
  variants?: ProductVariant[];
}

interface BuyBoxProps {
  product: BuyBoxProduct;
  inStock: boolean;
  /** Barra fija de compra al fondo de la pantalla cuando este bloque sale de vista. */
  stickyBar?: boolean;
}

/**
 * Selector de variante, cantidad y botones de compra. El precio grande ya no
 * vive aquí: lo pinta <ProductPrice> junto al H1 leyendo el mismo estado
 * (ProductPurchaseProvider), así que el componente exige ese provider arriba.
 */
export function BuyBox({ product, inStock, stickyBar = false }: BuyBoxProps) {
  const { selectedVariant, setSelectedVariant, qty, setQty } = useProductPurchase();
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const [ctaVisible, setCtaVisible] = useState(true);

  /* La otra mitad del embudo por producto: junto a agregar_al_carrito
     distingue "nadie lo ve" de "lo ven y nadie lo agrega" — problemas
     opuestos con arreglos opuestos. */
  useEffect(() => {
    track("producto_visto", { producto: product.handle });
  }, [product.handle]);

  useEffect(() => {
    if (!stickyBar) return;
    const cta = ctaRef.current;
    if (cta === null) return;
    /* El header pegajoso (~90 px) tapa lo que pasa por debajo: un botón
       escondido detrás de él cuenta como fuera de vista. */
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { rootMargin: "-96px 0px 0px 0px" },
    );
    observer.observe(cta);
    return () => observer.disconnect();
  }, [stickyBar]);
  const variants = product.variants ?? [];
  const options = selectableProductOptions(product.options ?? [], variants);
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedRegularPrice =
    selectedVariant?.regularPrice ?? product.regularPrice ?? product.price;
  const selectedInStock = selectedVariant?.inStock ?? inStock;
  const cartLine: CartLine = {
    variantId: selectedVariant?.id ?? product.variantId,
    variantTitle: selectedVariant?.title,
    handle: product.handle,
    title: product.title,
    price: selectedPrice,
    image: selectedVariant?.image ?? product.image,
  };

  const showBar = stickyBar && !ctaVisible;

  return (
    <div className="grid gap-4">
      {options.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((option, index) => {
            const labelId = `buybox-${product.handle}-${index}`;
            return (
              <div key={option.name} className="grid gap-2">
                <p
                  id={labelId}
                  className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {option.name}
                </p>
                <Select
                  value={selectedOptionValue(selectedVariant, option.name)}
                  onValueChange={(value) =>
                    setSelectedVariant((current) =>
                      selectProductVariant(
                        variants,
                        current,
                        option.name,
                        value,
                      ),
                    )
                  }
                >
                  <SelectTrigger aria-labelledby={labelId} className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {option.values.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-1.5">
        <p
          aria-live="polite"
          className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
            selectedInStock ? "text-primary" : "text-destructive"
          }`}
        >
          {selectedInStock ? "Disponible" : "Agotado"}
        </p>
        <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
          <TruckIcon aria-hidden className="size-4" />
          {selectedPrice * qty >= ENVIO_GRATIS_UMBRAL
            ? "Envío gratis en este pedido"
            : `Envío gratis desde ${formatCOP(ENVIO_GRATIS_UMBRAL)}`}
        </p>
      </div>

      {/* La barra fija vigila esta fila y no el bloque entero: con el
          precio arriba y "qué trae el pack" antes, el botón es lo primero
          que cae bajo el pliegue mientras el bloque sigue "visible". */}
      <div ref={ctaRef} className="flex gap-3">
        <QuantitySelector value={qty} onChange={setQty} label="cantidad" className="shrink-0 sm:w-36" />
        <div className="flex-1">
          <AddToCartButton
            product={cartLine}
            qty={qty}
            variant="full"
            disabled={!selectedInStock}
          />
        </div>
      </div>

      <BuyNowButton product={cartLine} qty={qty} disabled={!selectedInStock} />

      {stickyBar ? (
        /* Barra fija de compra: en una columna (por debajo de lg) el botón
           queda a un scroll completo de las reseñas y el FAQ; la barra
           recupera ese momento de decisión. Se mantiene montada para animar
           la entrada, e `inert` evita tabular sobre botones ocultos. */
        <div
          data-buy-bar
          aria-hidden={!showBar}
          inert={!showBar}
          className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/92 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
            showBar ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex items-center gap-3 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
              {cartLine.image !== null ? (
                <Image
                  src={cartLine.image}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-contain p-1 mix-blend-multiply"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{product.title}</p>
              <div className="flex items-baseline gap-1.5">
                <p className="font-mono text-sm font-bold tabular-nums">
                  {formatCOP(selectedPrice)}
                </p>
                {selectedRegularPrice > selectedPrice ? (
                  <p className="font-mono text-[11px] tabular-nums text-tinta/40 line-through">
                    {formatCOP(selectedRegularPrice)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <AddToCartButton
                product={cartLine}
                qty={qty}
                variant="bar"
                disabled={!selectedInStock}
              />
              <BuyNowButton
                product={cartLine}
                qty={qty}
                variant="bar"
                disabled={!selectedInStock}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
