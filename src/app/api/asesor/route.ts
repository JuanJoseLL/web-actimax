import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { getCatalogoAsesor } from "@/lib/catalog";
import { RecomendacionNoValidadaError, responderAsesor } from "@/lib/asesor/agente";
import { catalogoParaAsesor } from "@/lib/asesor/catalogo";
import { leerConversacion, type MensajeAsesor } from "@/lib/asesor/contrato";
import { leerJsonLimitado, limitarAsesor } from "@/lib/asesor/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  const limited = limitarAsesor(request);
  if (limited) return limited;
  let messages;
  try {
    messages = leerConversacion(await leerJsonLimitado(request));
  } catch {
    return Response.json({ error: "Revisa tu mensaje o empieza una conversación nueva." }, { status: 400 });
  }
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json({ error: "El asesor está en preparación. Mientras tanto puedes usar la calculadora de Mi Plan." }, { status: 503 });
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]);
  const stream = createUIMessageStream<MensajeAsesor>({
    execute: async ({ writer }) => {
      writer.write({ type: "start" });
      const estado = (data: string) => writer.write({ type: "data-estado", data, transient: true });
      estado("Consultando productos y disponibilidad…");
      const products = await getCatalogoAsesor(signal);
      if (products === null) throw new Error("catalog-unavailable");
      const result = await responderAsesor(messages, catalogoParaAsesor(products), signal, estado);
      // El texto se publica después de validación + Jev, nunca antes.
      writer.write({ type: "text-start", id: "respuesta" });
      writer.write({ type: "text-delta", id: "respuesta", delta: result.mensaje });
      writer.write({ type: "text-end", id: "respuesta" });
      if (result.resultado.recomendaciones.length) {
        writer.write({ type: "data-recomendacion", data: result.resultado });
      }
      writer.write({ type: "finish", finishReason: "stop" });
    },
    onError: (error) => {
      // No registrar conversaciones ni datos del perfil.
      console.error("Asesor no disponible:", error instanceof Error ? error.name : "UnknownError");
      if (error instanceof RecomendacionNoValidadaError) return error.message;
      return "No pude completar la consulta. Intenta de nuevo o usa la calculadora de Mi Plan.";
    },
  });
  return createUIMessageStreamResponse({ stream, headers: { "Cache-Control": "no-store" } });
}
