import { NextResponse } from "next/server";

/**
 * Consulta si un carrito de Shopify sigue existiendo. Shopify elimina el
 * carrito al completarse la compra, así que `existe: false` significa que el
 * pedido se pagó (o que el carrito caducó tras ~10 días): en ambos casos el
 * carrito local debe vaciarse. Si sigue existiendo, el cliente abandonó el
 * checkout y su carrito se conserva.
 */

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2026-01";

const CART_QUERY = /* GraphQL */ `
  query CartExists($id: ID!) {
    cart(id: $id) {
      id
    }
  }
`;

interface CartQueryResponse {
  data?: { cart: { id: string } | null };
  errors?: Array<{ message: string }>;
}

export async function GET(request: Request) {
  if (STORE_DOMAIN === undefined || STOREFRONT_TOKEN === undefined) {
    return NextResponse.json({ error: "Shopify no está configurado." }, { status: 503 });
  }

  const cartId = new URL(request.url).searchParams.get("cart");
  if (cartId === null || !cartId.startsWith("gid://shopify/Cart/")) {
    return NextResponse.json({ error: "Identificador de carrito inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query: CART_QUERY, variables: { id: cartId } }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Shopify no respondió." }, { status: 502 });
    }
    const result: CartQueryResponse = await response.json();
    if (result.data === undefined) {
      return NextResponse.json({ error: "Shopify no respondió." }, { status: 502 });
    }
    return NextResponse.json({ existe: result.data.cart !== null });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con Shopify." }, { status: 502 });
  }
}
