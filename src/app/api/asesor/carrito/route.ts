import { z } from "zod";
import { getCatalogoAsesor } from "@/lib/catalog";
import { catalogoParaAsesor } from "@/lib/asesor/catalogo";
import { MAX_RECOMENDACIONES } from "@/lib/asesor/contrato";
import { leerJsonLimitado, limitarAsesor } from "@/lib/asesor/http";

const seleccionSchema = z.object({
  handle: z.string().max(120), variantId: z.string().max(100),
  cantidad: z.number().int().min(1).max(12),
  precioEsperado: z.number().positive(),
});
/* La selección entera viaja en una sola petición: agregarla producto por
   producto gastaría un turno por producto del límite por IP que comparte con
   el chat. El tope es el mismo que el de la recomendación. */
const peticionSchema = z.object({ items: z.array(seleccionSchema).min(1).max(MAX_RECOMENDACIONES) });

/** Revalida el sabor y el precio en el momento del clic. Solo devuelve datos
 * para el carrito existente; no crea pedidos ni modifica Shopify. */
export async function POST(request: Request) {
  const limited = limitarAsesor(request);
  if (limited) return limited;
  let peticion;
  try {
    peticion = peticionSchema.parse(await leerJsonLimitado(request));
  } catch {
    return Response.json({ error: "Selección inválida." }, { status: 400 });
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]);
  const products = await getCatalogoAsesor(signal);
  if (products === null) return Response.json({ error: "No pudimos comprobar la disponibilidad. Intenta de nuevo." }, { status: 503 });
  const catalogo = catalogoParaAsesor(products);
  const items = [];
  for (const seleccion of peticion.items) {
    const product = catalogo.find((p) => p.handle === seleccion.handle);
    const variant = product?.variantes.find((v) => v.id === seleccion.variantId);
    if (!product || !variant) return Response.json({ error: "Esta presentación ya no está disponible. Pide otra recomendación." }, { status: 409 });
    if (variant.price !== seleccion.precioEsperado) {
      return Response.json({ error: "El precio cambió. Pide una recomendación actualizada antes de agregarlo." }, { status: 409 });
    }
    items.push({
      line: { handle: product.handle, title: product.title, variantId: variant.id, variantTitle: variant.title, price: variant.price, image: variant.image },
      cantidad: seleccion.cantidad,
    });
  }
  return Response.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
