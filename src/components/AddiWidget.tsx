"use client";

import { useEffect } from "react";
import { useProductPurchase } from "@/components/ProductPurchase";
import { ADDI_ALLY_SLUG, financiableConAddi } from "@/lib/addi";
import { cn } from "@/lib/utils";

/**
 * "Paga a cuotas con Addi" bajo el botón de compra.
 *
 * Addi entrega un <script> pensado para temas Liquid: lee `window.meta.product`
 * y decide que está en una ficha porque la ruta contiene `/products/`. Aquí no
 * existe ninguna de las dos cosas, así que ese wrapper no sirve. Lo único que
 * hace por dentro es cargar este módulo y montar el custom element, que es lo
 * que hacemos directamente con el precio de la variante elegida.
 */
const MODULO =
  "https://cdn.addi.com/product-details-widget/prod/v1/product-details-widget.esm.js";

function cargarModulo() {
  if (document.querySelector(`script[src="${MODULO}"]`) !== null) return;
  const script = document.createElement("script");
  script.type = "module";
  script.src = MODULO;
  document.head.append(script);
}

export function AddiWidget({
  price,
  className,
}: {
  price: number;
  className?: string;
}) {
  const { selectedVariant } = useProductPurchase();
  const selectedPrice = selectedVariant?.price ?? price;
  const financiable = financiableConAddi(selectedPrice);

  useEffect(() => {
    if (financiable) cargarModulo();
  }, [financiable]);

  if (!financiable) return null;

  return (
    <div className={cn("[&>addi-product-widget]:block", className)}>
      <addi-product-widget
        ally-slug={ADDI_ALLY_SLUG}
        price={selectedPrice}
        country="co"
      />
    </div>
  );
}
