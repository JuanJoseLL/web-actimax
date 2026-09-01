import { CATEGORIAS } from "@/data/categorias";
import { DEPORTES } from "@/data/deportes";
import { FAQ_ITEMS } from "@/data/faq";
import { getDestinosData } from "@/app/destinos/shopify-data";
import { getAllProducts } from "@/lib/catalog";
import { BRAND_DESCRIPTION, SITE_URL, productUrl } from "@/lib/seo";
import { TYPE_LABELS, type Product, type ProductType } from "@/lib/taxonomia";

/**
 * /llms.txt — resumen del sitio en Markdown para asistentes de IA
 * (https://llmstxt.org). Se genera desde el catálogo vivo para que los
 * precios y la disponibilidad nunca queden desactualizados.
 */

const TYPE_ORDER: ProductType[] = ["geles", "bebidas", "barras", "kits"];

function productLine(product: Product): string {
  const price = `$${product.price.toLocaleString("es-CO")} COP`;
  const stock = product.inStock ? "" : " (agotado)";
  const excerpt =
    product.excerpt.length > 160 ? `${product.excerpt.slice(0, 160)}…` : product.excerpt;
  return `- [${product.title}](${productUrl(product.handle)}): ${price}${stock} — ${excerpt}`;
}

export async function GET(): Promise<Response> {
  const [products, destinos] = await Promise.all([
    getAllProducts(),
    getDestinosData(),
  ]);
  const includeDestinos =
    process.env.DESTINOS_PUBLIC === "true" &&
    destinos.seo.values.include_in_llms === true;

  const lines: string[] = [
    "# Actimax",
    "",
    `> ${BRAND_DESCRIPTION}`,
    "",
    `Tienda oficial: ${SITE_URL}/ — sitio en español (es-CO), precios en pesos colombianos (COP), checkout seguro con Shopify y envíos a toda Colombia.`,
    "Contacto: +57 300 329 9972 · Punto físico: Envigado, Antioquia, Colombia.",
    "",
  ];

  for (const type of TYPE_ORDER) {
    const ofType = products.filter((product) => product.type === type);
    if (ofType.length === 0) continue;
    lines.push(`## ${TYPE_LABELS[type]}`, "");
    lines.push(...ofType.map(productLine), "");
  }

  lines.push("## Preguntas frecuentes", "");
  lines.push(
    ...FAQ_ITEMS.map(
      (item) => `- [${item.question}](${SITE_URL}/preguntas-frecuentes/)`,
    ),
    "",
  );

  lines.push(
    "## Recursos",
    "",
    `- [Catálogo completo](${SITE_URL}/productos/): filtrable por tipo, momento del esfuerzo (antes, durante, después) y deporte.`,
    ...CATEGORIAS.map(
      (categoria) => `- [${categoria.nombre}](${SITE_URL}${categoria.path}): ${categoria.description}`,
    ),
    ...DEPORTES.map(
      (deporte) => `- [${deporte.nombre}](${SITE_URL}${deporte.path}): ${deporte.description}`,
    ),
    ...(includeDestinos
      ? [
          `- [${String(destinos.seo.values.schema_name ?? "Destinos Actimax × WOPU Travel")}](${SITE_URL}/destinos/): ${String(destinos.seo.values.schema_description ?? "Viajes deportivos a Europa para corredores y ciclistas.")}`,
        ]
      : []),
    `- [Comparador de Energy Packs](${SITE_URL}/productos/comparar/): kits de nutrición por distancia (10K a maratón, Gran Fondo, triatlón).`,
    `- [Blog](${SITE_URL}/blog/): guías de nutrición deportiva, hidratación y estrategia de carrera.`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
