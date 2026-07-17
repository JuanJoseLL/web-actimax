"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { CartLine } from "@/components/cart/CartProvider";
import { QuantitySelector } from "@/components/QuantitySelector";

export function BuyBox({ product, inStock }: { product: CartLine; inStock: boolean }) {
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <QuantitySelector value={qty} onChange={setQty} label="cantidad" className="sm:w-36" />
      <div className="flex-1">
        <AddToCartButton product={product} qty={qty} variant="full" disabled={!inStock} />
      </div>
    </div>
  );
}
