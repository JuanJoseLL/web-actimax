import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Fuerza el refresco del contenido cacheado (catálogo y blog).
 *
 * GET: refresco manual. Tras publicar o editar algo en Shopify, abrir esta
 * URL en el navegador actualiza la web al instante (guardarla como marcador).
 * Desde un navegador responde con una página amigable; desde un script, JSON.
 *
 * POST: webhook de Shopify (productos/colecciones). Ojo: Shopify ya no
 * ofrece webhooks para artículos del blog — el enum WebhookSubscriptionTopic
 * no tiene temas ARTICLES_* en ninguna versión reciente de la API — así que
 * el blog depende del GET manual o de la revalidación periódica. La firma se
 * valida con el client secret de la app (webhooks creados vía Admin API) o
 * con SHOPIFY_WEBHOOK_SECRET (webhooks creados desde el panel).
 */

function tagsForTopic(topic: string): string[] {
  if (topic.startsWith("articles/") || topic.startsWith("blogs/")) return ["blog"];
  if (topic.startsWith("products/") || topic.startsWith("collections/")) return ["catalog"];
  return ["catalog", "blog"];
}

export function GET(request: Request) {
  revalidateTag("catalog", "max");
  revalidateTag("blog", "max");

  if (request.headers.get("accept")?.includes("text/html") === true) {
    return new Response(
      `<!doctype html>
<html lang="es">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Contenido actualizado | Actimax</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f7f7f5;color:#0a1128">
  <main style="text-align:center;padding:2rem">
    <p style="font-size:3rem;margin:0">✅</p>
    <h1 style="font-size:1.4rem;margin:.5rem 0">¡Listo! La página ya muestra lo último de Shopify.</h1>
    <p style="color:#555">Si publicaste o editaste un artículo o producto, ya quedó visible.</p>
    <p style="margin-top:1.5rem">
      <a href="/blog/" style="color:#002f87;font-weight:600">Ver el blog</a> ·
      <a href="/productos/" style="color:#002f87;font-weight:600">Ver la tienda</a>
    </p>
  </main>
</body>
</html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  return NextResponse.json({ revalidado: true, fecha: new Date().toISOString() });
}

export async function POST(request: Request) {
  const body = await request.text();

  // Los webhooks creados desde el panel se firman con el secreto de la página
  // de notificaciones (SHOPIFY_WEBHOOK_SECRET); los creados vía Admin API por
  // nuestra app se firman con el client secret de la app.
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? process.env.SHOPIFY_CLIENT_SECRET;
  if (secret !== undefined && secret !== "") {
    const received = Buffer.from(request.headers.get("x-shopify-hmac-sha256") ?? "");
    const expected = Buffer.from(createHmac("sha256", secret).update(body, "utf8").digest("base64"));
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  const tags = tagsForTopic(topic);
  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ revalidado: true, topic, tags, fecha: new Date().toISOString() });
}
