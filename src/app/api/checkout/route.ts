import { NextResponse } from "next/server";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) @inContext(language: ES, country: CO) {
    cartCreate(input: $input) {
      cart {
        checkoutUrl
      }
      userErrors {
        message
      }
    }
  }
`;

interface CheckoutLine {
  merchandiseId: string;
  quantity: number;
}

interface CartCreateResponse {
  data?: {
    cartCreate?: {
      cart: { checkoutUrl: string } | null;
      userErrors: Array<{ message: string }>;
    };
  };
  errors?: Array<{ message: string }>;
}

function isCheckoutLine(value: unknown): value is CheckoutLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.merchandiseId === "string" &&
    line.merchandiseId.startsWith("gid://shopify/ProductVariant/") &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    line.quantity <= 250
  );
}

export async function POST(request: Request) {
  if (STORE_DOMAIN === undefined || STOREFRONT_TOKEN === undefined) {
    return NextResponse.json(
      { error: "La conexión con Shopify no está configurada." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La solicitud de pago no es válida." }, { status: 400 });
  }

  const lines =
    typeof body === "object" && body !== null && Array.isArray((body as { lines?: unknown }).lines)
      ? (body as { lines: unknown[] }).lines
      : null;

  if (lines === null || lines.length === 0 || lines.length > 250 || !lines.every(isCheckoutLine)) {
    return NextResponse.json({ error: "El carrito no contiene productos válidos." }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
    };
    const buyerIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (buyerIp !== undefined && buyerIp !== "") {
      headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
    }

    const response = await fetch(`https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: CART_CREATE_MUTATION,
        variables: { input: { lines } },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Shopify respondió ${response.status} al crear el carrito.`);
      return NextResponse.json({ error: "Shopify no pudo iniciar el pago." }, { status: 502 });
    }

    const result: CartCreateResponse = await response.json();
    const cartResult = result.data?.cartCreate;
    const checkoutUrl = cartResult?.cart?.checkoutUrl;

    if (checkoutUrl === undefined) {
      const message = cartResult?.userErrors[0]?.message ?? result.errors?.[0]?.message;
      console.error("Shopify no devolvió una URL de checkout.", message);
      return NextResponse.json(
        { error: message ?? "Shopify no pudo crear el carrito." },
        { status: 422 },
      );
    }

    // El permalink del carrito ignora el idioma del contexto y cae en el locale
    // primario de la tienda (inglés); solo el parámetro `locale` fuerza el
    // checkout en español con formato de pesos colombiano.
    const localizedUrl = new URL(checkoutUrl);
    localizedUrl.searchParams.set("locale", "es-CO");

    return NextResponse.json({ checkoutUrl: localizedUrl.toString() });
  } catch (error) {
    console.error("No se pudo crear el carrito de Shopify.", error);
    return NextResponse.json({ error: "No se pudo conectar con Shopify." }, { status: 502 });
  }
}
