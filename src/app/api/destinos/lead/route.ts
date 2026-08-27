import { NextRequest, NextResponse } from "next/server";

type LeadPayload = {
  name?: string;
  email?: string;
  phone?: string;
  experience?: string;
  consent?: boolean;
  website?: string;
  startedAt?: number;
};

function clean(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let body: LeadPayload;

  try {
    body = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Solicitud inválida." },
      { status: 400 },
    );
  }

  if (clean(body.website, 120)) {
    return NextResponse.json({ ok: true });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 180);
  const phone = clean(body.phone, 80);
  const experience = clean(body.experience, 180);
  const consent = body.consent === true;
  const startedAt = Number(body.startedAt || 0);

  if (!name || !email || !phone || !experience || !consent) {
    return NextResponse.json(
      { ok: false, message: "Completa todos los campos obligatorios." },
      { status: 400 },
    );
  }

  if (!validEmail(email)) {
    return NextResponse.json(
      { ok: false, message: "Revisa el correo electrónico." },
      { status: 400 },
    );
  }

  if (startedAt > 0 && Date.now() - startedAt < 800) {
    return NextResponse.json(
      { ok: false, message: "Espera un momento y vuelve a enviar." },
      { status: 429 },
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.DESTINOS_FROM_EMAIL;

  if (!resendKey || !from) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "El formulario está preparado, pero falta activar el correo del entorno.",
      },
      { status: 503 },
    );
  }

  const html = `
    <h2>Nueva preinscripción · Destinos Actimax × WOPU</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
    <p><strong>Teléfono / WhatsApp:</strong> ${escapeHtml(phone)}</p>
    <p><strong>Experiencia:</strong> ${escapeHtml(experience)}</p>
    <p><strong>Consentimiento:</strong> Sí</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: ["info@woputravel.com"],
        reply_to: email,
        subject: `Destinos · ${experience} · ${name}`,
        html,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Destinos Resend error:", response.status, detail);
      return NextResponse.json(
        {
          ok: false,
          message:
            "No fue posible enviar el formulario. Escríbenos por WhatsApp mientras lo resolvemos.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Destinos lead error:", error);
    return NextResponse.json(
      {
        ok: false,
        message:
          "No fue posible enviar el formulario. Escríbenos por WhatsApp mientras lo resolvemos.",
      },
      { status: 500 },
    );
  }
}
