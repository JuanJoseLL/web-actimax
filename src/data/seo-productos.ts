/**
 * Título y descripción de las fichas de producto para los buscadores. Por
 * defecto salen del título de Shopify y del primer párrafo de la
 * descripción, que en los geles es el mismo texto en mayúsculas para las
 * cuatro referencias ("EL GEL ENERGÉTICO – ACTIMAX Te garantiza…"): cuatro
 * fichas con la misma descripción compiten entre sí y ninguna dice qué la
 * distingue. Acá cada gel lleva la suya, escrita con los datos de su ficha
 * (cafeína, carbohidratos, presentación, sabores); nada inventado.
 *
 * Sin dependencias de servidor: la usa generateMetadata de la ficha.
 */
import type { Product } from "../lib/taxonomia";

export interface ProductoSeo {
  title: string;
  description: string;
}

export const SEO_PRODUCTOS: Record<string, ProductoSeo> = {
  "gel-energetico-actimax-caja-x8-con-cafeina": {
    title: "Gel energético con cafeína, caja x 8 geles de 90 g | Actimax Colombia",
    description:
      "Gel energético colombiano con 28,8 mg de cafeína y 28 a 30 g de carbohidratos de glucosa y fructosa por gel de 90 g, con tapa y 3 porciones. Sabores fresa, manzana y mango. Envío a toda Colombia.",
  },
  "gel-energetico-actimax-caja-x8": {
    title: "Gel energético sin cafeína, caja x 8 geles de 90 g | Actimax Colombia",
    description:
      "Gel energético colombiano sin cafeína: 29 g de carbohidratos de glucosa y fructosa por gel de 90 g, con tapa y 3 porciones, sabor fresa-banano y sin colorantes artificiales. Envío a toda Colombia.",
  },
  "gl-energetico-actimax-sachets-x24-con-cafeina": {
    title: "Geles energéticos con cafeína, 24 sachets de 30 g | Actimax Colombia",
    description:
      "Caja de 24 geles energéticos en sachet de 30 g con 9,6 mg de cafeína: el gel de carrera para running, ciclismo y triatlón, en sabores fresa, manzana y mango. Hecho en Colombia, envío a todo el país.",
  },
  "gel-energetico-sachets-x24-sin-cafeina": {
    title: "Geles energéticos sin cafeína, 24 sachets de 30 g | Actimax Colombia",
    description:
      "Caja de 24 geles energéticos en sachet de 30 g sin cafeína, sabor fresa-banano, con glucosa y fructosa y sin colorantes artificiales: uno por toma en carrera. Hecho en Colombia, envío a todo el país.",
  },
  "energy-gel-caja-x24": {
    title: "Energy Gel, gel de energía inmediata, caja x 24 | Actimax Colombia",
    description:
      "Energy Gel Actimax: 22 g de glucosa de absorción inmediata, sin cafeína ni azúcares añadidos, para puertos, finales de carrera y pájaras. Sabores kiwi, durazno y cookies and cream. Caja de 24.",
  },
};

export function productoSeo(product: Pick<Product, "handle" | "title" | "excerpt">): ProductoSeo {
  return (
    SEO_PRODUCTOS[product.handle] ?? {
      title: `${product.title} — Actimax`,
      description: product.excerpt,
    }
  );
}
