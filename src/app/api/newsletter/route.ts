import { NextResponse } from "next/server";
import { partirNombre, validarSuscripcion } from "@/lib/newsletter";

/**
 * Suscripción al boletín: crea (o actualiza) el cliente en Shopify con
 * consentimiento de email marketing, para nutrir la base de datos desde el
 * propio sitio. Autenticación contra la Admin API igual que los scripts de
 * migración: SHOPIFY_ADMIN_TOKEN si existe, o un token temporal canjeado
 * con las client credentials de la app (SHOPIFY_CLIENT_ID/SECRET). Sin
 * credenciales respondemos 503 con un mensaje amable en vez de romper.
 *
 * El cumpleaños y la autorización de tratamiento de datos se guardan como
 * metafields del cliente (`facts.birth_date` y
 * `custom.politica_datos_aceptada`), definidos en Configuración → Datos
 * personalizados → Clientes para que se vean en la ficha y sirvan para
 * segmentar campañas.
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
      edges { node { id firstName } }
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

const CUSTOMER_UPDATE = /* GraphQL */ `
  mutation completarPerfil($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`;

const METAFIELDS_SET = /* GraphQL */ `
  mutation guardarDatos($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
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

/**
 * Cumpleaños, autorización de datos y el nombre que le faltaba a un cliente
 * viejo. Va aparte y sin romper la respuesta a propósito: si Shopify rechaza
 * un metafield, el correo ya quedó suscrito y perder eso por un dato
 * accesorio sería el peor negocio posible. Queda en el log para revisarlo.
 */
async function guardarDatosAdicionales(
  customerId: string,
  nacimiento: string | null,
  nombre: string,
  aceptadoEn: string,
  faltaNombre: boolean,
): Promise<void> {
  const metafields = [
    {
      ownerId: customerId,
      namespace: "custom",
      key: "politica_datos_aceptada",
      type: "date_time",
      value: aceptadoEn,
    },
    ...(nacimiento !== null
      ? [
          {
            ownerId: customerId,
            namespace: "facts",
            key: "birth_date",
            type: "date",
            value: nacimiento,
          },
        ]
      : []),
  ];

  try {
    const result = await adminGraphQL(METAFIELDS_SET, { metafields });
    const errores = userErrorsDe(result.data, "metafieldsSet");
    if (errores.length > 0) {
      throw new Error(errores.map((e) => e.message).join("; "));
    }

    if (faltaNombre) {
      const { firstName, lastName } = partirNombre(nombre);
      await adminGraphQL(CUSTOMER_UPDATE, {
        input: { id: customerId, firstName, ...(lastName !== "" ? { lastName } : {}) },
      });
    }
  } catch (error) {
    console.error("[newsletter] no se pudieron guardar los datos adicionales:", error);
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  /* Honeypot: los bots llenan el campo oculto; a ellos les decimos que sí. */
  if (typeof body.apodo === "string" && body.apodo !== "") {
    return NextResponse.json({ ok: true });
  }

  const validacion = validarSuscripcion(body);
  if (!validacion.ok) {
    return NextResponse.json({ error: validacion.error }, { status: 400 });
  }
  const { email, nombre, nacimiento } = validacion.datos;

  const hasCredentials =
    ADMIN_TOKEN !== undefined || (CLIENT_ID !== undefined && CLIENT_SECRET !== undefined);
  if (STORE_DOMAIN === undefined || !hasCredentials) {
    return NextResponse.json(
      { error: "La suscripción no está disponible en este momento. Escríbenos por WhatsApp y te sumamos manualmente." },
      { status: 503 },
    );
  }

  const aceptadoEn = new Date().toISOString();
  const consent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: aceptadoEn,
  };

  let customerId: string;
  let faltaNombre: boolean;

  try {
    const search = await adminGraphQL(CUSTOMER_SEARCH, { q: `email:'${email}'` });
    const existing = (
      search.data as
        | { customers?: { edges?: Array<{ node: { id: string; firstName: string | null } }> } }
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
      customerId = existing.id;
      /* Un cliente viejo puede venir sin nombre (por ejemplo, importado del
         sitio anterior): esta es la ocasión de completarlo. */
      faltaNombre = existing.firstName === null || existing.firstName.trim() === "";
    } else {
      const { firstName, lastName } = partirNombre(nombre);
      const result = await adminGraphQL(CUSTOMER_CREATE, {
        input: {
          email,
          firstName,
          ...(lastName !== "" ? { lastName } : {}),
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
      const creado = (
        result.data as { customerCreate?: { customer?: { id: string } | null } } | undefined
      )?.customerCreate?.customer;
      if (creado === undefined || creado === null) {
        throw new Error("Shopify no devolvió el cliente creado");
      }
      customerId = creado.id;
      faltaNombre = false;
    }
  } catch (error) {
    console.error("[newsletter] fallo la suscripción:", error);
    return NextResponse.json(
      { error: "No pudimos registrar tu correo. Inténtalo de nuevo en un momento." },
      { status: 502 },
    );
  }

  await guardarDatosAdicionales(customerId, nacimiento, nombre, aceptadoEn, faltaNombre);

  return NextResponse.json({ ok: true });
}
