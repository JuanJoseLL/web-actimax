import { SITE_URL, breadcrumbJsonLd, jsonLd } from "@/lib/seo";

interface BreadcrumbItem {
  name: string;
  /** Ruta interna con slash inicial o URL absoluta. */
  url: string;
}

/**
 * Miga de pan solo semántica. No altera el diseño: completa para Google la
 * misma jerarquía que ya expresa la navegación del sitio.
 */
export function SeoBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const absoluteItems = items.map((item) => ({
    ...item,
    url: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd(breadcrumbJsonLd(absoluteItems)),
      }}
    />
  );
}
