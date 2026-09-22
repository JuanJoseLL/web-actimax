import { z } from "zod";
import type { UIMessage } from "ai";
import type { ProductoAsesor, VarianteAsesor } from "./catalogo";

export const perfilSchema = z.object({
  deporte: z.string().max(80).nullable(),
  duracionMinutos: z.number().min(1).max(1440).nullable(),
  sesionesSemanales: z.number().int().min(1).max(21).nullable(),
  cafeina: z.enum(["sin", "permitida", "sin_confirmar"]),
  restricciones: z.array(z.enum(["vegano", "sinLacteos", "sinGluten", "sinSoya"])).max(4),
  presupuestoCOP: z.number().positive().max(10_000_000).nullable(),
});

/** Tope de seguridad de la respuesta, no un cupo de asesoría: cubrir las tres
 * etapas con energía e hidratación a la vez cabe de sobra por debajo. */
export const MAX_RECOMENDACIONES = 6;

export const respuestaSchema = z.object({
  mensaje: z.string().min(1).max(2000),
  perfil: perfilSchema,
  recomendaciones: z.array(z.object({
    handle: z.string().max(120),
    variantId: z.string().max(100),
    motivo: z.string().min(1).max(350),
    momento: z.enum(["antes", "durante", "despues"]),
    /** No confundir porciones de consumo con cajas compradas. */
    porcionesNecesarias: z.number().positive().max(200).nullable(),
  })).max(MAX_RECOMENDACIONES),
});

export type PerfilAsesor = z.infer<typeof perfilSchema>;
export type RespuestaAsesor = z.infer<typeof respuestaSchema>;

export interface RecomendacionAsesor {
  producto: Omit<ProductoAsesor, "variantes">;
  variante: VarianteAsesor;
  motivo: string;
  momento: "antes" | "durante" | "despues";
  cantidad: number;
  porcionesNecesarias: number | null;
  subtotal: number;
}

export interface ResultadoAsesor {
  recomendaciones: RecomendacionAsesor[];
  total: number;
}

export type MensajeAsesor = UIMessage<never, { recomendacion: ResultadoAsesor; estado: string }>;

/** Solo texto conversacional del navegador. Se descartan herramientas, tarjetas,
 * metadatos e instrucciones de sistema: nunca son evidencia de catálogo. */
const mensajeEntradaSchema = z.object({
  role: z.enum(["user", "assistant"]),
  parts: z.array(z.unknown()).max(30),
});
export function leerConversacion(value: unknown): Array<{ role: "user" | "assistant"; content: string }> {
  const parsed = z.object({ messages: z.array(mensajeEntradaSchema).min(1).max(24) }).parse(value);
  const messages = parsed.messages.map((message) => ({
    role: message.role,
    content: message.parts.flatMap((part) => {
      const text = z.object({ type: z.literal("text"), text: z.string().max(6000) }).safeParse(part);
      return text.success ? [text.data.text] : [];
    }).join("\n"),
  })).filter((message) => message.content.trim().length > 0);
  if (!messages.length || messages.at(-1)?.role !== "user" || messages.reduce((sum, m) => sum + m.content.length, 0) > 24000) {
    throw new Error("Conversación inválida o demasiado larga.");
  }
  return messages;
}
