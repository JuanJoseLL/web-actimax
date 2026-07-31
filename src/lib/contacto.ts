/**
 * Datos de contacto de la marca en un solo lugar: footer, botón de
 * WhatsApp y JSON-LD leen de aquí para no divergir entre sí.
 */

export const TELEFONO_DISPLAY = "+57 300 329 9972";
export const TELEFONO_E164 = "+573003299972";

export const EMAIL = "ventas@actimax.com.co";

export const SEDE = {
  lineas: ["Cra. 45A # 34 Sur - 57", "Local 130, Portal del Cerro", "Envigado, Antioquia"],
  streetAddress: "Cra. 45A # 34 Sur - 57, Local 130 Portal del Cerro",
  addressLocality: "Envigado",
  addressRegion: "Antioquia",
  addressCountry: "CO",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent("Actimax, Cra. 45A # 34 Sur - 57, Local 130 Portal del Cerro, Envigado, Antioquia"),
};

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
