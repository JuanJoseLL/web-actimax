/**
 * Páginas legales con URL propia.
 *
 * La revisión legal de agosto de 2026 pidió partir el documento único en
 * páginas separadas y enlazarlas desde el pie, porque una sola página muy
 * larga esconde justo lo que la ley colombiana obliga a mostrar: retracto,
 * garantía legal, reversión del pago y tratamiento de datos.
 *
 * Cuatro se alimentan de las políticas que Shopify administra (Configuración
 * → Políticas), que es donde el equipo las edita sin tocar el repo. La de
 * cookies no tiene ranura en Shopify —la Storefront API solo expone
 * devoluciones, privacidad, envíos, términos y suscripciones—, así que su
 * texto vive en el repo; que además es el único lugar donde consta qué
 * scripts corren de verdad.
 */
import type { PolicySlot } from "../lib/policies";

export interface PaginaLegal {
  path: string;
  /** Ranura de Shopify que la alimenta; `null` cuando el texto vive en el repo. */
  slot: PolicySlot | null;
  /** Etiqueta corta: pie de página y navegación entre políticas. */
  navLabel: string;
  /** Encabezado de la página. */
  titulo: string;
  metaTitle: string;
  description: string;
}

/** URL histórica del documento único: hoy es el índice de las cinco páginas. */
export const INDICE_LEGAL_PATH = "/politicas-devolucion-privacidad/";

export const PAGINAS_LEGALES = {
  terminos: {
    path: "/terminos-y-condiciones/",
    slot: "termsOfService",
    navLabel: "Términos y Condiciones",
    titulo: "Términos y condiciones",
    metaTitle: "Términos y condiciones — Actimax",
    description:
      "Condiciones aplicables a las compras realizadas en actimax.com.co, de acuerdo con la legislación colombiana vigente.",
  },
  cambios: {
    path: "/cambios-garantia-retracto/",
    slot: "refundPolicy",
    navLabel: "Cambios, Garantía, Retracto y Reversión del Pago",
    titulo: "Cambios, garantía, retracto y reversión del pago",
    metaTitle: "Cambios, garantía, retracto y reversión del pago — Actimax",
    description:
      "Cómo solicitar un cambio, hacer efectiva la garantía legal, ejercer el derecho de retracto y pedir la reversión del pago en Actimax.",
  },
  datos: {
    path: "/tratamiento-de-datos/",
    slot: "privacyPolicy",
    navLabel: "Política de Tratamiento de Datos Personales",
    titulo: "Política de tratamiento de datos personales",
    metaTitle: "Política de tratamiento de datos personales — Actimax",
    description:
      "Qué datos personales recolecta Actimax, con qué finalidad los trata, cuánto los conserva y cómo ejercer tus derechos como titular.",
  },
  envios: {
    path: "/envios-y-entregas/",
    slot: "shippingPolicy",
    navLabel: "Política de Envíos y Entregas",
    titulo: "Política de envíos y entregas",
    metaTitle: "Política de envíos y entregas — Actimax",
    description:
      "Cobertura, costos, tiempos de despacho y condiciones de entrega de los pedidos de Actimax en Colombia. Envío gratis desde $120.000.",
  },
  cookies: {
    path: "/politica-de-cookies/",
    slot: null,
    navLabel: "Política de Cookies",
    titulo: "Política de cookies",
    metaTitle: "Política de cookies — Actimax",
    description:
      "Qué cookies y tecnologías equivalentes usa actimax.com.co, para qué sirven, cuánto duran y cómo desactivarlas.",
  },
} as const satisfies Record<string, PaginaLegal>;

/** Mismo orden en el pie, en el índice y en la navegación entre políticas. */
export const PAGINAS_LEGALES_ORDENADAS: readonly PaginaLegal[] =
  Object.values(PAGINAS_LEGALES);

/**
 * Anclas del documento único que enlazaba WordPress (y que siguen vivas en
 * enlaces viejos): el índice las traduce a su página nueva. Un ancla nunca
 * llega al servidor, así que el salto se hace en el cliente.
 */
export const ANCLAS_LEGADAS: Record<string, string> = {
  devolucion: PAGINAS_LEGALES.cambios.path,
  privacidad: PAGINAS_LEGALES.datos.path,
  envios: PAGINAS_LEGALES.envios.path,
};
