import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Fuerza el refresco del catálogo cacheado. Útil tras cambiar productos en el
 * admin de Shopify y querer ver el cambio de inmediato (sin esperar los 30 s
 * de revalidación automática). Más adelante, un webhook de Shopify
 * (products/update) puede llamar a esta misma ruta.
 */
export function GET() {
  revalidateTag("catalog", "max");
  return NextResponse.json({ revalidado: true, fecha: new Date().toISOString() });
}
