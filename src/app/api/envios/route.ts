import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rutaRastreo, transportadoraPorEmpresa } from "@/lib/rastreo";
import { ShopifyAdminError, adminGraphQL, hayCredencialesAdmin } from "@/lib/shopify-admin";
import { SITE_URL } from "@/lib/seo";

/**
 * Webhook de preparaciones de Shopify (`fulfillments/create` y
 * `fulfillments/update`). Hace dos cosas en cuanto alguien escribe una guía:
 *
 * 1. Si la guía quedó sin URL de rastreo, le pone la nuestra
 *    (/rastreo/?guia=…). Sin URL, Shopify pinta el número como texto plano y
 *    el cliente no puede rastrear nada — es lo que pasaba con las guías de
 *    Envía (Colvanes), que no está en la lista de transportadoras de Shopify.
 *
 * 2. Marca el envío como "En tránsito". El pedido tiene que pasar por
 *    "Preparado" sí o sí (en Shopify la guía vive dentro de la preparación),
 *    pero el estado de envío se pinta encima, así que el pedido deja de
 *    quedarse en "Preparado" en cuanto sale.
 *
 * La URL del webhook debe llevar barra final (/api/envios/): Next responde
 * 308 sin ella y Shopify no sigue redirects — el envío contaría como fallido.
 */

/* Cuando se registra la guía el paquete todavía no está entregado; lo honesto
   es "En tránsito". Los demás estados (OUT_FOR_DELIVERY, DELIVERED) los daría
   la transportadora, y Envía no nos avisa de nada. */
const ESTADO_AL_DESPACHAR = "IN_TRANSIT";

const TEMAS_ATENDIDOS = ["fulfillments/create", "fulfillments/update"];

interface PreparacionShopify {
  admin_graphql_api_id?: string;
  status?: string;
  tracking_company?: string | null;
  tracking_number?: string | null;
  tracking_numbers?: string[] | null;
  tracking_url?: string | null;
  tracking_urls?: string[] | null;
}

interface ConsultaPreparacion {
  fulfillment: {
    displayStatus: string | null;
    events: { nodes: Array<{ status: string }> };
  } | null;
}

const CONSULTAR_PREPARACION = /* GraphQL */ `
  query preparacion($id: ID!) {
    fulfillment(id: $id) {
      displayStatus
      events(first: 1) {
        nodes {
          status
        }
      }
    }
  }
`;

const ACTUALIZAR_RASTREO = /* GraphQL */ `
  mutation rastreo($id: ID!, $info: FulfillmentTrackingInput!) {
    fulfillmentTrackingInfoUpdate(fulfillmentId: $id, trackingInfoInput: $info, notifyCustomer: false) {
      userErrors {
        field
        message
      }
    }
  }
`;

const CREAR_EVENTO = /* GraphQL */ `
  mutation evento($evento: FulfillmentEventInput!) {
    fulfillmentEventCreate(fulfillmentEvent: $evento) {
      userErrors {
        field
        message
      }
    }
  }
`;

function primeroNoVacio(...valores: Array<string | null | undefined>): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim() !== "") return valor.trim();
  }
  return "";
}

/**
 * Shopify firma con un secreto distinto según quién creó la suscripción: los
 * webhooks hechos desde el panel llevan el secreto de la página de
 * notificaciones (SHOPIFY_WEBHOOK_SECRET) y los que crea la app por Admin API
 * llevan su client secret. Como los dos están configurados y no sabemos de
 * antemano cuál usó Shopify, se prueban ambos.
 */
function firmaValida(cuerpo: string, firmaRecibida: string, secretos: string[]): boolean {
  const recibida = Buffer.from(firmaRecibida);
  return secretos.some((secreto) => {
    const esperada = Buffer.from(
      createHmac("sha256", secreto).update(cuerpo, "utf8").digest("base64"),
    );
    return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
  });
}

function errores(datos: unknown, mutacion: string): Array<{ message: string }> {
  const payload = (datos as Record<string, Record<string, unknown>> | undefined)?.[mutacion];
  return (payload?.userErrors as Array<{ message: string }> | undefined) ?? [];
}

export async function POST(request: Request) {
  const cuerpo = await request.text();

  /* Sin secreto no se valida nada, y esta ruta escribe en los pedidos:
     dejarla pasar sin firma sería un botón público para tocarlos. */
  const secretos = [process.env.SHOPIFY_WEBHOOK_SECRET, process.env.SHOPIFY_CLIENT_SECRET].filter(
    (secreto): secreto is string => secreto !== undefined && secreto !== "",
  );
  if (secretos.length === 0) {
    return NextResponse.json({ error: "Webhook sin secreto configurado" }, { status: 401 });
  }
  if (!firmaValida(cuerpo, request.headers.get("x-shopify-hmac-sha256") ?? "", secretos)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const tema = request.headers.get("x-shopify-topic") ?? "";
  if (!TEMAS_ATENDIDOS.includes(tema)) {
    return NextResponse.json({ atendido: false, motivo: `Tema ignorado: ${tema}` });
  }
  if (!hayCredencialesAdmin()) {
    return NextResponse.json({ error: "Faltan credenciales de Admin API" }, { status: 503 });
  }

  let preparacion: PreparacionShopify;
  try {
    preparacion = JSON.parse(cuerpo);
  } catch {
    return NextResponse.json({ error: "Cuerpo no es JSON" }, { status: 400 });
  }

  const id = preparacion.admin_graphql_api_id;
  if (typeof id !== "string" || !id.startsWith("gid://shopify/Fulfillment/")) {
    return NextResponse.json({ atendido: false, motivo: "Sin id de preparación" });
  }
  // Una preparación cancelada no tiene envío que rastrear ni que despachar.
  if (preparacion.status !== undefined && preparacion.status !== "success") {
    return NextResponse.json({ atendido: false, motivo: `Preparación ${preparacion.status}` });
  }

  const numeros = (preparacion.tracking_numbers ?? []).filter((n) => n.trim() !== "");
  const numero = primeroNoVacio(preparacion.tracking_number, numeros[0]);
  if (numero === "") {
    // Prepararon sin guía: no hay nada que enlazar ni nada que haya salido.
    return NextResponse.json({ atendido: false, motivo: "Preparación sin guía" });
  }

  const urlActual = primeroNoVacio(preparacion.tracking_url, (preparacion.tracking_urls ?? [])[0]);
  const empresa = preparacion.tracking_company ?? "";

  try {
    const { fulfillment } = await adminGraphQL<ConsultaPreparacion>(CONSULTAR_PREPARACION, { id });
    const hecho: string[] = [];

    // 1. URL de rastreo, solo si Shopify no armó una. Coordinadora ya trae la
    //    suya y no hay que pisarla; tampoco una que hayan pegado a mano.
    if (urlActual === "") {
      const transportadora = transportadoraPorEmpresa(empresa);
      const nuestra = `${SITE_URL}${rutaRastreo(numero, transportadora?.slug)}`;
      /* Con varias guías hay que mandarlas todas: `number`/`url` en singular
         reemplazan la lista entera y perderíamos los demás paquetes. */
      const info =
        numeros.length > 1
          ? { company: empresa, numbers: numeros, urls: numeros.map((n) => `${SITE_URL}${rutaRastreo(n, transportadora?.slug)}`) }
          : { company: empresa, number: numero, url: nuestra };

      const datos = await adminGraphQL(ACTUALIZAR_RASTREO, { id, info });
      const fallos = errores(datos, "fulfillmentTrackingInfoUpdate");
      if (fallos.length > 0) {
        console.error("[envios] no se pudo escribir la URL de rastreo:", fallos);
      } else {
        hecho.push("url");
      }
    }

    // 2. Estado de envío. Si ya hay algún evento, la transportadora o alguien
    //    del equipo va por delante nuestro: no lo pisamos.
    if ((fulfillment?.events.nodes.length ?? 0) === 0) {
      const datos = await adminGraphQL(CREAR_EVENTO, {
        evento: { fulfillmentId: id, status: ESTADO_AL_DESPACHAR },
      });
      const fallos = errores(datos, "fulfillmentEventCreate");
      if (fallos.length > 0) {
        console.error("[envios] no se pudo marcar el envío:", fallos);
      } else {
        hecho.push("estado");
      }
    }

    return NextResponse.json({ atendido: true, tema, guia: numero, hecho });
  } catch (error) {
    if (error instanceof ShopifyAdminError && error.accesoDenegado) {
      /* A la app le faltan scopes (write_merchant_managed_fulfillment_orders
         y write_fulfillments). Reintentar no arregla nada, así que 200 para
         que Shopify no repita el envío 8 veces; queda en los logs. */
      console.error("[envios] faltan permisos en la app de Shopify:", error.message);
      return NextResponse.json({ atendido: false, motivo: "Faltan permisos" });
    }
    // Caída pasajera: 500 para que Shopify lo reintente.
    console.error("[envios] error hablando con Shopify:", error);
    return NextResponse.json({ error: "Fallo al actualizar la preparación" }, { status: 500 });
  }
}
