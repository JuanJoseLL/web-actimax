/**
 * Landings de categoría con URL propia (/productos/geles-energeticos/) en
 * vez de la vista filtrada (/productos/?tipo=geles). Google trata una ruta
 * limpia con texto útil como una página que puede posicionar por "geles
 * energéticos"; una grilla detrás de un query string, no. Cada entrada acá
 * genera su ruta (src/app/productos/<slug>/page.tsx), su canonical desde la
 * vista filtrada, su lugar en el sitemap y el CTA en los posts del blog que
 * hablan del tema. Añadir bebidas o barras es añadir datos, no código.
 *
 * Todas las afirmaciones salen de las descripciones reales de los productos
 * (src/data/catalog.json) y de src/data/faq.ts; nada de cifras inventadas.
 *
 * Sin dependencias de servidor: lo importan el header y la paleta (cliente).
 */
import { normalize } from "../lib/palette-search";
import type { ProductType } from "../lib/taxonomia";
import type { FaqItem } from "./faq";

export interface CategoriaSeccion {
  titulo: string;
  parrafos: string[];
}

/** Un reto con el pack que lo cubre; el enlace se resuelve por handle. */
export interface CategoriaReto {
  reto: string;
  pauta: string;
  handle: string;
}

export interface CategoriaLanding {
  tipo: ProductType;
  /** Ruta canónica, con slash final como todo el sitio. */
  path: string;
  /** H1. */
  nombre: string;
  title: string;
  description: string;
  kicker: string;
  /** Párrafos arriba de la grilla. */
  intro: string[];
  /** Secciones de texto debajo de la grilla. */
  secciones: CategoriaSeccion[];
  /** Guía "cuántos según la distancia", enlazando a los Energy Packs. */
  retos: CategoriaReto[];
  faqs: FaqItem[];
  /** Slugs de posts del blog que profundizan el tema (enlaces internos). */
  articulos: string[];
  /**
   * Palabras que, en el slug o el título de un post, activan el CTA hacia
   * esta categoría. Se comparan como palabras completas y sin tildes.
   */
  palabrasBlog: string[];
}

const GELES: CategoriaLanding = {
  tipo: "geles",
  path: "/productos/geles-energeticos/",
  nombre: "Geles energéticos",
  title: "Geles energéticos con y sin cafeína | Actimax Colombia",
  description:
    "Geles energéticos hechos en Colombia, con y sin cafeína, en caja de 8 geles de 90 g o de 24 sachets de 30 g. Cuándo tomarlos, cuántos llevar por distancia y compra en línea con envío a todo el país.",
  kicker: "Durante el esfuerzo",
  intro: [
    "Un gel energético es carbohidrato de rápida absorción en un sobre individual: se toma durante el esfuerzo para reponer la energía que el músculo va gastando y evitar la pájara. Los geles energéticos Actimax —con y sin cafeína— se fabrican en Envigado, Antioquia, con una mezcla de glucosa y fructosa —energía inmediata y de larga duración—, sabor a fruta, sin colorantes artificiales y libres de gluten y de lácteos.",
    "Vienen con cafeína y sin cafeína, en caja de 8 geles de 90 g con tapa (cada gel rinde 3 porciones) o en caja de 24 sachets de 30 g para llevar uno por toma. Están pensados para running, ciclismo, triatlón, natación de aguas abiertas y cualquier esfuerzo de más de dos horas, y se compran en línea con envío a Bogotá, Medellín, Cali, Barranquilla y el resto de Colombia.",
  ],
  secciones: [
    {
      titulo: "Cuándo tomar un gel energético",
      parrafos: [
        "La pauta de Actimax es un gel cada 30 minutos si estás compitiendo o entrenando a intensidad alta, y uno cada 45 a 60 minutos en un entrenamiento normal. El primero conviene tomarlo antes de sentir fatiga —alrededor del minuto 45 en una carrera— porque el gel repone lo que ya se gastó, no lo que falta por gastar. Siempre con un sorbo de agua.",
        "Con el gel de 90 g lo ideal es destapar, tomar una porción, mantenerla en la boca y tragarla despacio; da para tres tomas. El sachet de 30 g se rompe por la guía de corte y se toma completo. En esfuerzos de más de 90 minutos combina gel y bebida deportiva: un gel y medio litro de bebida por cada hora de entrenamiento. Y la regla de oro: prueba los geles en los entrenos; nunca estrenes nutrición el día de la carrera.",
      ],
    },
    {
      titulo: "Con cafeína o sin cafeína",
      parrafos: [
        "Los geles sin cafeína sirven para cualquier momento del entrenamiento y para estómagos sensibles a los estimulantes. Los geles con cafeína agregan un impulso de alerta y rendimiento, útil en la parte final de una carrera o en jornadas muy largas: el gel de 90 g con cafeína aporta 28,8 mg y el sachet de 30 g, 9,6 mg. Muchos deportistas combinan las dos referencias: sin cafeína al inicio y con cafeína en los kilómetros finales.",
        "Las referencias con cafeína no se recomiendan en menores de 14 años, mujeres en embarazo ni personas sensibles a la cafeína. Los geles energéticos con y sin cafeína son aptos para veganos, salvo la referencia de fresa con cafeína, y son libres de gluten y de lácteos.",
      ],
    },
    {
      titulo: "Presentaciones y sabores",
      parrafos: [
        "La caja de 8 geles de 90 g es la presentación para entrenar: con tapa, para guardar entre tomas. La caja de 24 sachets de 30 g es la de carrera: un sachet por toma, sin cargar peso de más. Los sabores son fresa, manzana, mango y fresa-banano según la referencia, todos con fruta y sin colorantes artificiales.",
        "El Energy Gel es la referencia de alto impacto: energía inmediata y fácil digestión para momentos puntuales de alta intensidad —un puerto, el final de una etapa o carrera, una pájara—, planificado para tomarlo justo antes del tramo más exigente.",
      ],
    },
  ],
  retos: [
    {
      reto: "10K",
      pauta: "Un Energy Gel hacia el kilómetro 5.",
      handle: "energy-pack-de-10k",
    },
    {
      reto: "15K",
      pauta: "Un gel de 30 g y un Energy Gel para el tramo final.",
      handle: "energy-pack-15k",
    },
    {
      reto: "Media maratón 21K",
      pauta: "Dos geles con cafeína de 30 g y un Energy Gel, repartidos cada 30 a 45 minutos.",
      handle: "energy-pack-media-maraton-21k",
    },
    {
      reto: "Maratón 42K",
      pauta: "Cuatro geles de 30 g y dos Energy Gel: la pauta general es entre 3 y 6 geles según el ritmo.",
      handle: "energy-pack-maraton-42k",
    },
    {
      reto: "Gran Fondo de ciclismo",
      pauta: "Dos geles de 90 g, dos Energy Gel y bebida Élite para hidratar durante el fondo.",
      handle: "energy-pack-gran-fondo",
    },
    {
      reto: "Alto de Letras",
      pauta: "Cinco geles de 30 g, tres Energy Gel y seis sobres de bebida Élite.",
      handle: "kit-de-nutricion-alto-de-letras",
    },
    {
      reto: "Triatlón media distancia",
      pauta: "Ocho geles de 30 g, dos Energy Gel y bebida Élite para la bici y la carrera a pie.",
      handle: "energy-pack-actimax-para-triatlon-media-distancia",
    },
  ],
  faqs: [
    {
      question: "¿Qué es un gel energético y para qué sirve?",
      answer:
        "Un gel energético es un suplemento de carbohidratos de rápida absorción, en sobre individual, que repone la energía durante el ejercicio prolongado. Se usa en esfuerzos de más de 60 a 90 minutos —media maratón, maratón, fondos de ciclismo, triatlón— para mantener la glucosa disponible, retrasar la fatiga y evitar la pájara o el muro.",
    },
    {
      question: "¿Cuándo debo tomar un gel energético?",
      answer:
        "Un gel cada 30 minutos si estás compitiendo o entrenando a intensidad alta, y uno cada 45 a 60 minutos si estás entrenando, siempre con un sorbo de agua. El primero se toma antes de sentir fatiga, cerca del minuto 45 de carrera. En una maratón eso equivale a entre 3 y 6 geles según el ritmo.",
    },
    {
      question: "¿Gel con cafeína o sin cafeína: cuál elegir?",
      answer:
        "Los geles sin cafeína sirven para cualquier momento y para estómagos sensibles a los estimulantes. Los geles con cafeína agregan un impulso de alerta y rendimiento para la parte final de la carrera o jornadas muy largas. Actimax ofrece ambas versiones en caja de 8 geles de 90 g y de 24 sachets de 30 g; muchos deportistas combinan: sin cafeína al inicio y con cafeína en los kilómetros finales.",
    },
    {
      question: "¿Los geles energéticos tienen azúcar?",
      answer:
        "Los geles Actimax tienen carbohidratos en forma de glucosa y fructosa: la glucosa es energía inmediata y la fructosa, energía de larga duración, así que el efecto se siente de inmediato y se sostiene por un largo periodo. No llevan colorantes artificiales.",
    },
    {
      question: "¿Tengo que comerme todo el gel de una vez?",
      answer:
        "No con el gel de 90 g: tiene tapa y rinde 3 porciones, así que lo ideal es tomar una porción, saborearla despacio, un buen sorbo de agua y volver a tapar. El sachet de 30 g sí se toma completo de una vez.",
    },
    {
      question: "¿Puedo combinar los geles con las bebidas deportivas Actimax?",
      answer:
        "Sí, y en entrenamientos de más de 90 minutos es lo ideal: el gel aporta el combustible y la bebida los electrolitos y el líquido. La pauta es un gel y medio litro de bebida deportiva Actimax por cada hora de entrenamiento.",
    },
    {
      question: "¿Cuáles son los mejores geles energéticos en Colombia y dónde comprarlos?",
      answer:
        "Actimax es una marca colombiana de nutrición deportiva, con sede en Envigado (Medellín), que fabrica geles energéticos para corredores, ciclistas y triatletas. Al ser producción local ofrecen disponibilidad inmediata, precio competitivo frente a los importados y envío a toda Colombia. Se compran en la tienda oficial actimax.com.co con pago seguro procesado por Shopify.",
    },
  ],
  articulos: [
    "geles-energeticos-guia",
    "geles-energeticos-que-son-como-usarlos-y-cuanto-tomarlos",
    "cuantos-geles-energeticos-necesitas-para-una-media-maraton",
    "gel-energetico-con-cafeina-vs-sin-cafeina-cuando-usar-cada-uno-para-optimizar-tu-rendimiento",
    "como-tomar-geles-sin-malestar-estomacal-estrategia-de-tolerancia-para-atletas",
  ],
  palabrasBlog: ["gel", "geles"],
};

export const CATEGORIAS: CategoriaLanding[] = [GELES];

export function categoriaPorTipo(tipo: ProductType): CategoriaLanding | undefined {
  return CATEGORIAS.find((categoria) => categoria.tipo === tipo);
}

/** Para las rutas: una landing sin datos es un error de programación. */
export function categoriaRequerida(tipo: ProductType): CategoriaLanding {
  const categoria = categoriaPorTipo(tipo);
  if (categoria === undefined) throw new Error(`Falta la categoría ${tipo} en categorias.ts`);
  return categoria;
}

/** Adónde enlazar una categoría: su landing si existe, si no la vista filtrada. */
export function categoriaPath(tipo: ProductType): string {
  return categoriaPorTipo(tipo)?.path ?? `/productos/?tipo=${tipo}`;
}

function palabras(texto: string): Set<string> {
  return new Set(normalize(texto).split(/[^a-z0-9]+/).filter((p) => p !== ""));
}

/** La categoría de la que trata un post, por palabras del slug o del título. */
export function categoriaParaPost(post: { slug: string; title: string }): CategoriaLanding | undefined {
  const vocabulario = palabras(`${post.slug} ${post.title}`);
  return CATEGORIAS.find((categoria) =>
    categoria.palabrasBlog.some((palabra) => vocabulario.has(normalize(palabra))),
  );
}
