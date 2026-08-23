"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { formatCOP } from "@/lib/format";
import { initialProductVariant } from "@/lib/product-variants";
import type { ProductVariant } from "@/lib/taxonomia";
import { cn } from "@/lib/utils";

/**
 * Estado de compra de la ficha (variante elegida y cantidad), compartido
 * entre el precio del encabezado y el BuyBox.
 *
 * En móvil el precio va arriba, junto al H1, y el selector de variante queda
 * más abajo, tras la galería: dos componentes cliente separados por HTML de
 * servidor. Sin este contexto, cambiar la variante dejaría un precio viejo
 * en pantalla.
 */
interface ProductPurchaseState {
  selectedVariant: ProductVariant | undefined;
  setSelectedVariant: Dispatch<SetStateAction<ProductVariant | undefined>>;
  qty: number;
  setQty: Dispatch<SetStateAction<number>>;
}

const ProductPurchaseContext = createContext<ProductPurchaseState | null>(null);

export function ProductPurchaseProvider({
  variants,
  children,
}: {
  variants: ProductVariant[];
  children: ReactNode;
}) {
  const [selectedVariant, setSelectedVariant] = useState(() =>
    initialProductVariant(variants),
  );
  const [qty, setQty] = useState(1);
  return (
    <ProductPurchaseContext.Provider
      value={{ selectedVariant, setSelectedVariant, qty, setQty }}
    >
      {children}
    </ProductPurchaseContext.Provider>
  );
}

export function useProductPurchase(): ProductPurchaseState {
  const state = useContext(ProductPurchaseContext);
  if (state === null) {
    throw new Error("useProductPurchase necesita un <ProductPurchaseProvider> arriba.");
  }
  return state;
}

/** Precio de la variante elegida, con el precio regular tachado si hay rebaja. */
export function ProductPrice({
  price,
  regularPrice,
  className,
}: {
  price: number;
  regularPrice: number;
  className?: string;
}) {
  const { selectedVariant } = useProductPurchase();
  const selectedPrice = selectedVariant?.price ?? price;
  const selectedRegularPrice = selectedVariant?.regularPrice ?? regularPrice;
  return (
    <div aria-live="polite" className={cn("flex items-baseline gap-2.5", className)}>
      <p className="font-mono text-2xl font-bold tabular-nums sm:text-3xl">
        {formatCOP(selectedPrice)}
      </p>
      {selectedRegularPrice > selectedPrice ? (
        <p className="font-mono text-sm tabular-nums text-tinta/40 line-through sm:text-base">
          {formatCOP(selectedRegularPrice)}
        </p>
      ) : null}
    </div>
  );
}
