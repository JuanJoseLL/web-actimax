/**
 * Rastreo de guías: a dónde mandamos al cliente según la transportadora.
 *
 * Shopify solo convierte el número de guía en un enlace si la transportadora
 * está en su lista interna o si le damos una URL explícita. Coordinadora sí
 * está y Shopify le arma la URL sola. Envía (Colvanes) no está, y además su
 * rastreo vive en un modal con captcha y un OTP contra su API: no existe
 * ninguna URL de envia.co que se pueda enlazar con la guía dentro. Sin URL,
 * Shopify pinta el número como texto plano y el cliente no puede rastrear.
 *
 * De ahí /rastreo: una URL nuestra —sí enlazable— que muestra la guía lista
 * para copiar y manda al sitio de la transportadora. El webhook de
 * /api/envios/ la escribe solo en cada preparación.
 */

export interface Transportadora {
  /** Identificador corto que viaja en la URL (?t=). */
  readonly slug: string;
  readonly nombre: string;
  /** Página de rastreo de la transportadora. */
  readonly sitio: string;
  /** Enlace directo a esta guía, o null si la transportadora no ofrece uno. */
  readonly enlaceGuia: ((guia: string) => string) | null;
  /** Qué tiene que hacer el cliente cuando toca pegar la guía a mano. */
  readonly instruccion: string | null;
}

const COORDINADORA: Transportadora = {
  slug: "coordinadora",
  nombre: "Coordinadora",
  sitio: "https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/",
  // Misma URL que arma Shopify cuando reconoce la transportadora.
  enlaceGuia: (guia) =>
    "https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/" +
    `?guia=${encodeURIComponent(guia)}`,
  instruccion: null,
};

const ENVIA: Transportadora = {
  slug: "envia",
  nombre: "Envía (Colvanes)",
  sitio: "https://envia.co/",
  enlaceGuia: null,
  instruccion: 'Pega la guía en el campo "Rastrea" de la página de Envía.',
};

/** Orden de aparición cuando no sabemos con cuál se despachó. */
export const TRANSPORTADORAS: readonly Transportadora[] = [ENVIA, COORDINADORA];

export function transportadoraPorSlug(slug: string | null | undefined): Transportadora | null {
  if (typeof slug !== "string") return null;
  const buscado = slug.trim().toLowerCase();
  return TRANSPORTADORAS.find((t) => t.slug === buscado) ?? null;
}

/**
 * Traduce el nombre que quedó guardado en Shopify (`tracking_company`) a una
 * transportadora nuestra. El campo es texto libre cuando en el panel eligen
 * "Otra", así que llega escrito de muchas formas: "Envía", "envia colvanes",
 * "COLVANES"… Con "Otra"/"Other" a secas Shopify no dice cuál es, y
 * devolvemos null a propósito: la página le pregunta al cliente en vez de
 * adivinar y mandarlo a la transportadora equivocada.
 */
export function transportadoraPorEmpresa(
  empresa: string | null | undefined,
): Transportadora | null {
  if (typeof empresa !== "string") return null;
  const texto = empresa
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (texto === "") return null;
  if (texto.includes("envia") || texto.includes("colvanes")) return ENVIA;
  if (texto.includes("coordinadora")) return COORDINADORA;
  return null;
}

/**
 * Deja la guía como la espera la transportadora: solo alfanuméricos. Los
 * números llegan con espacios, puntos o guiones según quién los teclee —el
 * pedido #1002 quedó guardado con un punto al final— y esa basura rompe
 * tanto el enlace como el copiar y pegar.
 */
export function normalizarGuia(valor: string | null | undefined): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
}

/**
 * Agrupa la guía para poder leerla en voz alta o teclearla sin perder la
 * cuenta. En grupos de 3 cuando cuadra exacto (los 12 dígitos de Envía) y de
 * 4 en el resto (los 11 de Coordinadora).
 */
export function guiaLegible(guia: string): string {
  const limpia = normalizarGuia(guia);
  if (limpia.length <= 4) return limpia;
  const tamano = limpia.length % 3 === 0 ? 3 : 4;
  return (limpia.match(new RegExp(`.{1,${tamano}}`, "g")) ?? [limpia]).join(" ");
}

/**
 * Ruta de nuestra página de rastreo. Con slash final porque el sitio corre
 * con `trailingSlash: true` y sin él Next responde un 308.
 */
export function rutaRastreo(guia: string, slug?: string | null): string {
  const parametros = new URLSearchParams({ guia: normalizarGuia(guia) });
  if (typeof slug === "string" && slug !== "") parametros.set("t", slug);
  return `/rastreo/?${parametros.toString()}`;
}
