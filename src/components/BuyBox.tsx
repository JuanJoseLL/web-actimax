"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { track } from "@vercel/analytics";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BuyNowButton } from "@/components/cart/BuyNowButton";
import type { CartLine } from "@/components/cart/CartProvider";
import { QuantitySelector } from "@/components/QuantitySelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP } from "@/lib/format";
import {
  initialProductVariant,
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
  /** Permite mover el bloque de precio de la página sin duplicarlo mientras migra. */
  showPrice?: boolean;
  /** Barra fija de compra al fondo de la pantalla cuando este bloque sale de vista. */
  stickyBar?: boolean;
}

export function BuyBox({ product, inStock, showPrice = false, stickyBar = false }: BuyBoxProps) {
  const [qty, setQty] = useState(1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [boxVisible, setBoxVisible] = useState(true);

  /* La otra mitad del embudo por producto: junto a agregar_al_carrito
     distingue "nadie lo ve" de "lo ven y nadie lo agrega" — problemas
     opuestos con arreglos opuestos. */
  useEffect(() => {
    track("producto_visto", { producto: product.handle });
  }, [product.handle]);

  useEffect(() => {
    if (!stickyBar) return;
    const box = boxRef.current;
    if (box === null) return;
    const observer = new IntersectionObserver(([entry]) =>
      setBoxVisible(entry.isIntersecting),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, [stickyBar]);
  const variants = product.variants ?? [];
  const [selectedVariant, setSelectedVariant] = useState(() =>
    initialProductVariant(variants),
  );
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

  const showBar = stickyBar && !boxVisible;

  return (
    <div ref={boxRef} className="grid gap-4">
      {showPrice ? (
        <div className="flex items-baseline gap-3" aria-live="polite">
          <p className="font-mono text-3xl font-bold tabular-nums">
            {formatCOP(selectedPrice)}
          </p>
          {selectedRegularPrice > selectedPrice ? (
            <p className="font-mono text-base tabular-nums text-tinta/40 line-through">
              {formatCOP(selectedRegularPrice)}
            </p>
          ) : null}
        </div>
      ) : null}

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

      <p
        aria-live="polite"
        className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
          selectedInStock ? "text-primary" : "text-destructive"
        }`}
      >
        {selectedInStock ? "Disponible" : "Agotado"}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <QuantitySelector value={qty} onChange={setQty} label="cantidad" className="sm:w-36" />
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
        /* Barra fija de compra: en una columna (por debajo de lg) el precio y
           el botón quedan a un scroll completo de las reseñas y el FAQ; la
           barra recupera ese momento de decisión. Se mantiene montada para
           animar la entrada, e `inert` evita tabular sobre botones ocultos. */
        <div
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
