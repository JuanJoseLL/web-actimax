import type { StudioValues } from "./types";
import { FAQS, TOURS } from "./data";

export const APPROVED_CONTENT_VERSION = "destinos-v5-approved-2026-08-27";

export const defaultSettings: StudioValues = {
  name: "Destinos Actimax × WOPU Travel",
  season: "2027",
  content_version: APPROVED_CONTENT_VERSION,
  whatsapp_url:
    "https://wa.me/34660257833?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20Destinos%20Actimax%20%C3%97%20WOPU%20Travel",
  wopu_url: "https://woputravel.com/es/",
  wopu_instagram_url: "https://www.instagram.com/wopu.travel",
  wopu_email: "info@woputravel.com",
  seal_alt: "Temporada exclusiva Europa 2027",
  seal_enabled: true,
  exchange_rate_enabled: true,
  default_currency: "EUR",
  primary_color: "#1E3C7B",
  accent_color: "#F5B700",
  river_color: "#2F5D94",
  surface_color: "#FBFAF6",
  heading_font: "Rubik",
  body_font: "Lato",
  analytics_enabled: false,
  analytics_id: "",
  publication_state: "draft",
  published_at: "",
};

export const defaultHero: StudioValues = {
  name: "Hero principal V5",
  enabled: true,
  eyebrow: "Destinos Actimax × WOPU Travel · Europa 2027",
  title_primary: "Límites por",
  title_accent: "descubrir",
  description:
    "Descubre Europa a través del deporte. Viajes organizados alrededor de grandes eventos y rutas inolvidables, para que tú solo tengas que concentrarte en superar tu próxima meta.",
  primary_cta_label: "Ver experiencias",
  primary_cta_target: "#experiencias",
  secondary_cta_label: "Escríbenos por WhatsApp",
  secondary_cta_url:
    "https://wa.me/34660257833?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20Destinos%20Actimax%20%C3%97%20WOPU%20Travel",
  brand_lockup_enabled: true,
  brand_lockup_caption: "RENDIMIENTO\n+ OPERACIÓN",
  background_mode: "gradient",
  background_color: "#16305F",
  gradient_end_color: "#24468C",
  background_alt: "Destinos Actimax × WOPU Travel · Europa 2027",
  overlay_color: "#16305F",
  overlay_opacity: 0.2,
  focal_x: 50,
  focal_y: 50,
  content_alignment: "left",
  lockup_alignment: "center",
  spacing_preset: "default",
};

const approvedCardSummaries: Record<string, string> = {
  barcelona:
    "Una experiencia para descubrir Barcelona y la Costa Brava entre arquitectura, cultura y Mediterráneo.",
  madrid:
    "La energía de Madrid y la autenticidad de Extremadura en una experiencia deportiva y cultural.",
  praga:
    "Praga, Viena y Budapest: tres capitales monumentales alrededor de un gran reto deportivo.",
  "grandes-batallas":
    "Una ruta ciclista de 340 km por escenarios históricos de Francia y Bélgica.",
  italia: "Una gran travesía ciclista para recorrer Italia de norte a sur.",
  andalucia:
    "Una ruta exigente y alcanzable entre montaña, caminos rurales y paisajes mediterráneos.",
};

export const defaultExperiences = TOURS.map((tour, index) => ({
  handle: tour.id,
  values: {
    title: tour.title,
    activity_type: tour.type,
    tag: tour.tag,
    badge: "",
    metric: tour.metric,
    metric_label: tour.metricLabel,
    region: tour.region,
    subtitle: tour.sub,
    route: tour.route ?? "",
    dates: tour.dates,
    days: tour.days,
    nights: tour.nights,
    deadline: tour.deadline,
    capacity: tour.cupo,
    estimated_price: Number(tour.price.replaceAll(".", "")),
    currency: "EUR",
    registration_price: tour.id === "grandes-batallas" ? 500 : 0,
    price_note: "PRECIO ESTIMADO",
    card_summary: approvedCardSummaries[tour.id],
    card_image_alt: tour.imageAlt,
    card_focal_x: 50,
    card_focal_y: 50,
    modal_title: tour.title,
    modal_description: tour.desc,
    modal_image_alt: tour.imageAlt,
    modal_focal_x: 50,
    modal_focal_y: 50,
    highlights: [...tour.highlights],
    inclusions: [],
    cta_label: "Quiero más información",
    sold_out: tour.soldOut,
    enabled: true,
    featured: false,
    sort_order: index + 1,
    internal_notes: "Contenido aprobado en Destinos V5.",
  } satisfies StudioValues,
}));

const collaborationConfig = {
  body: "Destinos Actimax × WOPU Travel une la experiencia de Actimax acompañando el rendimiento y la preparación de los deportistas con la experiencia de WOPU Travel diseñando y operando viajes personalizados en destinos europeos. Cada experiencia se organiza alrededor de un gran reto deportivo —correr una maratón internacional o recorrer nuevos territorios en bicicleta— y va mucho más allá de la competencia, conociendo la cultura de cada destino.",
  roles: [
    {
      tag: "Actimax · Rendimiento",
      title: "Acompaña al deportista a descubrir sus límites",
      copy: "Nutrición deportiva especializada y una comunidad que entiende el deporte como parte de su estilo de vida y de sus metas personales.",
    },
    {
      tag: "WOPU Travel · Operación",
      title: "Coordina toda la logística del viaje",
      copy: "Diseño y operación de cada recorrido a partir de un conocimiento directo de los destinos, sus culturas, alojamientos y proveedores.",
    },
  ],
};

const includesConfig = {
  items: [
    {
      title: "Vuelos desde Colombia",
      copy: "Tiquetes aéreos de ida y regreso entre Colombia y Europa, según las condiciones de cada destino.",
      icon: "plane",
    },
    {
      title: "Alojamiento central",
      copy: "Hoteles bien ubicados y cercanos a las actividades durante todo el tour.",
      icon: "bed",
    },
    {
      title: "Inscripción al evento",
      copy: "Gestión e inclusión de la inscripción oficial a la maratón o actividad deportiva correspondiente.",
      icon: "ticket",
    },
    {
      title: "Acompañamiento WOPU Travel",
      copy: "Guías de WOPU Travel acompañan al grupo en cada destino para coordinar la experiencia y la logística.",
      icon: "people",
    },
  ],
};

const whyConfig = {
  items: [
    {
      title: "Preparación con visión deportiva",
      copy: "Actimax acompaña a una comunidad que entiende el deporte como parte de su estilo de vida y de sus metas personales.",
    },
    {
      title: "Diseñado por quienes conocen Europa",
      copy: "WOPU Travel organiza cada recorrido a partir de su conocimiento directo de los destinos, sus culturas, alojamientos y proveedores.",
    },
    {
      title: "Acompañamiento de principio a fin",
      copy: "Desde la planificación hasta el regreso, el grupo cuenta con acompañamiento local y experimentado en cada destino.",
    },
    {
      title: "Más que participar en un evento",
      copy: "Cada tour combina el reto deportivo con el descubrimiento de nuevos lugares, culturas y personas.",
    },
  ],
};

const wopuConfig = {
  body: "WOPU Travel nace para invitar a descubrir los caminos auténticos de Colombia y, ahora, del mundo: conectando a las personas con la naturaleza, la comunidad y el espíritu de aventura. No es solo un servicio de tours, sino una experiencia de transformación. En esta alianza, WOPU Travel se encarga de diseñar y operar cada viaje de principio a fin.",
  panel_eyebrow: "ACTIMAX × WOPU TRAVEL",
  panel_title: "Rendimiento y viaje, conectados en una misma experiencia.",
  panel_copy:
    "Actimax acompaña la comunidad deportiva. WOPU Travel diseña y opera el recorrido.",
};

const sectionRows: Array<
  [string, string, string, string, string, StudioValues]
> = [
  ["hero", "hero", "Hero", "", "", {}],
  [
    "collaboration",
    "collaboration",
    "La colaboración",
    "La colaboración",
    "El deporte como una nueva forma de descubrir Europa.",
    collaborationConfig,
  ],
  [
    "includes",
    "includes",
    "Qué incluye",
    "Qué incluye cada viaje",
    "Tú te concentras en la meta. Nosotros, en todo lo demás.",
    includesConfig,
  ],
  [
    "experiences",
    "experiences",
    "Experiencias",
    "Destinos · Temporada 2027",
    "Elige tu próximo destino",
    {
      helper:
        "Toca cada experiencia para ver el itinerario completo, las fechas y todo lo que incluye.",
    },
  ],
  [
    "why",
    "why",
    "Por qué viajar con nosotros",
    "Por qué viajar con nosotros",
    "Una experiencia diseñada alrededor del deportista",
    whyConfig,
  ],
  ["wopu", "wopu", "Operado por WOPU", "Operado por", "", wopuConfig],
  [
    "reviews",
    "reviews",
    "Google Reviews",
    "Viajeros WOPU",
    "Experiencias contadas por quienes ya viajaron.",
    {},
  ],
  [
    "faq",
    "faq",
    "Preguntas frecuentes",
    "Preguntas frecuentes",
    "Lo esencial antes de elegir tu próximo reto.",
    {},
  ],
  [
    "signup",
    "form",
    "Preinscripción",
    "Preinscripción",
    "¿Te animas a viajar con nosotros?",
    {},
  ],
  [
    "footer",
    "footer",
    "Footer Destinos",
    "",
    "",
    { tagline: "Europa 2027 · Límites por descubrir" },
  ],
];

export const defaultSections = sectionRows.map(
  ([handle, sectionType, label, eyebrow, heading, contentConfig], index) => ({
    handle,
    values: {
      section_key: handle,
      section_type: sectionType,
      label,
      enabled: true,
      sort_order: index + 1,
      eyebrow,
      heading,
      intro:
        handle === "reviews"
          ? "Este bloque queda preparado para conectar las reseñas reales de Google de WOPU Travel sin modificar el diseño de la página."
          : "",
      layout_variant: "v5-approved",
      background_mode: "inherit",
      background_color: "#FFFFFF",
      text_alignment: "left",
      spacing_preset: "default",
      content_config: contentConfig,
      design_config: {},
    },
  }),
);

export const defaultFaqs = FAQS.map((faq, index) => ({
  handle: [
    "que-incluye",
    "nivel",
    "acompanantes",
    "reserva",
    "cambios",
    "soporte",
  ][index],
  values: {
    question: faq.q,
    answer: faq.a,
    enabled: true,
    sort_order: index + 1,
  } satisfies StudioValues,
}));

export const defaultForm: StudioValues = {
  name: "Preinscripción Destinos",
  enabled: true,
  eyebrow: "Preinscripción",
  heading: "¿Te animas a viajar con nosotros?",
  intro:
    "Déjanos tus datos y el equipo de WOPU Travel te contactará con toda la información de la experiencia que elijas.",
  cta_label: "Quiero más información",
  success_message:
    "Gracias. Recibimos tu preinscripción y el equipo de WOPU Travel te contactará.",
  error_message: "No fue posible enviar el formulario. Inténtalo de nuevo.",
  consent_text:
    "Acepto que WOPU Travel use estos datos para responder a mi solicitud sobre Destinos Actimax × WOPU Travel.",
  privacy_url: "https://actimax.com.co/policies/privacy-policy",
  recipient_email: "info@woputravel.com",
  spam_protection: "honeypot",
  store_submissions: false,
};

export const defaultReviews: StudioValues = {
  name: "Reseñas WOPU",
  enabled: false,
  provider: "disabled",
  heading: "Experiencias contadas por quienes ya viajaron.",
  intro:
    "Este bloque queda preparado para conectar las reseñas reales de Google de WOPU Travel sin modificar el diseño de la página.",
  trustindex_widget_id: "",
  google_place_id: "",
  profile_url: "",
  max_reviews: 3,
  minimum_rating: 4,
  layout: "cards",
};

export const defaultSeo: StudioValues = {
  name: "SEO Destinos",
  meta_title: "Destinos y Retos Deportivos | Actimax × WOPU",
  meta_description:
    "Experiencias deportivas por Europa diseñadas alrededor de grandes retos, operadas por WOPU Travel junto a Actimax.",
  canonical_url: "https://actimax.com.co/destinos",
  og_title: "Destinos y Retos Deportivos | Actimax × WOPU",
  og_description:
    "Viajes deportivos por Europa alrededor de maratones y rutas ciclistas, con operación de WOPU Travel y la comunidad Actimax.",
  language: "es-CO",
  schema_name: "Destinos Actimax × WOPU Travel",
  schema_description:
    "Experiencias deportivas por Europa diseñadas alrededor de maratones y rutas ciclistas.",
  include_in_llms: false,
  include_in_sitemap: false,
};

