/**
 * Datos de contacto de la marca en un solo lugar: footer, botón de
 * WhatsApp y JSON-LD leen de aquí para no divergir entre sí.
 */

export const TELEFONO_DISPLAY = "+57 304 658 0298";
export const TELEFONO_E164 = "+573046580298";

export const EMAIL = "ventas@actimax.com.co";

export const LEGAL_NAME = "ACTIVA SPORT S.A.S";
export const TAX_ID = "811031312-8";

export const SEDE = {
  lineas: ["Cra. 45A # 34 Sur - 57", "Local 130, Portal del Cerro", "Envigado, Antioquia"],
  streetAddress: "Cra. 45A # 34 Sur - 57, Local 130 Portal del Cerro",
  addressLocality: "Envigado",
  addressRegion: "Antioquia",
  postalCode: "055422",
  addressCountry: "CO",
  mapsUrl: "https://maps.app.goo.gl/bQSETyu5QLjXa4Hz6",
};

/** Horario de atención presencial de la sede Portal del Cerro. */
export const HORARIO_SEDE = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  opens: "08:00",
  closes: "16:00",
} as const;

/** Enlace de chat de WhatsApp, con mensaje inicial opcional. */
export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${TELEFONO_E164.replace("+", "")}`;
  return text === undefined ? base : `${base}?text=${encodeURIComponent(text)}`;
}

/** Perfiles oficiales verificados: conectan la marca como entidad. */
export const SOCIAL_PROFILES = [
  "https://www.instagram.com/actimax/",
  "https://www.facebook.com/actimaxco",
  "https://www.tiktok.com/@actimaxco",
  "https://www.youtube.com/user/actimaxcol",
  "https://twitter.com/actimaxco",
  "https://www.linkedin.com/company/actimaxco/",
];

/** Redes que mostramos en el sitio (las principales, con label). */
export const REDES_VISIBLES = [
  { nombre: "Instagram", href: "https://www.instagram.com/actimax/" },
  { nombre: "Facebook", href: "https://www.facebook.com/actimaxco" },
  { nombre: "TikTok", href: "https://www.tiktok.com/@actimaxco" },
  { nombre: "YouTube", href: "https://www.youtube.com/user/actimaxcol" },
] as const;

