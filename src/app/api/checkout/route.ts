import { NextResponse } from "next/server";
import { findShortedLines, type CheckoutLine } from "@/lib/checkout-lines";

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";

/* Se piden las líneas del carrito creado porque Shopify no reporta el stock
   insuficiente como userError: descarta o recorta la línea y devuelve un
   checkoutUrl válido; hay que comparar lo devuelto contra lo pedido. */
const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) @inContext(language: ES, country: CO) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        lines(first: 250) {
          nodes {
            quantity
            merchandise {
              ... on ProductVariant {
                id
              }
            }
          }
        }
      }
      userErrors {
        message
      }
    }
  }
`;

interface CartCreateResponse {
  data?: {
    cartCreate?: {
      cart: {
        id: string;
        checkoutUrl: string;
        lines: {
          nodes: Array<{ quantity: number; merchandise: { id?: string } }>;
        };
      } | null;
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
      /* La cédula ya no viaja como atributo: el checkout la exige en el campo
         "CC o NIT" de la dirección de envío (Empresa renombrado y obligatorio)
         y queda en shippingAddress.company del pedido. Los pedidos viejos
         conservan su atributo "Cédula". */
      body: JSON.stringify({
        query: CART_CREATE_MUTATION,
        variables: { input: { lines } },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.error(`Shopify respondió ${response.status} al crear el carrito.`);
      return NextResponse.json({ error: "Shopify no pudo iniciar el pago." }, { status: 502 });
    }

    const result: CartCreateResponse = await response.json();
    const cartResult = result.data?.cartCreate;
    const cart = cartResult?.cart;

    if (cart === null || cart === undefined) {
      const message = cartResult?.userErrors[0]?.message ?? result.errors?.[0]?.message;
      console.error("Shopify no devolvió una URL de checkout.", message);
      return NextResponse.json(
        { error: message ?? "Shopify no pudo crear el carrito." },
        { status: 422 },
      );
    }

    const grantedLines: CheckoutLine[] = cart.lines.nodes
      .filter((node) => typeof node.merchandise.id === "string")
      .map((node) => ({ merchandiseId: node.merchandise.id as string, quantity: node.quantity }));
    const shorted = findShortedLines(lines, grantedLines);
    if (shorted.length > 0) {
      return NextResponse.json(
        {
          error: "Algunos productos del carrito ya no están disponibles en la cantidad pedida.",
          shorted,
        },
        { status: 409 },
      );
    }

    // El permalink del carrito ignora el idioma del contexto y cae en el locale
    // primario de la tienda (inglés); solo el parámetro `locale` fuerza el
    // checkout en español con formato de pesos colombiano.
    const localizedUrl = new URL(cart.checkoutUrl);
    localizedUrl.searchParams.set("locale", "es-CO");

    return NextResponse.json({ checkoutUrl: localizedUrl.toString(), cartId: cart.id });
  } catch (error) {
    console.error("No se pudo crear el carrito de Shopify.", error);
    return NextResponse.json({ error: "No se pudo conectar con Shopify." }, { status: 502 });
  }
}
