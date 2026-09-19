import { COMPOSICION_GELES, FORMULAS, PRESENTACIONES, type FormulaNutricional } from "../../data/nutricion";
import retirados from "../../data/retired-products.json";
import { canonicalProductPath } from "../product-paths";
import type { Product, ProductVariant } from "../taxonomia";

export interface ProductoAsesor {
  handle: string;
  title: string;
  path: string;
  image: string | null;
  envase: string;
  gramosEnvase: number;
  porcionesCompletas: number;
  variantes: VarianteAsesor[];
}

export interface VarianteAsesor {
  id: string;
  title: string;
  price: number;
  image: string | null;
  nutricion: FormulaNutricional;
}

function normalizar(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
}

function saborDe(variant: ProductVariant): string {
  const sabor = variant.options.find((option) => /sabor/i.test(option.name));
  const normalized = normalizar(sabor?.value ?? variant.title);
  // Alias de etiquetas comprobadas en Shopify, no coincidencias aproximadas.
  const aliases: Record<string, string> = {
    tuttifruti: "tuttifrutti",
    cookiesandcream: "cookiescream",
    fresabananosincafeina: "fresabanano",
  };
  return aliases[normalized] ?? normalized;
}

/** Une la referencia de nutrición con mercancía real; nunca usa precios locales. */
export function catalogoParaAsesor(products: readonly Product[]): ProductoAsesor[] {
  return products.flatMap((product) => {
    const presentacion = PRESENTACIONES[product.handle];
    if (!presentacion || product.soloEnKit || product.handle in retirados || !product.id.startsWith("gid://shopify/Product/")) return [];
    const formula = FORMULAS[presentacion.formula];
    const variantes = product.variants.flatMap((variant): VarianteAsesor[] => {
      if (!variant.id?.startsWith("gid://shopify/ProductVariant/") || !variant.inStock || !Number.isFinite(variant.price) || variant.price <= 0) return [];
      const sabor = saborDe(variant);
      // Un sabor nuevo o un surtido necesita su propia composición confirmada.
      if (presentacion.sabores.length > 0 && !presentacion.sabores.includes(sabor)) return [];
      const composicion = COMPOSICION_GELES[sabor];
      const nutrientes = presentacion.formula === "gel30"
        ? composicion?.pequeno
        : presentacion.formula === "gel90" ? composicion?.grande : formula.nutrientes;
      if (!nutrientes) return [];
      return [{
        id: variant.id,
        title: variant.title === "Default Title" ? "Única presentación" : variant.title,
        price: variant.price,
        image: variant.image ?? product.images[0] ?? null,
        nutricion: { ...formula, nutrientes },
      }];
    });
    if (variantes.length === 0) return [];
    return [{
      handle: product.handle, title: product.title, path: canonicalProductPath(product.handle),
      image: product.images[0] ?? null, envase: presentacion.envase,
      gramosEnvase: presentacion.gramosEnvase,
      porcionesCompletas: Math.floor(presentacion.gramosEnvase / formula.gramos), variantes,
    }];
  });
}

/** Contexto compacto para los modelos: una fórmula por familia, sin imágenes,
 * HTML, enlaces CDN ni copias de la misma ficha por cada sabor. */
export function evidenciaCatalogo(products: readonly ProductoAsesor[]) {
  const formulas: Record<string, Omit<FormulaNutricional, "nutrientes">> = {};
  const productos = products.map((product) => {
    const formula = product.variantes[0].nutricion;
    formulas[formula.nombre] = {
      nombre: formula.nombre, gramos: formula.gramos, base: formula.base,
      preparacion: formula.preparacion, uso: formula.uso, momentos: formula.momentos,
      ingredientesDeclarados: formula.ingredientesDeclarados, atributos: formula.atributos,
      notas: formula.notas, tabla: formula.tabla,
    };
    return {
      handle: product.handle, title: product.title, envase: product.envase,
      porcionesCompletas: product.porcionesCompletas, formula: formula.nombre,
      variantes: product.variantes.map((variant) => ({
        id: variant.id, title: variant.title, price: variant.price,
        nutrientes: variant.nutricion.nutrientes,
      })),
    };
  });
  return { productos, formulas };
}
