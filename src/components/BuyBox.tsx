"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
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
}

export function BuyBox({ product, inStock, showPrice = false }: BuyBoxProps) {
  const [qty, setQty] = useState(1);
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

  return (
    <div className="grid gap-4">
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
    </div>
  );
}
