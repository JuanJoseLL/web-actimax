/**
 * Landings por deporte con URL propia (/productos/running/, /productos/ciclismo/…).
 * Eran las categorías de WordPress que seguían recibiendo impresiones
 * ("gel para correr", "geles para running", "nutrición ciclismo") y desde el
 * corte eran un 308 a /productos/?deporte=…, una grilla sin texto. Misma
 * plantilla que las categorías (CategoriaLanding.tsx): la grilla de los
 * productos etiquetados con el deporte, el texto que responde la consulta,
 * los packs del deporte con su pauta, FAQ y enlaces al blog.
 *
 * Todas las afirmaciones salen de las descripciones reales de los productos
 * (src/data/catalog.json) y de las landings de categoría ya verificadas; no
 * hay cifras nuevas. Sin dependencias de servidor.
 */
import { CATEGORIAS, palabras, type CategoriaLanding, type LandingBase } from "./categorias";
import { normalize } from "../lib/palette-search";
import type { Product } from "../lib/taxonomia";

export interface DeporteLanding extends LandingBase {
  /** Slug del vocabulario (DEPORTE_LABELS) con el que Shopify etiqueta los productos. */
  deporte: string;
}

/** Cualquier landing con URL propia: la plantilla pinta las dos por igual. */
export type Landing = CategoriaLanding | DeporteLanding;

const ENVIO = "Envío a Bogotá, Medellín, Cali, Barranquilla y el resto de Colombia.";

const RUNNING: DeporteLanding = {
  deporte: "running",
  path: "/productos/running/",
  nombre: "Nutrición para running",
  titular: "Geles y nutrición deportiva para correr",
  articulo: "la",
  title: "Geles y nutrición para correr: 10K, 21K y maratón | Actimax Colombia",
  description:
    "Geles para correr con y sin cafeína, Pre Race, Bebida Élite y Recovery Pro, más Energy Packs con los geles contados para 10K, 15K, 21K y maratón. Hechos en Colombia, envío a todo el país.",
  kicker: "Running",
  intro: [
    "Correr más de una hora gasta las reservas de energía del músculo, y la nutrición para running consiste en reponerlas a tiempo: un gel energético cada 30 minutos en competencia —o cada 45 a 60 en un entreno normal—, el primero antes de sentir fatiga, hacia el minuto 45, y siempre con un sorbo de agua. Los geles para correr de Actimax vienen con y sin cafeína, en sachet de 30 g para llevar uno por toma en carrera o en gel de 90 g con tapa para los fondos de entrenamiento, y se fabrican en Envigado, Antioquia.",
    `Esta guía reúne lo que un corredor necesita antes, durante y después: Pre Race para cargar energía en el desayuno, geles y Bebida Deportiva Élite para el recorrido, Recovery Pro para recuperar en los primeros 30 minutos, y los Energy Packs de 10K, 15K, media maratón y maratón, que traen los geles contados por kilómetro. ${ENVIO}`,
  ],
  secciones: [
    {
      titulo: "Cuántos geles llevar según la distancia",
      parrafos: [
        "La pauta general de Actimax es un gel cada 30 minutos compitiendo y uno cada 45 a 60 minutos entrenando; en una maratón eso equivale a entre 3 y 6 geles según el ritmo. Los Energy Packs lo traducen a kilómetros: en un 10K, un Energy Gel hacia el km 5; en un 15K, un gel de 30 g en el km 7 y un Energy Gel en el km 12; en la media maratón, geles de fruta en los km 7 y 14 y un Energy Gel en el km 19; en la maratón, geles en los km 7, 14, 28 y 35 y Energy Gel en los km 21, 30 y 39. Después de cada gel, un sorbo grande de agua o de la bebida de la carrera.",
        "Para el corredor que va por marca, el Energy Pack 42K Sub 3 cambia la estrategia: un Energy Gel cada 30 minutos y un sorbo de Bebida Élite cada 10, que suman 71,5 g de carbohidratos y 250 mg de sodio por hora.",
      ],
    },
    {
      titulo: "Gel con cafeína o sin cafeína para correr",
      parrafos: [
        "Los geles sin cafeína sirven en cualquier momento y para estómagos sensibles; los geles con cafeína —28,8 mg en el gel de 90 g y 9,6 mg en el sachet de 30 g— dan un impulso de alerta para el tramo final. El Energy Pack de media maratón usa dos geles de 30 g con cafeína y remata con un Energy Gel, la referencia de energía inmediata, sin cafeína y con 22 g de glucosa, pensada para el final de la carrera o para cuando llega la pájara. Prueba cualquier gel en los entrenos antes de llevarlo a una carrera.",
      ],
    },
    {
      titulo: "Antes de correr: Pre Race en el desayuno",
      parrafos: [
        "Todos los packs de running arrancan igual: un sobre de Pre Race disuelto en 250 ml de agua, leche, yogurt, avena, café o jugo, en el desayuno o de 15 a 30 minutos antes de salir. Aporta 25 g de carbohidratos, 6,2 g de proteína, 475 mg de calcio y vitaminas del complejo B para salir con el glucógeno cargado, y no tiene cafeína: si la quieres, mézclalo en café caliente. Es la opción para los entrenos de madrugada, cuando no cae bien comer sólido.",
      ],
    },
    {
      titulo: "Hidratación en carrera",
      parrafos: [
        "El día de la carrera, antes de salir de casa, prepara un sobre de Bebida Élite en 500 ml de agua y ve tomando sorbos hasta terminar el calentamiento: pre-hidrata el músculo y sube las reservas de glucógeno. Durante el recorrido usa todos los puntos de hidratación de la organización, un sorbo de unos 100 ml en cada uno, preferiblemente de bebidas con carbohidratos y electrolitos; el agua también sirve para echártela encima y bajar la temperatura. En los fondos de entrenamiento, la Élite va en tu propio bidón: 30 g en 500 ml aportan 27,5 g de carbohidratos y 250 mg de sodio, a sorbos de 100 a 125 ml cada 15 minutos.",
      ],
    },
    {
      titulo: "Después de correr: recuperar en los primeros 30 minutos",
      parrafos: [
        "Un sobre de Recovery Pro en 250 ml de agua dentro de los primeros 30 minutos tras la meta: 24 g de proteína de cuatro fuentes, 4.417 mg de BCAA y carbohidratos para reparar la fibra y recargar glucógeno. La Protein Bar, con 9,6 g de proteína y sabor miel-maní, es el snack sólido para el bolso de la carrera o para después de un entreno corto.",
      ],
    },
  ],
  retosTitulo: "Energy Packs para correr, por distancia",
  retosIntro:
    "Cada pack trae Pre Race para antes, los geles del recorrido y Recovery Pro para después, con la pauta por kilómetro en la ficha:",
  retos: [
    { reto: "10K", pauta: "Un Energy Gel hacia el kilómetro 5.", handle: "energy-pack-de-10k" },
    {
      reto: "15K",
      pauta: "Un gel de 30 g en el km 7 y un Energy Gel en el km 12.",
      handle: "energy-pack-15k",
    },
    {
      reto: "Media maratón 21K",
      pauta: "Dos geles con cafeína de 30 g en los km 7 y 14 y un Energy Gel en el km 19.",
      handle: "energy-pack-media-maraton-21k",
    },
    {
      reto: "Maratón 42K",
      pauta: "Cuatro geles de 30 g en los km 7, 14, 28 y 35 y Energy Gel en los km 21, 30 y 39.",
      handle: "energy-pack-maraton-42k",
    },
    {
      reto: "Maratón sub 3 horas",
      pauta: "Seis Energy Gel, uno cada 30 minutos, y tres sobres de Bebida Élite a sorbos cada 10 minutos.",
      handle: "energy-pack-42k-sub-3",
    },
  ],
  faqs: [
    {
      question: "¿Qué gel es mejor para correr?",
      answer:
        "Para carrera, el sachet de 30 g: se rompe por la guía de corte, se toma completo con un sorbo de agua y no pesa. Sin cafeína sirve en cualquier momento y para estómagos sensibles; con cafeína (9,6 mg por sachet) conviene para el tramo final. El Energy Gel, con 22 g de glucosa y sin cafeína, es el de energía inmediata para rematar o para salir de una pájara. Para los fondos de entrenamiento, el gel de 90 g con tapa rinde tres porciones.",
    },
    {
      question: "¿Cuántos geles necesito para una media maratón?",
      answer:
        "El Energy Pack Media Maratón 21K lleva dos geles de 30 g con cafeína, para los kilómetros 7 y 14, y un Energy Gel para el kilómetro 19, además de Pre Race para el desayuno y Recovery Pro para después. Es la aplicación de la regla general: un gel cada 30 minutos compitiendo, con un sorbo grande de bebida después de cada uno.",
    },
    {
      question: "¿Cuántos geles necesito para una maratón?",
      answer:
        "Entre 3 y 6 según el ritmo. El Energy Pack Maratón 42K trae cuatro geles de 30 g para los km 7, 14, 28 y 35 y dos Energy Gel para los km 21 y 30 (la ficha sugiere un tercero hacia el km 39). El 42K Sub 3, para quien va por marca, cambia a un Energy Gel cada 30 minutos con Bebida Élite a sorbos cada 10 minutos: 71,5 g de carbohidratos y 250 mg de sodio por hora.",
    },
    {
      question: "¿Qué tomar antes de correr un 10K?",
      answer:
        "Un sobre de Pre Race en el desayuno, disuelto en 250 ml de tu bebida favorita, para cargar energía en el músculo; durante la carrera, un Energy Gel hacia el kilómetro 5 con la hidratación de la organización; y en los primeros 30 minutos después de la meta, un sobre de Recovery Pro. Es exactamente lo que trae el Energy Pack 10K.",
    },
    {
      question: "¿Cómo evitar el muro o la pájara en carrera?",
      answer:
        "Tomando el primer gel antes de sentir fatiga —hacia el minuto 45— y siguiendo cada 30 minutos, porque el gel repone lo que ya se gastó. En esfuerzos de más de 90 minutos combina gel y bebida deportiva: un gel y medio litro de Bebida Élite por hora. El Energy Gel se planifica justo antes del tramo más exigente, no cuando la pájara ya llegó.",
    },
    {
      question: "¿Qué tomar después de correr?",
      answer:
        "Recovery Pro en los primeros 30 a 40 minutos: 37 g (un sobre o dos cucharadas) en 250 ml de agua, con 24 g de proteína de whey hidrolizado, albúmina, soya y caseína, 4.417 mg de BCAA y carbohidratos para recargar glucógeno. Después de un entreno corto, la Protein Bar de 9,6 g de proteína funciona como snack de recuperación.",
    },
    {
      question: "¿Dónde comprar geles para correr en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, con pago seguro procesado por Shopify y envío a toda Colombia. Actimax es una marca colombiana con sede en Envigado, Antioquia: producto disponible, precio sin sobrecostos de importación y packs por distancia armados para las carreras del país.",
    },
  ],
  articulos: [
    "cuantos-geles-energeticos-necesitas-para-una-media-maraton",
    "guia-nutricional-definitiva-para-corredores-de-media-maraton-antes-durante-y-despues",
    "que-comer-antes-de-correr-10k-nutricion-y-timing-para-optimizar-tu-rendimiento",
    "el-muro-en-la-maraton-que-es-y-como-prevenirlo",
    "hidratacion-estrategica-para-correr-21k-guia-practica-para-media-maraton",
    "tips-para-correr-la-maraton",
    "nutricion-deportiva-para-corredores-principiantes-plan-practico-de-alimentacion-e-hidratacion",
  ],
  palabrasBlog: [
    "running",
    "correr",
    "corredor",
    "corredores",
    "corredora",
    "corredoras",
    "maraton",
    "maratones",
    "10k",
    "15k",
    "21k",
    "42k",
  ],
  cta: {
    antes: "¿Corres? Toda la",
    despues: "está en un solo lugar: geles, bebidas y Energy Packs por distancia, hechos en Colombia.",
  },
  precioPregunta: "¿Cuánto cuestan los geles y los Energy Packs para correr?",
  incluir: ["energy-pack-de-10k", "energy-pack-15k"],
};

const CICLISMO: DeporteLanding = {
  deporte: "ciclismo",
  path: "/productos/ciclismo/",
  nombre: "Nutrición para ciclismo",
  titular: "Geles y nutrición deportiva para ciclismo",
  articulo: "la",
  title: "Geles y nutrición para ciclismo: fondos y puertos | Actimax Colombia",
  description:
    "Nutrición para ciclismo hecha en Colombia: gel de 90 g con tapa para el jersey, Energy Gel para los puertos, Bebida Élite por caramañola y los packs de Gran Fondo y Alto de Letras.",
  kicker: "Ciclismo",
  intro: [
    "En la bici la nutrición se mide por hora: una caramañola de Bebida Deportiva Élite por hora de ruta y una porción de gel cada 45 minutos en un fondo, con los Energy Gel reservados para los premios de montaña, las cronos y los finales de etapa. Los geles para ciclismo de Actimax se fabrican en Envigado, Antioquia, con glucosa y fructosa —energía inmediata y de larga duración—, y el formato de 90 g con tapa se pensó para el jersey: se toma una porción, se vuelve a tapar y no se derrama.",
    `Esta guía junta lo que un ciclista lleva antes, durante y después de rodar —Pre Race, geles, Bebida Élite, Recovery Pro y Protein Bar— y los dos packs armados para las rutas del país: el Energy Pack Gran Fondo y el Kit de nutrición Alto de Letras. ${ENVIO}`,
  ],
  secciones: [
    {
      titulo: "El gel de 90 g con tapa: hecho para el jersey",
      parrafos: [
        "Cada gel de 90 g rinde tres porciones: giras la tapa, tomas una, un sorbo de agua y vuelves a tapar, sin que se derrame ni arruine la ropa. Aporta entre 28 y 30 g de carbohidratos de glucosa y fructosa, con sabor a fruta —fresa, manzana o mango— y sin colorantes artificiales; la versión con cafeína suma 28,8 mg por gel. Si prefieres una toma completa por sobre, la caja de 24 sachets de 30 g va uno por toma, con o sin cafeína.",
      ],
    },
    {
      titulo: "Cuánto comer y beber por hora en la bici",
      parrafos: [
        "La pauta del Energy Pack Gran Fondo es la referencia: una porción de gel cada 45 minutos y un Energy Gel —22 g de glucosa, energía inmediata y fácil digestión, con 80 a 150 ml de agua— planificado justo antes de los kilómetros más retadores, los premios de montaña o una crono. En la caramañola, un sobre de Bebida Élite en 500 ml de agua por hora: 27,5 g de carbohidratos, 250 mg de sodio y vitaminas del complejo B, a sorbos de 100 a 125 ml cada 15 minutos; la versión con cafeína aporta 55 mg. Para días muy calientes o rutas muy largas, la ficha explica cómo subir la dosis a 45 o 60 g por bidón.",
        "El Kit de nutrición Alto de Letras lleva esa lógica al ascenso más largo del país: seis sobres de Bebida Élite, cinco geles de 30 g, tres Energy Gel, Pre Race para el desayuno y Recovery Pro para la cima.",
      ],
    },
    {
      titulo: "Ciclomontañismo y salidas largas",
      parrafos: [
        "La ficha de los geles los recomienda para ciclismo de fondo y ciclomontañismo de más de dos horas. En esfuerzos de más de 90 minutos la regla es combinar gel y bebida —un gel y medio litro de Bebida Élite por hora—, y en un fondo la combinación típica es bebida en la caramañola, geles en los tramos exigentes y una Protein Bar a mitad de ruta: 9,6 g de proteína y 14 g de carbohidratos en formato sólido, cuando el cuerpo agradece masticar algo.",
      ],
    },
    {
      titulo: "Antes y después de rodar",
      parrafos: [
        "Antes, un sobre de Pre Race en el desayuno, en 250 ml de agua, leche, yogurt, avena, café o jugo: 25 g de carbohidratos y 6,2 g de proteína para salir con el glucógeno cargado, sin cafeína. Después, de vuelta a la calma, un sobre de Recovery Pro en 250 ml de agua: 24 g de proteína de cuatro fuentes y 4.417 mg de BCAA para recuperar el músculo, reponer glucógeno y rehidratar. Y si ruedas en Antioquia, el club Actimax Ciclismo en Strava organiza rodadas y comparte rutas.",
      ],
    },
  ],
  retosTitulo: "Energy Packs para ciclismo",
  retosIntro:
    "Los dos packs de ruta traen la bebida por caramañola, los geles, los Energy Gel del puerto, Pre Race y Recovery Pro:",
  retos: [
    {
      reto: "Gran Fondo",
      pauta:
        "Dos geles de 90 g (una porción cada 45 minutos), dos Energy Gel para los premios de montaña y cinco sobres de Bebida Élite, uno por caramañola y por hora.",
      handle: "energy-pack-gran-fondo",
    },
    {
      reto: "Alto de Letras",
      pauta: "Cinco geles de 30 g, tres Energy Gel y seis sobres de Bebida Élite para el ascenso.",
      handle: "kit-de-nutricion-alto-de-letras",
    },
  ],
  faqs: [
    {
      question: "¿Qué gel es mejor para ciclismo?",
      answer:
        "El gel de 90 g con tapa: rinde tres porciones, se toma una cada 45 minutos y se vuelve a tapar sin derramarse en el jersey. Viene con cafeína (28,8 mg) o sin cafeína, en sabores fresa, manzana y mango. El Energy Gel, de 22 g de glucosa y energía inmediata, es el que se planifica para los puertos, las cronos y los finales de etapa.",
    },
    {
      question: "¿Cuántos geles llevo a un gran fondo?",
      answer:
        "El Energy Pack Gran Fondo trae dos geles de 90 g —una porción cada 45 minutos—, dos Energy Gel para los kilómetros más retadores y cinco sobres de Bebida Élite, uno por caramañola y por hora, además de Pre Race para el desayuno y Recovery Pro para después. Para una ruta más larga, la pauta escala por hora.",
    },
    {
      question: "¿Qué tomar para subir el Alto de Letras?",
      answer:
        "El Kit de nutrición Alto de Letras: seis sobres de Bebida Deportiva Élite, cinco geles de 30 g, tres Energy Gel, un sobre de Pre Race y uno de Recovery Pro. La bebida va una por hora en la caramañola, los geles cada 30 a 45 minutos y los Energy Gel justo antes de los tramos más duros del ascenso.",
    },
    {
      question: "¿Cuánta bebida necesito por hora en la bici?",
      answer:
        "Una caramañola por hora: un sobre o dos cucharadas (30 g) de Bebida Élite en 500 ml de agua, que aportan 27,5 g de carbohidratos y 250 mg de sodio, a sorbos de 100 a 125 ml cada 15 minutos. En días muy calientes o rutas muy largas la ficha indica cómo subir la dosis a 45 o 60 g por bidón.",
    },
    {
      question: "¿Gel con cafeína o sin cafeína para rodar?",
      answer:
        "Sin cafeína para cualquier momento de la ruta y para estómagos sensibles; con cafeína —28,8 mg por gel de 90 g, 9,6 mg por sachet de 30 g— para la parte final o las jornadas muy largas. La Bebida Élite con cafeína suma 55 mg por caramañola, así que conviene contar el total del día si combinas las dos.",
    },
    {
      question: "¿Dónde comprar geles para ciclismo en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, con pago seguro procesado por Shopify y envío a toda Colombia. Actimax es una marca colombiana con sede en Envigado, Antioquia, con packs armados para las rutas del país como el Gran Fondo y el Alto de Letras.",
    },
  ],
  articulos: [
    "nutricion-para-ciclismo-de-ruta-estrategia-de-alimentacion-para-rendimiento-y-recuperacion",
    "consejos-gran-fondo-en-ciclismo",
    "tips-de-nutricion-para-subir-al-alto-de-letras-en-bicicleta",
    "ciclismo-de-ruta-consejos-para-ciclistas-principiantes",
    "rutas-para-todo-ciclista-medellin-antioquia",
    "calendario-de-carreras-de-ciclismo-y-gran-fondo-2025-2026",
  ],
  palabrasBlog: ["ciclismo", "ciclista", "ciclistas", "bicicleta", "bici", "mtb", "rodada", "rodadas"],
  cta: {
    antes: "¿Ruedas? Toda la",
    despues:
      "está en un solo lugar: geles de 90 g con tapa, bebida por caramañola y packs de ruta, hechos en Colombia.",
  },
  precioPregunta: "¿Cuánto cuestan los geles y los packs para ciclismo?",
};

const TRIATLON: DeporteLanding = {
  deporte: "triatlon",
  path: "/productos/triatlon/",
  nombre: "Nutrición para triatlón",
  titular: "Nutrición deportiva para triatlón",
  articulo: "la",
  title: "Nutrición para triatlón: natación, bici y carrera | Actimax Colombia",
  description:
    "Geles, Bebida Élite, Pre Race y Recovery Pro para las tres disciplinas, y el Energy Pack de triatlón media distancia con 8 geles, 2 Energy Gel y 4 sobres de Élite ya contados. Hecho en Colombia.",
  kicker: "Triatlón",
  intro: [
    "Un triatlón encadena tres disciplinas y la nutrición tiene que seguir el mismo orden: cargar antes de la natación, comer y beber sobre la bici —donde más tiempo y más ocasión hay— y sostener la carrera a pie con lo que el estómago ya tolera. Los geles y bebidas de Actimax están pensados para esfuerzos de más de dos horas, triatlón de media y larga distancia incluidos, y se fabrican en Envigado, Antioquia.",
    `Esta guía sigue la pauta del Energy Pack Actimax para Triatlón Media Distancia —Pre Race, cuatro sobres de Bebida Élite, ocho geles de 30 g, dos Energy Gel y Recovery Pro— y sirve de referencia para cualquier distancia. ${ENVIO}`,
  ],
  secciones: [
    {
      titulo: "Antes de la salida y en la natación",
      parrafos: [
        "En el desayuno, un sobre de Pre Race en 250 ml de tu bebida preferida para cargar energía en el músculo: 25 g de carbohidratos, 6,2 g de proteína y sin cafeína. Antes de la carrera, un sobre de Bebida Élite en 500 ml de agua como hidratación previa. Y para iniciar el calentamiento de natación, un Energy Gel con 80 ml de agua: 22 g de glucosa, energía inmediata y fácil digestión, sin cafeína, para entrar al agua con combustible sin nada pesado en el estómago.",
      ],
    },
    {
      titulo: "En la bici: donde se come",
      parrafos: [
        "Después de la primera hora sobre la bici, un gel de 30 g cada 30 minutos con sorbos de agua para una absorción más rápida —cuatro geles en la media distancia—, y dos sobres de Bebida Élite, cada uno en 500 ml de agua, para reponer electrolitos durante el recorrido: 27,5 g de carbohidratos y 250 mg de sodio por caramañola. El sachet de 30 g se toma completo, con o sin cafeína (9,6 mg por sachet); muchos triatletas van sin cafeína en la bici y la reservan para la carrera a pie.",
      ],
    },
    {
      titulo: "Carrera a pie: sostener el ritmo",
      parrafos: [
        "Otros cuatro geles de 30 g, uno cada 30 minutos con sorbos de agua, usando los puntos de hidratación de la organización. El segundo Energy Gel del pack queda para el remate o para un momento de debilidad: se planifica antes del tramo más exigente, no cuando la pájara ya llegó. Como en cualquier carrera, el primer gel va antes de sentir fatiga.",
      ],
    },
    {
      titulo: "Después de la meta",
      parrafos: [
        "En los primeros 30 minutos, un sobre de Recovery Pro en 250 ml de agua —24 g de proteína de cuatro fuentes y 4.417 mg de BCAA— para una recuperación más rápida y efectiva, y después un sobre de Bebida Élite en 500 ml de agua para rehidratar. La Protein Bar, con 9,6 g de proteína, es el snack sólido para la bolsa de transición o el viaje de vuelta.",
      ],
    },
    {
      titulo: "Prueba todo en los entrenos",
      parrafos: [
        "La regla de oro de Actimax vale el doble en triatlón: nunca estrenes nutrición el día de la carrera. Usa las sesiones largas de bici y los ladrillos para probar el gel cada 30 minutos, la bebida en la caramañola y el Energy Gel antes de nadar. Para entrenar, el gel de 90 g con tapa rinde tres porciones y sale más práctico que el sachet.",
      ],
    },
  ],
  retosTitulo: "El Energy Pack de triatlón",
  retosIntro: "El pack de media distancia trae todo lo de esta guía contado por disciplina:",
  retos: [
    {
      reto: "Triatlón media distancia",
      pauta:
        "Un Energy Gel para arrancar la natación, cuatro geles de 30 g y dos sobres de Élite en la bici, cuatro geles en la carrera a pie, Pre Race antes y Recovery Pro después.",
      handle: "energy-pack-actimax-para-triatlon-media-distancia",
    },
  ],
  faqs: [
    {
      question: "¿Cuántos geles necesito para un triatlón de media distancia?",
      answer:
        "El Energy Pack Actimax para Triatlón Media Distancia trae ocho geles de 30 g —cuatro para la bici, después de la primera hora y cada 30 minutos, y cuatro para la carrera a pie, uno cada 30 minutos— más dos Energy Gel: uno para iniciar la natación y otro para el remate. Completan el pack un sobre de Pre Race, cuatro de Bebida Élite y uno de Recovery Pro.",
    },
    {
      question: "¿Se puede tomar un gel antes de nadar?",
      answer:
        "Sí. La pauta del pack de triatlón es un Energy Gel con 80 ml de agua justo para iniciar el calentamiento de natación: 22 g de glucosa de absorción inmediata, sin cafeína y de fácil digestión, así entras al agua con energía disponible sin nada pesado en el estómago. El desayuno con Pre Race va antes, en casa.",
    },
    {
      question: "¿Qué tomo en el segmento de bici?",
      answer:
        "Dos sobres de Bebida Élite, cada uno en 500 ml de agua, para reponer electrolitos durante el recorrido, y a partir de la primera hora un gel de 30 g cada 30 minutos con sorbos de agua. La bici es el segmento donde más fácil se come: ahí se hace la mayor parte de la carga de carbohidratos del día.",
    },
    {
      question: "¿Gel con cafeína o sin cafeína en triatlón?",
      answer:
        "Sin cafeína sirve en cualquier segmento y para estómagos sensibles; con cafeína (9,6 mg por sachet de 30 g) da un impulso de alerta útil en la parte final. Una combinación habitual es bici sin cafeína y carrera a pie con cafeína. Los Energy Gel no llevan cafeína.",
    },
    {
      question: "¿Qué tomar después de un triatlón?",
      answer:
        "Un sobre de Recovery Pro en 250 ml de agua en los primeros 30 minutos —24 g de proteína y 4.417 mg de BCAA— y después un sobre de Bebida Élite en 500 ml de agua para rehidratar. Es el cierre que trae el pack de media distancia.",
    },
    {
      question: "¿Dónde comprar nutrición para triatlón en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, con pago seguro procesado por Shopify y envío a toda Colombia. Actimax es una marca colombiana con sede en Envigado, Antioquia, y el Energy Pack de triatlón media distancia se arma aquí con los mismos geles y bebidas que se venden por separado.",
    },
  ],
  articulos: [
    "triatlon-media-distancia-deportes-y-preparacion-nutricional",
    "las-10-mejores-tecnicas-de-carrera-para-un-triatleta",
    "calendario-de-competencias-de-triatlon-colombia",
    "diccionario-de-nutricion-deportiva-para-corredores-ciclistas-y-triatletas",
  ],
  palabrasBlog: ["triatlon", "triatleta", "triatletas", "ironman"],
  cta: {
    antes: "¿Haces triatlón? Toda la",
    despues:
      "—natación, bici y carrera a pie— está en un solo lugar, con el pack de media distancia ya contado.",
  },
  precioPregunta: "¿Cuánto cuesta la nutrición para un triatlón?",
};

const NATACION: DeporteLanding = {
  deporte: "natacion",
  path: "/productos/natacion/",
  nombre: "Nutrición para natación",
  titular: "Nutrición deportiva para natación y aguas abiertas",
  articulo: "la",
  title: "Nutrición para natación y aguas abiertas | Actimax Colombia",
  description:
    "Geles en sachet de 30 g, Energy Gel para arrancar, Bebida Élite para el borde de la piscina y Recovery Pro para después: nutrición deportiva para nadadores y aguas abiertas, hecha en Colombia.",
  kicker: "Natación",
  intro: [
    "Nadar no evita el gasto de energía ni la pérdida de líquido: una sesión larga de piscina o una travesía de aguas abiertas es un esfuerzo de resistencia como cualquier otro, y la ficha de los geles Actimax incluye la natación de aguas abiertas entre los deportes de más de dos horas para los que están hechos. La diferencia está en la logística —no hay bolsillos ni caramañola— y por eso esta guía se centra en qué tomar antes de entrar al agua, qué dejar en el borde y qué tomar al salir.",
    `Los productos se fabrican en Envigado, Antioquia, sin colorantes artificiales, y se compran en línea. ${ENVIO} Si tu natación es la primera disciplina de un triatlón, la guía de triatlón sigue el orden completo.`,
  ],
  secciones: [
    {
      titulo: "Antes de entrar al agua",
      parrafos: [
        "Para las sesiones de madrugada, cuando no cae bien comer sólido, un sobre de Pre Race de 15 a 30 minutos antes: 36 g en 250 ml de agua, leche, yogurt, jugo o café, con 25 g de carbohidratos, 6,2 g de proteína y 475 mg de calcio, sin cafeína. Y para iniciar el calentamiento, la pauta que Actimax usa en triatlón: un Energy Gel con 80 ml de agua, 22 g de glucosa de energía inmediata y fácil digestión, para entrar al agua con combustible y nada pesado en el estómago.",
      ],
    },
    {
      titulo: "Durante: sachets en el borde y bebida entre series",
      parrafos: [
        "En sesiones largas, un gel de 30 g cada 30 a 45 minutos: el sachet se rompe por la guía de corte, se toma completo con un sorbo de agua y cabe en cualquier bolsillo del maletín o del kayak de apoyo en aguas abiertas. Entre series, la Bebida Deportiva Élite en un bidón en el borde: 30 g en 500 ml de agua aportan 27,5 g de carbohidratos, 250 mg de sodio y vitaminas del complejo B, a sorbos de 100 a 125 ml cada 15 minutos. La regla de más de 90 minutos aplica igual: gel para el combustible, bebida para el agua y los electrolitos.",
      ],
    },
    {
      titulo: "Con cafeína o sin cafeína",
      parrafos: [
        "Los geles sin cafeína sirven a cualquier hora y para estómagos sensibles; los que llevan cafeína —9,6 mg por sachet de 30 g y 28,8 mg por gel de 90 g— dan un impulso de alerta para la parte final de una travesía larga. La Bebida Élite también existe con cafeína, 55 mg por porción. Como en cualquier deporte, prueba la combinación en los entrenos antes de una competencia.",
      ],
    },
    {
      titulo: "Después de nadar",
      parrafos: [
        "En los primeros 30 a 40 minutos, un sobre de Recovery Pro en 250 ml de agua: 24 g de proteína de whey hidrolizado, albúmina, soya y caseína, con 4.417 mg de BCAA y 8,3 g de carbohidratos, pensada para sesiones de más de 90 minutos. Para la maleta, la Protein Bar de 9,6 g de proteína y sabor miel-maní es el snack que no necesita shaker.",
      ],
    },
  ],
  retosTitulo: "El pack que arranca nadando",
  retosIntro:
    "El único Energy Pack con tramo de natación es el de triatlón; su pauta sirve de referencia para una travesía:",
  retos: [
    {
      reto: "Triatlón media distancia",
      pauta: "Un Energy Gel con 80 ml de agua para arrancar la natación; el resto del pack cubre la bici y la carrera.",
      handle: "energy-pack-actimax-para-triatlon-media-distancia",
    },
  ],
  faqs: [
    {
      question: "¿Se pueden tomar geles energéticos en natación?",
      answer:
        "Sí. La ficha de los geles Actimax incluye la natación de aguas abiertas entre los deportes de resistencia de más de dos horas para los que están diseñados. El formato práctico es el sachet de 30 g: se toma completo con un sorbo de agua en el borde de la piscina o en un avituallamiento, cada 30 a 45 minutos en sesiones largas.",
    },
    {
      question: "¿Qué tomo antes de nadar en la mañana?",
      answer:
        "Un sobre de Pre Race de 15 a 30 minutos antes, disuelto en 250 ml de agua, leche, yogurt, jugo o café: 25 g de carbohidratos y 6,2 g de proteína para llenar el glucógeno cuando no cae bien comer sólido, sin cafeína. Para arrancar el calentamiento, un Energy Gel con 80 ml de agua, como en la pauta de triatlón.",
    },
    {
      question: "¿Cómo hidratarse en la piscina?",
      answer:
        "Con un bidón de Bebida Deportiva Élite en el borde: 30 g en 500 ml de agua, a sorbos de 100 a 125 ml entre series, cada 15 minutos. Aporta 27,5 g de carbohidratos y 250 mg de sodio; en sesiones de más de 60 minutos, esa mezcla de electrolitos y carbohidratos hace que el agua permanezca más tiempo en el cuerpo.",
    },
    {
      question: "¿Gel con cafeína para nadar?",
      answer:
        "Sin cafeína sirve a cualquier hora; con cafeína —9,6 mg por sachet, 28,8 mg por gel de 90 g— conviene para la parte final de una travesía larga. La Bebida Élite con cafeína aporta 55 mg por porción. Pruébalo en entrenos antes de llevarlo a una competencia.",
    },
    {
      question: "¿Qué tomar después de nadar?",
      answer:
        "Recovery Pro en los primeros 30 a 40 minutos: 37 g en 250 ml de agua, con 24 g de proteína de cuatro fuentes y 4.417 mg de BCAA para reparar el músculo y recargar glucógeno. Después de un entreno corto, la Protein Bar de 9,6 g de proteína funciona como snack de recuperación.",
    },
    {
      question: "¿Dónde comprar nutrición deportiva para natación en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, con pago seguro procesado por Shopify y envío a toda Colombia. Actimax es una marca colombiana con sede en Envigado, Antioquia; los mismos geles, bebidas y barras sirven para piscina, aguas abiertas y triatlón.",
    },
  ],
  articulos: [
    "triatlon-media-distancia-deportes-y-preparacion-nutricional",
    "geles-energeticos-que-son-como-usarlos-y-cuanto-tomarlos",
    "como-tomar-geles-sin-malestar-estomacal-estrategia-de-tolerancia-para-atletas",
    "diccionario-de-nutricion-deportiva-para-corredores-ciclistas-y-triatletas",
  ],
  palabrasBlog: ["natacion", "nadar", "nadador", "nadadores", "nadadora", "nadadoras", "piscina"],
  cta: {
    antes: "¿Nadas? Toda la",
    despues:
      "está en un solo lugar: geles en sachet, bebida para el borde y recuperación para después, hechos en Colombia.",
  },
  precioPregunta: "¿Cuánto cuesta la nutrición deportiva para natación?",
};

const GYM: DeporteLanding = {
  deporte: "gym",
  path: "/productos/gym/",
  nombre: "Nutrición para gym",
  titular: "Nutrición deportiva para gym y entrenamiento de fuerza",
  articulo: "la",
  title: "Nutrición para gym: pre entreno, proteína y recuperación | Actimax",
  description:
    "Pre Race como pre entreno sin cafeína, Bebida Élite para la sesión, Recovery Pro con 24 g de proteína y Protein Bar de 9,6 g para el snack: nutrición para gym hecha en Colombia.",
  kicker: "Gym",
  intro: [
    "El esquema de Actimax —antes, durante y después— aplica igual en el gimnasio que en la carretera: cargar energía antes de la sesión, hidratar y sostener el ritmo durante, y darle al músculo proteína en los primeros 30 a 40 minutos después, que es cuando mejor la aprovecha. Los productos se fabrican en Envigado, Antioquia, y no llevan colorantes artificiales.",
    `Esta guía ordena la nutrición para gym con los cuatro productos que más se usan en fuerza y entrenamiento funcional: Pre Race como pre entreno, la Bebida Deportiva Élite para la sesión, Recovery Pro como bebida de recuperación y la Protein Bar para el snack de la maleta. ${ENVIO}`,
  ],
  secciones: [
    {
      titulo: "Pre entreno: Pre Race 15 a 30 minutos antes",
      parrafos: [
        "Pre Race se toma de 15 a 30 minutos antes de entrenar: 36 g —dos cucharadas y media o un sobre— en 250 ml de agua, leche, yogurt, jugo o café. Aporta 25 g de carbohidratos de maltodextrina y dextrosa, 6,2 g de proteína, 475 mg de calcio y vitaminas del complejo B para llenar el glucógeno del músculo y salir con ganas, sobre todo en los entrenos de madrugada donde no cae bien comer sólido. No tiene cafeína —si la quieres, mézclalo en café caliente— y no reemplaza ninguna comida principal. Sabores fresa, vainilla y caramelo; el tarro rinde 13 vasos y la caja trae 12 sobres.",
      ],
    },
    {
      titulo: "Durante la sesión: hidratación y energía",
      parrafos: [
        "En sesiones de más de 60 minutos conviene agregarle al agua electrolitos y carbohidratos: un sobre o dos cucharadas (30 g) de Bebida Élite en 500 ml aportan 27,5 g de carbohidratos, 250 mg de sodio y vitaminas del complejo B, a sorbos de 100 a 125 ml cada 15 minutos; la versión con cafeína suma 55 mg para esa chispa de alerta y concentración. Para las sesiones largas o dobles, un gel de 30 g —con 9,6 mg de cafeína o sin ella— con un sorbo de agua da energía inmediata para la parte más dura.",
      ],
    },
    {
      titulo: "Después: proteína en los primeros 30 a 40 minutos",
      parrafos: [
        "Recovery Pro es la bebida de recuperación: 37 g (dos cucharadas o un sobre) en 250 ml de agua, preferiblemente en shaker, con 24 g de proteína de alto valor biológico de cuatro fuentes —whey hidrolizado, albúmina de huevo, soya aislada y caseína aislada—, 4.417 mg de BCAA, 8,3 g de carbohidratos y 181 mg de sodio, sin conservantes ni colorantes artificiales. Se toma en los primeros 30 a 40 minutos después de terminar, que es cuando el músculo mejor aprovecha la proteína para reparar fibras y recargar glucógeno; está pensada para sesiones de más de 90 minutos y viene en tarro o en caja de 12 sobres.",
      ],
    },
    {
      titulo: "El snack de la maleta: Protein Bar",
      parrafos: [
        "Cada Protein Bar aporta 9,6 g de proteína aislada de alto valor biológico, 14 g de carbohidratos y 2,1 g de fibra, con miel de abeja y chips de chocolate en sabor miel-maní. Sirve antes como complemento para salir con energía, después como snack de recuperación mientras llega la bebida, o en cualquier momento del día; la caja de 18 está pensada para tener siempre una en la maleta del gym o en el cajón del escritorio.",
      ],
    },
  ],
  retos: [],
  faqs: [
    {
      question: "¿Qué pre entreno sin cafeína puedo tomar?",
      answer:
        "Pre Race: 36 g en 250 ml de agua, leche, yogurt, jugo o café, de 15 a 30 minutos antes de entrenar. Aporta 25 g de carbohidratos, 6,2 g de proteína, 475 mg de calcio y vitaminas del complejo B, y no lleva cafeína; si la quieres, la ficha sugiere mezclarlo en una taza de café caliente.",
    },
    {
      question: "¿Cuánta proteína tiene Recovery Pro y cuándo se toma?",
      answer:
        "24 g de proteína por porción de 37 g, de cuatro fuentes —whey hidrolizado, albúmina de huevo, soya aislada y caseína aislada— con 4.417 mg de BCAA. Se toma en los primeros 30 a 40 minutos después de terminar la sesión, en 250 ml de agua, preferiblemente en shaker.",
    },
    {
      question: "¿Sirve una bebida deportiva para el gimnasio?",
      answer:
        "En sesiones de más de 60 minutos, sí: la Bebida Deportiva Élite aporta electrolitos y carbohidratos para que el agua permanezca más tiempo en el cuerpo y llegue energía al músculo. Se prepara con 30 g en 500 ml de agua y se toma a sorbos de 100 a 125 ml cada 15 minutos; hay versión con 55 mg de cafeína.",
    },
    {
      question: "¿Barra de proteína o batido de recuperación?",
      answer:
        "No compiten. Recovery Pro, con 24 g de proteína, es la bebida de recuperación para después de una sesión larga; la Protein Bar, con 9,6 g de proteína aislada y 14 g de carbohidratos, es el snack sólido para la maleta: antes como complemento, después mientras llega la bebida o en cualquier momento del día.",
    },
    {
      question: "¿Se puede tomar un gel energético en el gimnasio?",
      answer:
        "Sí, en sesiones largas o dobles: un gel de 30 g con un sorbo de agua da carbohidratos de absorción rápida para la parte más dura. Está con cafeína (9,6 mg por sachet) o sin cafeína, y es el mismo gel que usan los corredores y ciclistas de Actimax.",
    },
    {
      question: "¿Dónde comprar suplementos deportivos para gym en Colombia?",
      answer:
        "En la tienda oficial actimax.com.co, con pago seguro procesado por Shopify y envío a toda Colombia. Actimax es una marca colombiana de nutrición deportiva con sede en Envigado, Antioquia: pre entreno, bebida deportiva, recuperación y barras sin sobrecostos de importación.",
    },
  ],
  articulos: [
    "guia-completa-sobre-las-barras-de-proteina-en-realidad-son-saludables-y-efectivas",
    "deficiencia-de-proteinas-senales-que-no-consumes-las-suficientes",
    "que-comer-despues-de-entrenar-running-nutricion-practica-para-recuperacion-y-rendimiento",
  ],
  palabrasBlog: ["gym", "gimnasio", "pesas", "fuerza"],
  cta: {
    antes: "¿Entrenas en el gym? Toda la",
    despues: "está en un solo lugar: pre entreno, hidratación, proteína y snack, hechos en Colombia.",
  },
  precioPregunta: "¿Cuánto cuesta la nutrición deportiva para gym?",
};

/** Orden = prioridad del CTA en el blog cuando un post menciona varios deportes. */
export const DEPORTES: DeporteLanding[] = [RUNNING, CICLISMO, TRIATLON, NATACION, GYM];

export function deportePorSlug(slug: string): DeporteLanding | undefined {
  return DEPORTES.find((deporte) => deporte.deporte === slug);
}

/** Para las rutas: una landing sin datos es un error de programación. */
export function deporteRequerido(slug: string): DeporteLanding {
  const deporte = deportePorSlug(slug);
  if (deporte === undefined) throw new Error(`Falta el deporte ${slug} en deportes.ts`);
  return deporte;
}

/** Adónde enlazar un deporte: su landing si existe, si no la vista filtrada. */
export function deportePath(slug: string): string {
  return deportePorSlug(slug)?.path ?? `/productos/?deporte=${slug}`;
}

export function esCategoria(landing: Landing): landing is CategoriaLanding {
  return "tipo" in landing;
}

/**
 * Si el producto pertenece a la grilla de la landing. Pide lo mínimo para
 * decidirlo, así el test puede pasarle el catálogo local tal cual.
 */
export function esProductoDe(
  landing: Landing,
  product: Pick<Product, "handle" | "deportes"> & { type: string | null },
): boolean {
  if (landing.incluir?.includes(product.handle)) return true;
  return esCategoria(landing)
    ? product.type === landing.tipo
    : product.deportes.includes(landing.deporte);
}

/**
 * La landing de la que trata un post, por palabras completas del slug o del
 * título (sin tildes): primero las categorías (geles antes que bebidas antes
 * que barras) y, si ninguna coincide, los deportes en su orden.
 */
export function landingParaPost(post: { slug: string; title: string }): Landing | undefined {
  const vocabulario = palabras(`${post.slug} ${post.title}`);
  const landings: Landing[] = [...CATEGORIAS, ...DEPORTES];
  return landings.find((landing) =>
    landing.palabrasBlog.some((palabra) => vocabulario.has(normalize(palabra))),
  );
}
