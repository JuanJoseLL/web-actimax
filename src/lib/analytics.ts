/**
 * Eventos personalizados de Vercel Web Analytics.
 *
 * El plan Pro admite **2 propiedades por evento** (Web Analytics Plus sube a
 * 8, pero no lo tenemos), sin objetos anidados, con valores string, number,
 * boolean o null y un máximo de 255 caracteres en el nombre, las claves y los
 * valores. Cada evento elige las 2 que responden algo que el pageview no
 * responde: Vercel registra solo el pathname, así que el querystring y todo
 * lo que ocurra sin navegar —agregar al carrito, armar un plan, comparar dos
 * packs— no deja ningún rastro.
 *
 * Se disparan siempre por interacción del usuario o desde una ruta de API,
 * nunca durante el render de una página cacheada.
 */

const MAX_PROPERTY_LENGTH = 255;

/** Recorta un texto libre al límite que Vercel acepta por valor. */
export function trackableText(value: string): string {
  return value.slice(0, MAX_PROPERTY_LENGTH);
}

/**
 * Superficie desde la que se agregó al carrito. Se calcula sobre la ruta del
 * navegador en el momento del clic, no con un prop por cada sitio donde vive
 * el botón: así el evento distingue si la venta la empuja el catálogo, la
 * ficha del producto o alguna de las herramientas propias.
 *
 * Las fichas de producto son de tres tramos (/productos/geles-energeticos/…);
 * el catálogo es /productos/ a secas.
 */
export function cartSurface(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/productos" || pathname === "/productos/") return "catalogo";
  if (pathname.startsWith("/productos/comparar")) return "comparador";
  if (pathname.startsWith("/productos/")) return "pagina-producto";
  if (pathname.startsWith("/mi-plan")) return "mi-plan";
  if (pathname.startsWith("/blog")) return "blog";
  return "otra";
}
