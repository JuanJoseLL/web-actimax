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

/**
 * Lo que comparten todas las landings con URL propia: las de categoría
 * (este archivo) y las de deporte (src/data/deportes.ts). La plantilla
 * (CategoriaLanding.tsx) pinta cualquiera de las dos.
 */
export interface LandingBase {
  /** Ruta canónica, con slash final como todo el sitio. */
  path: string;
  /** Nombre corto: migas, ancla del CTA, sitemap, H1 si no hay titular. */
  nombre: string;
  /** H1 más largo que el nombre cuando la consulta lo pide ("isotónicas e hidratantes"). */
  titular?: string;
  /** Artículo que precede al nombre en las frases que lo mencionan. */
  articulo: "los" | "las" | "el" | "la";
  title: string;
  description: string;
  kicker: string;
  /** Párrafos arriba de la grilla. */
  intro: string[];
  /** Secciones de texto debajo de la grilla. */
  secciones: CategoriaSeccion[];
  /** Guía "cuántos según la distancia", enlazando a los Energy Packs. */
  retos: CategoriaReto[];
  /** Título e intro de esa guía cuando no es "cuántos por distancia". */
  retosTitulo?: string;
  retosIntro?: string;
  faqs: FaqItem[];
  /** Slugs de posts del blog que profundizan el tema (enlaces internos). */
  articulos: string[];
  /**
   * Palabras que, en el slug o el título de un post, activan el CTA hacia
   * esta landing. Se comparan como palabras completas y sin tildes.
   */
  palabrasBlog: string[];
  /**
   * Texto del CTA en los posts: `antes` + enlace con el nombre en minúscula
   * + `despues`. Cada landing lo redacta para que concuerde en género.
   */
  cta: { antes: string; despues: string };
  /**
   * Si está, la FAQ cierra con esta pregunta y una respuesta armada con los
   * precios vigentes de la grilla (para las búsquedas "… precio"), sin
   * escribir cifras que se desactualizan.
   */
  precioPregunta?: string;
  /**
   * Handles que entran en la grilla aunque su etiqueta no coincida (los
   * packs 10K y 15K no llevan deporte en Shopify pero son de running).
   */
  incluir?: string[];
  /**
   * Vitrina fija del bloque de producto del blog (ProductosDelArticulo), por
   * handle y en este orden. Sin ella el bloque ordena por precio como la
   * landing, y eso deja arriba lo más barato: en running, los packs de 10K y
   * 15K. Solo afecta al blog; la grilla de la landing no cambia.
   */
  destacadosBlog?: string[];
}

export interface CategoriaLanding extends LandingBase {
  tipo: ProductType;
}

const GELES: CategoriaLanding = {
  tipo: "geles",
  path: "/productos/geles-energeticos/",
  nombre: "Geles energéticos",
  titular: "Geles energéticos con y sin cafeína",
  articulo: "los",
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
    {
      titulo: "Geles para correr, para ciclismo, triatlón y natación",
      parrafos: [
        "La ficha del producto los recomienda para deportes de largo aliento y resistencia de más de dos horas: ciclismo de fondo y ciclomontañismo, media maratón, maratón y ultramaratón, trail de montaña, triatlón de media y larga distancia y natación de aguas abiertas. Para correr, el sachet de 30 g es el gel de carrera —uno por toma, sin peso de más—; para la bici, el gel de 90 g con tapa va en el jersey o la caramañola y se toma por porciones sin derramarse. En un triatlón se combinan: geles de fruta cada 30 minutos en la bici y en la carrera a pie, y un Energy Gel para arrancar la natación.",
        "Cada deporte tiene su guía con los productos, los packs y la pauta de consumo: nutrición para running, para ciclismo, para triatlón, para natación y para gym. Y si lo que buscas es cuántos geles llevar a una distancia concreta, los Energy Packs de abajo ya los traen contados.",
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
  cta: {
    antes: "Todo lo de este artículo aplica a los",
    despues: "Actimax: hechos en Colombia, con envío a todo el país.",
  },
  precioPregunta: "¿Cuánto cuestan los geles energéticos Actimax?",
};

const BEBIDAS: CategoriaLanding = {
  tipo: "bebidas",
  path: "/productos/bebidas-deportivas/",
  nombre: "Bebidas deportivas",
  titular: "Bebidas deportivas isotónicas e hidratantes",
  articulo: "las",
  title: "Bebidas deportivas isotónicas e hidratantes | Actimax Colombia",
  description:
    "Bebidas deportivas colombianas para antes, durante y después del ejercicio: Élite isotónica con electrolitos, Pre Race para cargar energía y Recovery Pro para recuperar. Envío a toda Colombia.",
  kicker: "Antes, durante y después",
  intro: [
    "Una bebida deportiva isotónica repone lo que se pierde con el sudor —agua y electrolitos— y aporta carbohidratos para que el músculo siga teniendo combustible. Las bebidas deportivas Actimax se fabrican en Envigado, Antioquia, y cubren los tres momentos del esfuerzo: la Bebida Deportiva Élite para hidratar y dar energía durante el entrenamiento o la competencia, Pre Race para cargar energía antes de salir y Recovery Pro para recuperar el músculo después.",
    "Vienen en tarro con cuchara dosificadora o en sobres individuales para llevar en la maleta o en el jersey, y se compran en línea con envío a Bogotá, Medellín, Cali, Barranquilla y el resto de Colombia.",
  ],
  secciones: [
    {
      titulo: "Bebida Élite: hidratación y energía durante el esfuerzo",
      parrafos: [
        "La Élite es la bebida isotónica de Actimax para el durante: una matriz de maltodextrina, dextrosa y fructosa —carbohidratos de rápida asimilación—, electrolitos para la contracción muscular y vitaminas del complejo B. Dos cucharadas o un sachet (30 g) en 500 ml de agua aportan 27,5 g de carbohidratos y 250 mg de sodio; la versión con cafeína suma 55 mg de cafeína para esa chispa de alerta y concentración. Para días muy calientes o largos, la ficha explica cómo subir la dosis a 45 o 60 g por bidón.",
        "La pauta es tomar sorbos de 100 a 125 ml cada 15 minutos. En esfuerzos de más de 60 minutos conviene agregarle al agua electrolitos y carbohidratos, y en salidas de más de 120 minutos la Élite se combina con los geles energéticos: la bebida pone el agua y los electrolitos, el gel el combustible. Sabores naranja, limón, uva y tutti frutti; el tarro de 500 g rinde 16 bidones y el pack de 20 sachets va uno por bidón. La referencia sin cafeína aparece en el catálogo cuando hay existencias.",
      ],
    },
    {
      titulo: "Pre Race: energía antes de entrenar",
      parrafos: [
        "Pre Race se toma de 15 a 30 minutos antes de entrenar o competir: 36 g (dos cucharadas y media o un sobre) en 250 ml de agua, leche, yogurt, jugo o café. Aporta 25 g de carbohidratos de maltodextrina y dextrosa, 6,2 g de proteína, 475 mg de calcio y vitaminas del complejo B para llenar el glucógeno del músculo y salir con ganas, sobre todo en los entrenos de madrugada donde no cae bien comer sólido. No tiene cafeína —si la quieres, mézclalo en café caliente— y no reemplaza ninguna comida principal. Sabores fresa, vainilla y caramelo; el tarro rinde 13 vasos y la caja trae 12 sobres.",
      ],
    },
    {
      titulo: "Recovery Pro: recuperación después",
      parrafos: [
        "Recovery Pro es la bebida de recuperación para después del esfuerzo: 24 g de proteína de alto valor biológico de cuatro fuentes —whey hidrolizado, albúmina de huevo, soya aislada y caseína aislada— con 4.417 mg de BCAA, 8,3 g de carbohidratos y 181 mg de sodio, sin conservantes ni colorantes artificiales. Se prepara con 37 g (dos cucharadas o un sobre) en 250 ml de agua y se toma en los primeros 30 a 40 minutos después de terminar, que es cuando el músculo mejor aprovecha la proteína para reparar fibras y recargar glucógeno. Está pensada para sesiones de más de 90 minutos; sabores vainilla y fresa, en tarro de 400 g (12 vasos) o caja de 12 sobres.",
      ],
    },
  ],
  retosTitulo: "Las bebidas en los Energy Packs",
  retosIntro:
    "Todos los Energy Packs traen un sobre de Pre Race para antes y uno de Recovery Pro para después; los de ciclismo y triatlón suman además la Bebida Élite para la ruta:",
  retos: [
    {
      reto: "Gran Fondo de ciclismo",
      pauta: "Cinco sobres de Bebida Élite, uno por caramañola, además de los geles.",
      handle: "energy-pack-gran-fondo",
    },
    {
      reto: "Alto de Letras",
      pauta: "Seis sobres de Bebida Deportiva Élite para el ascenso.",
      handle: "kit-de-nutricion-alto-de-letras",
    },
    {
      reto: "Triatlón media distancia",
      pauta: "Cuatro sobres de Bebida Élite: uno como hidratación antes de la carrera y dos para la bici.",
      handle: "energy-pack-actimax-para-triatlon-media-distancia",
    },
  ],
  faqs: [
    {
      question: "¿Es mejor hidratarse solo con agua o con una bebida isotónica?",
      answer:
        "Cuando sudamos perdemos agua y también electrolitos, y los dos hacen falta para que el cuerpo y los músculos funcionen bien. Por eso, en actividades de más de 60 minutos, Actimax recomienda incorporar al agua una mezcla de electrolitos y carbohidratos como la de la Bebida Deportiva Élite: el agua permanece más tiempo en el cuerpo y llega energía al músculo.",
    },
    {
      question: "¿Cuándo tomar cada bebida deportiva Actimax?",
      answer:
        "Antes: Pre Race, de 15 a 30 minutos antes de entrenar o competir, para cargar energía. Durante: la Bebida Deportiva Élite, a sorbos de 100 a 125 ml cada 15 minutos, para hidratar y sostener el ritmo. Después: Recovery Pro en los primeros 30 a 40 minutos tras terminar, para reparar el músculo y recargar glucógeno.",
    },
    {
      question: "¿Cómo se prepara la Bebida Deportiva Élite?",
      answer:
        "Dos cucharadas (30 g, con la cuchara dosificadora del tarro) o un sachet de 30 g en 500 ml de agua; se agita y queda lista. Esa porción aporta 27,5 g de carbohidratos y 250 mg de sodio. El tarro de 500 g rinde 16 bidones y el pack trae 20 sachets.",
    },
    {
      question: "¿Las bebidas deportivas Actimax tienen cafeína?",
      answer:
        "La Bebida Deportiva Élite con cafeína aporta 55 mg por porción de 30 g; también existe una referencia sin cafeína, sujeta a disponibilidad. Pre Race no tiene cafeína: si quieres ese extra de alerta antes de entrenar, la ficha sugiere mezclarlo en una taza de café caliente.",
    },
    {
      question: "¿Puedo tomar la bebida deportiva junto con los geles energéticos?",
      answer:
        "Sí, y en entrenamientos de más de 120 minutos es lo ideal: la Bebida Élite aporta agua y electrolitos y el gel el combustible. Los Energy Packs de media maratón y maratón usan justamente esa combinación: un gel cada 30 minutos y 500 ml de Bebida Élite por hora.",
    },
    {
      question: "¿Cuánta proteína tiene Recovery Pro y cuándo se toma?",
      answer:
        "Cada porción de 37 g aporta 24 g de proteína de alto valor biológico —whey hidrolizado, albúmina de huevo, soya aislada y caseína aislada— con 4.417 mg de BCAA. Se toma en los primeros 30 a 40 minutos después de terminar la actividad, en 250 ml de agua, preferiblemente en shaker.",
    },
    {
      question: "¿Dónde comprar bebidas deportivas isotónicas en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, con pago seguro procesado por Shopify y envío a toda Colombia: Bogotá, Medellín, Cali, Barranquilla y el resto del país. Actimax es una marca colombiana con sede en Envigado, Antioquia, lo que significa producto disponible y precio sin sobrecostos de importación.",
    },
  ],
  articulos: [
    "agua-versus-bebida-isotonica-para-correr-cuando-usar-cada-una-segun-tu-entrenamiento",
    "hidratacion-deportiva-para-corredores-estrategia-de-fluidos-y-electrolitos-en-clima-tropical",
    "electrolitos-para-deportistas-de-resistencia-dosificacion-y-estrategia-de-hidratacion",
    "sodio-para-corredores-cuanto-necesitas-segun-la-duracion-e-intensidad-de-tu-carrera",
    "pastilla-electrolitos-vs-bebidas-deportivas",
    "bebida-hidratante-rendimiento",
  ],
  palabrasBlog: [
    "bebida",
    "bebidas",
    "isotonica",
    "isotonicas",
    "hidratacion",
    "hidratante",
    "hidratantes",
    "electrolito",
    "electrolitos",
    "sodio",
  ],
  cta: {
    antes: "Todo lo de este artículo aplica a las",
    despues: "Actimax: hechas en Colombia, con envío a todo el país.",
  },
  precioPregunta: "¿Cuánto cuestan las bebidas deportivas Actimax?",
};

const BARRAS: CategoriaLanding = {
  tipo: "barras",
  path: "/productos/barras-de-proteina/",
  nombre: "Barras de proteína",
  titular: "Barras de proteína para deportistas",
  articulo: "las",
  title: "Barras de proteína para deportistas | Actimax Colombia",
  description:
    "Protein Bar Actimax: barra de proteína con 9,6 g de proteína aislada, miel y maní, hecha en Colombia para antes, durante y después de entrenar. Caja de 18 con envío a todo el país.",
  kicker: "Antes, durante y después",
  intro: [
    "Una barra de proteína es la forma práctica de llevar proteína y carbohidratos al entrenamiento sin depender de un shaker: se guarda en el jersey o en la maleta y se come cuando el cuerpo lo pide. La Protein Bar Actimax se fabrica en Envigado, Antioquia, con nuggets de proteína —esferas crujientes de alta calidad y alta digestibilidad—, miel de abeja y chips de chocolate, en sabor miel-maní.",
    "Está pensada para deportistas de fondo y resistencia —running, ciclismo, triatlón, natación, fútbol y gym—, aficionados o profesionales, y viene en caja de 18 barras con envío a Bogotá, Medellín, Cali, Barranquilla y el resto de Colombia.",
  ],
  secciones: [
    {
      titulo: "Qué trae cada barra",
      parrafos: [
        "Cada Protein Bar aporta 9,6 g de proteína aislada de alto valor biológico, 14 g de carbohidratos, 2,1 g de fibra dietaria, 111 mg de sodio y 29 mg de calcio, además de vitaminas A y D. Es una fuente de aminoácidos esenciales para el mantenimiento, la restauración y la síntesis de proteína del músculo en entrenamientos y competencias de resistencia, y a la vez da energía por sus carbohidratos.",
        "La ficha la define como un complemento nutricional para cubrir las necesidades proteicas de una dieta sana y balanceada del deportista, y como recurso energético del día a día: por eso la presentación es una caja de 18 barras, para tener siempre una en el jersey, en la maleta del gym o en el cajón del escritorio.",
      ],
    },
    {
      titulo: "Cuándo comer una barra de proteína",
      parrafos: [
        "La Protein Bar sirve antes, durante y después. Antes, como complemento para salir con energía; durante, en la mitad de un entrenamiento o una competencia larga, para recargar aminoácidos y glucógeno en el músculo y retrasar el daño muscular y la fatiga; y después, como snack de recuperación: tomada al terminar puede ampliar el suministro de aminoácidos al músculo por más de cuatro horas.",
        "También funciona como snack nutritivo en cualquier momento del día, y la ficha del producto la recomienda incluso para niños. Como con cualquier alimento deportivo, pruébala en los entrenos antes de llevarla a una carrera.",
      ],
    },
    {
      titulo: "Barra, gel o bebida: cuál usar",
      parrafos: [
        "No compiten, se complementan. El gel energético es carbohidrato de absorción rápida para sostener el ritmo cada 30 a 45 minutos; la Bebida Deportiva Élite pone el agua y los electrolitos; la barra aporta proteína y algo de carbohidrato en los esfuerzos largos, donde el cuerpo agradece algo sólido, y al terminar, mientras llega la bebida de recuperación Recovery Pro. En un fondo de ciclismo o un triatlón la combinación típica es bebida en la caramañola, geles en los tramos exigentes y una barra a mitad de ruta.",
      ],
    },
  ],
  retos: [],
  faqs: [
    {
      question: "¿Qué es una barra de proteína y para qué sirve?",
      answer:
        "Es un alimento deportivo sólido que concentra proteína y carbohidratos en un formato fácil de llevar. La Protein Bar Actimax aporta aminoácidos esenciales para mantener, restaurar y sintetizar proteína en el músculo durante entrenamientos y competencias de resistencia, y energía por sus carbohidratos.",
    },
    {
      question: "¿Cuánta proteína tiene la Protein Bar Actimax?",
      answer:
        "9,6 g de proteína aislada de alto valor biológico por barra, con 14 g de carbohidratos, 2,1 g de fibra, 111 mg de sodio, 29 mg de calcio y vitaminas A y D. Lleva miel de abeja y chips de chocolate; el sabor es miel-maní.",
    },
    {
      question: "¿Cuándo debo comer la barra de proteína?",
      answer:
        "Antes del entrenamiento como complemento, durante —en la mitad de un esfuerzo largo, para recargar aminoácidos y glucógeno— o después, como snack de recuperación: consumida al terminar amplía el suministro de aminoácidos al músculo por más de cuatro horas.",
    },
    {
      question: "¿La barra de proteína reemplaza al gel energético?",
      answer:
        "No. El gel es carbohidrato de absorción rápida para sostener el ritmo cada 30 a 45 minutos; la barra aporta proteína y algo de carbohidrato, y es la opción sólida para esfuerzos largos o para después de entrenar. Se combinan: geles en los tramos exigentes y una barra a mitad de ruta o al terminar.",
    },
    {
      question: "¿Los niños o las personas que no compiten pueden comer la Protein Bar?",
      answer:
        "Sí. La ficha del producto la describe como un snack nutritivo y saludable para cualquier momento del día, apto para deportistas aficionados y profesionales y también para niños, como complemento de nutrientes de calidad en su dieta.",
    },
    {
      question: "¿Dónde comprar barras de proteína en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, en caja de 18 barras, con pago seguro procesado por Shopify y envío a toda Colombia: Bogotá, Medellín, Cali, Barranquilla y el resto del país. Actimax es una marca colombiana con sede en Envigado, Antioquia.",
    },
  ],
  articulos: [
    "guia-completa-sobre-las-barras-de-proteina-en-realidad-son-saludables-y-efectivas",
    "proteina-para-corredores-cuando-y-cuanta-consumir-segun-tu-entrenamiento",
    "que-comer-despues-de-entrenar-running-nutricion-practica-para-recuperacion-y-rendimiento",
    "deficiencia-de-proteinas-senales-que-no-consumes-las-suficientes",
  ],
  palabrasBlog: ["barra", "barras", "proteina", "proteinas"],
  cta: {
    antes: "Todo lo de este artículo aplica a las",
    despues: "Actimax: hechas en Colombia, con envío a todo el país.",
  },
};

/**
 * Orden = prioridad del CTA en el blog: un post que mencione geles y
 * bebidas (o proteína) enlaza a geles, la categoría insignia; gana la
 * primera coincidencia.
 */
export const CATEGORIAS: CategoriaLanding[] = [GELES, BEBIDAS, BARRAS];

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

export function palabras(texto: string): Set<string> {
  return new Set(normalize(texto).split(/[^a-z0-9]+/).filter((p) => p !== ""));
}

/**
 * La categoría de la que trata un post, por palabras completas del slug o
 * del título (sin tildes). Si coincide con varias gana la primera de
 * CATEGORIAS (geles antes que bebidas antes que barras).
 */
export function categoriaParaPost(post: { slug: string; title: string }): CategoriaLanding | undefined {
  const vocabulario = palabras(`${post.slug} ${post.title}`);
  return CATEGORIAS.find((categoria) =>
    categoria.palabrasBlog.some((palabra) => vocabulario.has(normalize(palabra))),
  );
}
