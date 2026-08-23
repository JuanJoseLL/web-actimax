/**
 * Preguntas frecuentes por producto para SEO y AEO (motores de respuesta
 * directa). Se generan desde los datos reales del producto —tipo, momentos,
 * cafeína en el título, contenido del kit— para que cada PDP tenga su
 * FAQPage sin inventar afirmaciones, más extras puntuales por handle.
 * Mismo formato "bloque de respuesta" que src/data/faq.ts.
 */
/* Imports relativos: vitest no resuelve el alias "@/" y este módulo
   tiene test propio (product-faq.test.ts). */
import type { FaqItem } from "../data/faq";
import { PROMO_PATTERN } from "./description";
import { ENVIO_GRATIS_UMBRAL } from "./envio";
import { formatCOP } from "./format";
import { normalize } from "./palette-search";
import { DEPORTE_LABELS, type Momento, type Product } from "./taxonomia";

const MOMENTO_USO: Record<Momento, string> = {
  antes:
    "antes del esfuerzo: tómalo 15–20 minutos antes de la largada para cargar energía",
  durante:
    "durante el esfuerzo: cada 30–45 minutos para reponer energía y electrolitos",
  despues:
    "después del esfuerzo: en los primeros 30 minutos tras la meta para recuperar",
};

/* La pauta de 30–45 min es de geles y bebidas; una barra se come distinto. */
const MOMENTO_USO_BARRAS: Record<Momento, string> = {
  ...MOMENTO_USO,
  durante:
    "durante esfuerzos largos (fondos de ciclismo, trail, triatlón): una porción cuando necesites energía sólida, acompañada de agua",
};

const TYPE_FALLBACK: Record<string, string> = {
  geles:
    "Es un gel de carbohidratos de rápida absorción que repone la energía durante el ejercicio prolongado y retrasa la fatiga.",
  bebidas:
    "Es una bebida deportiva en polvo que acompaña tu nutrición en el momento del esfuerzo para el que fue diseñada.",
  barras:
    "Es una barra de proteína pensada como aporte sólido de energía y recuperación muscular para deportistas.",
  kits:
    "Es un Energy Pack: un kit de nutrición deportiva armado para cubrir un reto concreto sin improvisar.",
};

/** Extras por handle para productos donde una duda concreta manda. */
const EXTRA_FAQS: Record<string, FaqItem[]> = {
  "energy-pack-maraton-42k": [
    {
      question: "¿Cuánta nutrición necesito para una maratón de 42K?",
      answer:
        "La pauta general es un gel cada 30 a 45 minutos, es decir entre 3 y 6 geles según tu ritmo, más carga previa y recuperación. Este kit del maratonista reúne esa base: energía para antes, geles para el recorrido y recuperación para después de la meta.",
    },
  ],
  "energy-pack-maraton-42k-running": [
    {
      question: "¿Cuánta nutrición necesito para una maratón de 42K?",
      answer:
        "La pauta general es un gel cada 30 a 45 minutos, es decir entre 3 y 6 geles según tu ritmo, más carga previa y recuperación. Este kit del maratonista reúne esa base: energía para antes, geles para el recorrido y recuperación para después de la meta.",
    },
  ],
};

/**
 * Recorta a frases completas (el excerpt viene cortado a 280 caracteres
 * duros, a veces a mitad de palabra) y descarta las frases promocionales,
 * que caducan y no deben publicarse como respuesta en el FAQPage.
 */
function frasesLimpias(text: string): string {
  const frases = text.match(/[^.!?]+[.!?]+/g) ?? [];
  return frases
    .map((frase) => frase.trim())
    .filter((frase) => frase.length > 0 && !PROMO_PATTERN.test(frase))
    .join(" ");
}

/* Temas donde una FAQ real de la descripción deja obsoleta a la generada:
   si el cliente ya preguntó "¿cómo se prepara?" no publicamos además la
   plantilla "¿cuándo y cómo se toma?". */
function cubiertaPorExtraidas(generada: string, extraidas: FaqItem[]): boolean {
  const alguna = (re: RegExp) => extraidas.some((f) => re.test(normalize(f.question)));
  const q = normalize(generada);
  if (q.includes("cafeina")) return alguna(/cafeina/);
  if (q.startsWith("¿que es")) return alguna(/¿que (es|contiene)\b/);
  if (q.startsWith("¿cuando y como se toma")) {
    return alguna(
      /cuando (debo|se debe|tomar|usar|consumir|se toma|se usa|se consume)|como se (prepara|toma|usa|consume)|como (preparo|debo tomar)/,
    );
  }
  if (q.includes("sirve para")) return alguna(/¿(a )?quien(es)?\b/);
  return false;
}

/** FAQs reales del producto: sin promos caducables ni preguntas repetidas. */
function faqsExtraidas(product: Product): FaqItem[] {
  const vistas = new Set<string>();
  return product.faqs.filter((f) => {
    if (PROMO_PATTERN.test(`${f.question} ${f.answer}`)) return false;
    const clave = normalize(f.question);
    if (vistas.has(clave)) return false;
    vistas.add(clave);
    return true;
  });
}

export function productFaq(product: Product): FaqItem[] {
  const items: FaqItem[] = [];
  const title = product.title;
  const plainTitle = normalize(title);

  /* Un excerpt que arranca enumerando contenido no define el producto
     (y duplicaría la respuesta de "¿qué incluye?"): mejor el genérico. */
  const excerptEsLista = /^[^.]{0,60}incluye:?\s/i.test(product.excerpt.trim());
  const definicionReal = excerptEsLista ? "" : frasesLimpias(product.excerpt);
  const definicion =
    definicionReal.length >= 60
      ? definicionReal
      : product.type !== null
        ? TYPE_FALLBACK[product.type]
        : null;
  if (definicion !== null) {
    items.push({
      question: `¿Qué es ${title} y para qué sirve?`,
      answer: definicion,
    });
  }

  if (product.type === "kits") {
    const contenido = product.contenido;
    if (contenido.length > 0) {
      items.push({
        question: `¿Qué incluye ${title}?`,
        answer: `${title} incluye: ${contenido.join(" · ")}.`,
      });
      items.push({
        question: "¿Cómo uso el kit el día de la carrera?",
        answer:
          "Pruébalo completo en un entrenamiento largo antes de la carrera para ajustar cantidades y tiempos; nunca estrenes nutrición el día del reto. La pauta general del método Actimax: energía antes de la largada, reposición cada 30–45 minutos durante el esfuerzo y recuperación en los primeros 30 minutos tras la meta.",
      });
    }
  } else if (product.momentos.length > 0) {
    const pauta = product.type === "barras" ? MOMENTO_USO_BARRAS : MOMENTO_USO;
    items.push({
      question: `¿Cuándo y cómo se toma ${title}?`,
      answer:
        `Se usa ${product.momentos.map((m) => pauta[m]).join("; y ")}. ` +
        "Pruébalo en tus entrenamientos antes de usarlo en competencia.",
    });
  }

  /* La cafeína solo se afirma cuando el título la declara. */
  if (plainTitle.includes("sin cafeina")) {
    items.push({
      question: `¿${title} tiene cafeína?`,
      answer:
        "No. Esta es la versión sin cafeína: sirve para cualquier momento del plan y para estómagos sensibles a los estimulantes. Si buscas un impulso extra de alerta para el final de la carrera, Actimax también ofrece la versión con cafeína.",
    });
  } else if (plainTitle.includes("cafeina")) {
    items.push({
      question: `¿${title} tiene cafeína?`,
      answer:
        "Sí. Incluye cafeína para un impulso adicional de alerta y rendimiento, útil en la parte final de una carrera o en jornadas largas. Si prefieres evitar estimulantes, Actimax también ofrece la versión sin cafeína.",
    });
  }

  if (product.deportes.length > 0) {
    const deportes = product.deportes.map((d) => DEPORTE_LABELS[d] ?? d);
    items.push({
      question: `¿${title} sirve para ${deportes.slice(0, 3).join(", ").toLowerCase()}?`,
      answer:
        `Sí. ${title} se usa en ${deportes.join(", ").toLowerCase()}. ` +
        "La pauta de uso es la misma; ajusta las cantidades según la duración y la intensidad de tu esfuerzo.",
    });
  }

  items.push({
    question: "¿Hacen envíos a toda Colombia y cómo se paga?",
    answer:
      `Sí. Enviamos a toda Colombia desde Envigado, Antioquia, con envío gratis en compras desde ${formatCOP(ENVIO_GRATIS_UMBRAL)}. ` +
      "El pago es seguro a través del checkout de Shopify: tarjeta, PSE y Nequi. También tenemos punto físico en Envigado.",
  });

  items.push(...(EXTRA_FAQS[product.handle] ?? []));

  /* Primero las Q/A reales que escribió la marca en Woo; de las generadas
     solo sobreviven las que aportan un tema que aquellas no cubren. */
  const extraidas = faqsExtraidas(product);
  return [
    ...extraidas,
    ...items.filter((item) => !cubiertaPorExtraidas(item.question, extraidas)),
  ];
}
