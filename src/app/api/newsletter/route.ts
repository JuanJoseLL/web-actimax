import { NextResponse } from "next/server";

/**
 * Suscripción al boletín: crea (o actualiza) el cliente en Shopify con
 * consentimiento de email marketing, para nutrir la base de datos desde el
 * propio sitio. Autenticación contra la Admin API igual que los scripts de
 * migración: SHOPIFY_ADMIN_TOKEN si existe, o un token temporal canjeado
 * con las client credentials de la app (SHOPIFY_CLIENT_ID/SECRET). Sin
 * credenciales respondemos 503 con un mensaje amable en vez de romper.
 */
const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = "2026-01";

let temporaryAdminToken: string | null = null;
let temporaryAdminTokenExpiresAt = 0;

async function getAdminToken(): Promise<string> {
  if (ADMIN_TOKEN !== undefined) return ADMIN_TOKEN;
  if (temporaryAdminToken !== null && Date.now() < temporaryAdminTokenExpiresAt - 60_000) {
    return temporaryAdminToken;
  }

  const response = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID as string,
      client_secret: CLIENT_SECRET as string,
    }),
  });
  const json: { access_token?: string; expires_in?: number } = await response.json();
  if (!response.ok || typeof json.access_token !== "string") {
    throw new Error(`No se pudo obtener token de Admin: ${response.status}`);
  }
  temporaryAdminToken = json.access_token;
  temporaryAdminTokenExpiresAt = Date.now() + (json.expires_in ?? 900) * 1000;
  return temporaryAdminToken;
}

const CUSTOMER_SEARCH = /* GraphQL */ `
  query buscarCliente($q: String!) {
    customers(first: 1, query: $q) {
      edges { node { id } }
    }
  }
`;

const CUSTOMER_CREATE = /* GraphQL */ `
  mutation crearSuscriptor($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const CONSENT_UPDATE = /* GraphQL */ `
  mutation actualizarConsentimiento($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

async function adminGraphQL(
  query: string,
  variables: Record<string, unknown>,
): Promise<{ data?: Record<string, unknown>; errors?: unknown }> {
  const response = await fetch(
    `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getAdminToken(),
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (response.status === 401 || response.status === 403) {
    /* Token revocado antes de su expiración: soltarlo para que el
       siguiente intento canjee uno nuevo en vez de fallar 15 min. */
    temporaryAdminToken = null;
  }
  if (!response.ok) throw new Error(`Shopify Admin respondió ${response.status}`);
  const json = await response.json();
  if (json.errors !== undefined) {
    throw new Error(`Errores GraphQL: ${JSON.stringify(json.errors)}`);
  }
  return json;
}

function userErrorsDe(data: unknown, mutation: string): Array<{ message: string }> {
  const payload = (data as Record<string, Record<string, unknown>> | undefined)?.[mutation];
  return (payload?.userErrors as Array<{ message: string }> | undefined) ?? [];
}

/**
 * Límite de intentos por IP (ventana de 10 min, por instancia). No es un
 * WAF: solo evita que un script contamine la base de clientes en bucle.
 */
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (attempts.size > 5000) attempts.clear();
  const recent = (attempts.get(ip) ?? []).filter((t) => t > now - RATE_WINDOW_MS);
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
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  let body: { email?: unknown; nombre?: unknown; apodo?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  /* Honeypot: los bots llenan el campo oculto; a ellos les decimos que sí. */
  if (typeof body.apodo === "string" && body.apodo !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const nombre = typeof body.nombre === "string" ? body.nombre.trim().slice(0, 80) : "";
  if (!/^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/.test(email)) {
    return NextResponse.json(
      { error: "Escribe un correo válido para suscribirte." },
      { status: 400 },
    );
  }

  const hasCredentials =
    ADMIN_TOKEN !== undefined || (CLIENT_ID !== undefined && CLIENT_SECRET !== undefined);
  if (STORE_DOMAIN === undefined || !hasCredentials) {
    return NextResponse.json(
      { error: "La suscripción no está disponible en este momento. Escríbenos por WhatsApp y te sumamos manualmente." },
      { status: 503 },
    );
  }

  const consent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: new Date().toISOString(),
  };

  try {
    const search = await adminGraphQL(CUSTOMER_SEARCH, { q: `email:'${email}'` });
    const existing = (
      search.data as
        | { customers?: { edges?: Array<{ node: { id: string } }> } }
        | undefined
    )?.customers?.edges?.[0]?.node;

    if (existing !== undefined) {
      const result = await adminGraphQL(CONSENT_UPDATE, {
        input: { customerId: existing.id, emailMarketingConsent: consent },
      });
      const errores = userErrorsDe(result.data, "customerEmailMarketingConsentUpdate");
      if (errores.length > 0) {
        throw new Error(
          `userErrors al actualizar consentimiento: ${errores.map((e) => e.message).join("; ")}`,
        );
      }
    } else {
      const result = await adminGraphQL(CUSTOMER_CREATE, {
        input: {
          email,
          ...(nombre !== "" ? { firstName: nombre } : {}),
          tags: ["newsletter", "blog"],
          emailMarketingConsent: consent,
        },
      });
      const errores = userErrorsDe(result.data, "customerCreate");
      if (errores.length > 0) {
        throw new Error(
          `userErrors al crear el cliente: ${errores.map((e) => e.message).join("; ")}`,
        );
      }
    }
  } catch (error) {
    console.error("[newsletter] fallo la suscripción:", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu correo. Inténtalo de nuevo en un momento." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
