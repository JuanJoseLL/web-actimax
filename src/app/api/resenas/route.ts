import { NextResponse } from "next/server";
import { getProduct } from "@/lib/catalog";
import { shopifyProductId } from "@/lib/reviews";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const JUDGEME_REVIEWS_API = "https://judge.me/api/v1/reviews";
const RATE_WINDOW_MS = 60 * 60_000;
const RATE_MAX = 3;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (attempts.size > 5000) attempts.clear();
  const recent = (attempts.get(ip) ?? []).filter((time) => time > now - RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Has enviado varias reseñas. Espera un momento antes de intentar otra vez." },
      { status: 429 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  if (typeof rawBody !== "object" || rawBody === null || Array.isArray(rawBody)) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const body = rawBody as Record<string, unknown>;

  if (typeof body.sitioWeb === "string" && body.sitioWeb !== "") {
    return NextResponse.json({ ok: true });
  }

  const handle = typeof body.handle === "string" ? body.handle.trim() : "";
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const texto = typeof body.texto === "string" ? body.texto.trim() : "";
  const rating = body.rating;

  if (nombre.length < 2 || nombre.length > 80) {
    return NextResponse.json({ error: "Escribe tu nombre." }, { status: 400 });
  }
  if (!/^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json({ error: "Selecciona una calificación de 1 a 5 estrellas." }, { status: 400 });
  }
  if (texto.length < 5 || texto.length > 5000) {
    return NextResponse.json(
      { error: "La reseña debe tener entre 5 y 5000 caracteres." },
      { status: 400 },
    );
  }
  if (STORE_DOMAIN === undefined) {
    return NextResponse.json(
      { error: "Las reseñas no están disponibles en este momento." },
      { status: 503 },
    );
  }

  const product = await getProduct(handle);
  const externalId = product === undefined ? null : shopifyProductId(product.id);
  if (externalId === null) {
    return NextResponse.json({ error: "El producto no es válido." }, { status: 400 });
  }

  try {
    const response = await fetch(JUDGEME_REVIEWS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shop_domain: STORE_DOMAIN,
        platform: "shopify",
        id: externalId,
        name: nombre,
        email,
        rating,
        body: texto,
        ip_addr: ip !== "local" ? ip : undefined,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const result: { message?: string } = await response.json();
    if (!response.ok) {
      console.error(`[reviews] Judge.me rechazó la reseña (${response.status}):`, result.message);
      return NextResponse.json(
        { error: "No pudimos guardar tu reseña. Revisa los datos e inténtalo nuevamente." },
        { status: response.status === 429 ? 429 : 502 },
      );
    }
  } catch (error) {
    console.error("[reviews] no se pudo enviar la reseña a Judge.me:", error);
    return NextResponse.json(
      { error: "No pudimos conectar con el servicio de reseñas." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
