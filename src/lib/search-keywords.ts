/**
 * Sinónimos de búsqueda para la Torre de Control: mucha gente busca
 * "proteína" o "pre entreno" aunque ningún producto lleve esas palabras en
 * el título. Cada producto aporta keywords extra según su tipo y momento
 * para aparecer igual en los resultados.
 */
import type { Momento, ProductType } from "@/lib/taxonomia";

export function searchKeywords(product: {
  type: ProductType | null;
  momentos: Momento[];
}): string[] {
  const keywords: string[] = [];

  if (product.type === "geles") {
    keywords.push("gel energetico", "energia", "carbohidratos");
  }
  if (product.type === "barras") {
    keywords.push("proteina", "protein", "snack");
  }
  if (product.type === "kits") {
    keywords.push("kit", "pack", "combo");
  }
  if (product.type === "bebidas") {
    /* La coincidencia es por subcadena: "hidratacion" no cubre "hidratante"
       ni "hidratarse", que es como la mitad de la gente nombra una bebida. */
    keywords.push("bebida", "hidratacion", "hidratante", "hidratarse");
    if (product.momentos.includes("antes")) {
      keywords.push("pre entreno", "preentreno", "pre-entreno", "pre workout", "energizante");
    }
    if (product.momentos.includes("durante")) {
      keywords.push("electrolitos", "isotonica", "suero");
    }
    if (product.momentos.includes("despues")) {
      keywords.push("proteina", "recovery", "recuperacion", "post entreno");
    }
  }

  return keywords;
}
