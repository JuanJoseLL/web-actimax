/** Límite local complementario. En Vercel, el límite global se configura en
 * Firewall para /api/asesor/*; no se añade un proveedor de almacenamiento. */
const intentos = new Map<string, { inicio: number; cantidad: number }>();
export function limitarAsesor(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Origen no permitido." }, { status: 403 });
  }
  const ip = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  for (const [key, value] of intentos) {
    if (now - value.inicio > 600_000) intentos.delete(key);
  }
  const entry = intentos.get(ip) ?? { inicio: now, cantidad: 0 };
  if (entry.cantidad >= 20 || (!intentos.has(ip) && intentos.size >= 5000)) {
    return Response.json({ error: "Has enviado varias consultas. Intenta de nuevo en unos minutos." }, { status: 429, headers: { "Retry-After": "600" } });
  }
  entry.cantidad++;
  intentos.set(ip, entry);
  return null;
}

export async function leerJsonLimitado(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Se requiere JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Falta el cuerpo.");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 48_000) {
        await reader.cancel();
        throw new Error("El mensaje es demasiado largo.");
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
