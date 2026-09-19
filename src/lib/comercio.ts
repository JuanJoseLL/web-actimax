import { SITE_URL } from "./seo-base";

/**
 * Condiciones comerciales que se publican tanto para personas como para
 * buscadores. Mantener estos valores alineados con Shopify → Configuración →
 * Políticas evita que el dato estructurado prometa algo distinto al texto
 * legal que ve el comprador.
 */
export const POLITICA_ENVIOS_URL = `${SITE_URL}/envios-y-entregas/`;
export const POLITICA_CAMBIOS_URL = `${SITE_URL}/cambios-garantia-retracto/`;

export const ENVIO_NACIONAL = {
  country: "CO",
  freeFrom: 120_000,
  standardRate: 13_000,
  specialRegionRate: 30_000,
  currency: "COP",
  handlingDays: { min: 0, max: 2 },
  transitDays: { min: 3, max: 5 },
  businessDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  carriers: ["Coordinadora", "Inter Rapidísimo", "Envía", "FedEx"],
} as const;
