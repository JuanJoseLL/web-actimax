"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  selectableProductOptions,
  selectedOptionValue,
  selectProductVariant,
} from "@/lib/product-variants";
import type { ProductOption, ProductVariant } from "@/lib/taxonomia";
import { cn } from "@/lib/utils";

/**
 * Selectores de opción (hoy siempre "Sabores") sobre un conjunto de
 * variantes. Lo comparten la ficha de producto y la sugerencia de envío
 * gratis del carrito: en las dos hay que poder elegir sabor sin salir de
 * donde se está.
 */
export function VariantOptions({
  idPrefix,
  options,
  variants,
  selected,
  onSelect,
  className,
}: {
  /** Prefijo de los id de etiqueta: dos instancias pueden convivir en la página. */
  idPrefix: string;
  options: ProductOption[];
  variants: ProductVariant[];
  selected: ProductVariant | undefined;
  onSelect: (variant: ProductVariant | undefined) => void;
  className?: string;
}) {
  const selectables = selectableProductOptions(options, variants);
  if (selectables.length === 0) return null;

  return (
    <div className={cn("grid gap-3", className)}>
      {selectables.map((option, index) => {
        const labelId = `${idPrefix}-${index}`;
        return (
          <div key={option.name} className="grid gap-2">
            <p
              id={labelId}
              className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {option.name}
            </p>
            <Select
              value={selectedOptionValue(selected, option.name)}
              onValueChange={(value) =>
                onSelect(selectProductVariant(variants, selected, option.name, value))
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
  );
}
