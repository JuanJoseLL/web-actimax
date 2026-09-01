const DESTINOS_LEAD_ENDPOINT =
  process.env.DESTINOS_LEAD_ENDPOINT ??
  "https://destinos-studio.vercel.app/api/destinos/lead";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "Solicitud inválida." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(DESTINOS_LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("No se pudo conectar con el formulario de Destinos.", error);
    return Response.json(
      {
        ok: false,
        message:
          "No fue posible enviar el formulario. Escríbenos por WhatsApp mientras lo resolvemos.",
      },
      { status: 502 },
    );
  }
}
