import type {
  ProductOption,
  ProductOptionValue,
  ProductVariant,
} from "@/lib/taxonomia";

function optionValue(
  options: ProductOptionValue[],
  optionName: string,
): string | undefined {
  return options.find((option) => option.name === optionName)?.value;
}

export function initialProductVariant(
  variants: ProductVariant[],
): ProductVariant | undefined {
  return variants.find((variant) => variant.inStock) ?? variants[0];
}

/** Opciones visibles; Shopify crea `Title: Default Title` en productos simples. */
export function selectableProductOptions(
  options: ProductOption[],
  variants: ProductVariant[],
): ProductOption[] {
  const source =
    options.length > 0
      ? options
      : variants.reduce<ProductOption[]>((result, variant) => {
          for (const selected of variant.options) {
            const existing = result.find((option) => option.name === selected.name);
            if (existing === undefined) {
              result.push({ name: selected.name, values: [selected.value] });
            } else if (!existing.values.includes(selected.value)) {
              existing.values.push(selected.value);
            }
          }
          return result;
        }, []);

  return source.filter((option) => {
    const isDefaultTitle =
      option.name.trim().toLowerCase() === "title" &&
      option.values.every(
        (value) => value.trim().toLowerCase() === "default title",
      );
    return option.values.length > 0 && !isDefaultTitle;
  });
}

/**
 * Aplica una opción sin dejar al selector en una combinación inexistente.
 * Si las demás elecciones no combinan, toma una variante que sí use el valor
 * recién elegido, priorizando una disponible.
 */
export function selectProductVariant(
  variants: ProductVariant[],
  current: ProductVariant | undefined,
  optionName: string,
  value: string,
): ProductVariant | undefined {
  const desired = new Map(
    current?.options.map((option) => [option.name, option.value]) ?? [],
  );
  desired.set(optionName, value);

  const exact = variants.find(
    (variant) =>
      variant.options.length === desired.size &&
      variant.options.every(
        (option) => desired.get(option.name) === option.value,
      ),
  );
  if (exact !== undefined) return exact;

  const matching = variants.filter(
    (variant) => optionValue(variant.options, optionName) === value,
  );
  return initialProductVariant(matching) ?? current ?? initialProductVariant(variants);
}

export function selectedOptionValue(
  variant: ProductVariant | undefined,
  optionName: string,
): string | undefined {
  return variant === undefined
    ? undefined
    : optionValue(variant.options, optionName);
}
