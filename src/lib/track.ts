"use client";

/**
 * Punto único de salida de eventos: cada `track` se registra en Vercel Web
 * Analytics y se reenvía a Google Analytics 4 y al pixel de Meta cuando los
 * IDs públicos están configurados (solo en producción, para no ensuciar las
 * propiedades con tráfico de desarrollo o previews).
 *
 * `compra` NO se reenvía a GA4 ni a Meta a propósito: el evento del sitio es
 * una aproximación que dispara cuando el comprador vuelve del checkout —sin
 * ID de pedido y a veces días después—. El Purchase canónico lo emite el
 * pixel instalado en el checkout de Shopify, que ve el pedido real;
 * reenviarlo desde acá duplicaría compras.
 */

import { sendGAEvent } from "@next/third-parties/google";
import { track as vercelTrack } from "@vercel/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type EventProps = Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: string, props?: EventProps): void {
  vercelTrack(event, props);
  if (typeof window === "undefined") return;
  if (GA_ID) sendToGoogle(event, props ?? {});
  if (META_PIXEL_ID) sendToMeta(event, props ?? {});
}

/* Los eventos del embudo se traducen a los nombres recomendados de ecommerce
   de GA4 (view_item, add_to_cart…) para que los informes de monetización los
   reconozcan; el resto viaja con su nombre y propiedades tal cual. */
function sendToGoogle(event: string, props: EventProps): void {
  switch (event) {
    case "compra":
      return;
    case "producto_visto":
      sendGAEvent("event", "view_item", { items: [{ item_id: props.producto }] });
      return;
    case "agregar_al_carrito":
      sendGAEvent("event", "add_to_cart", {
        items: [{ item_id: props.producto }],
        origen: props.origen,
      });
      return;
    case "ver_carrito":
      sendGAEvent("event", "view_cart", { currency: "COP", value: props.valor });
      return;
    case "iniciar_checkout":
      sendGAEvent("event", "begin_checkout", {
        currency: "COP",
        value: props.valor,
        via: props.via,
      });
      return;
    case "busqueda_paleta":
      sendGAEvent("event", "search", { search_term: props.consulta });
      return;
    default:
      sendGAEvent("event", event, props);
  }
}

/* A Meta solo van los eventos estándar que alimentan la optimización de
   anuncios; los demás no significan nada para el pixel. */
function sendToMeta(event: string, props: EventProps): void {
  const fbq = window.fbq;
  if (!fbq) return;
  switch (event) {
    case "producto_visto":
      fbq("track", "ViewContent", {
        content_ids: [props.producto],
        content_type: "product",
      });
      return;
    case "agregar_al_carrito":
      fbq("track", "AddToCart", {
        content_ids: [props.producto],
        content_type: "product",
      });
      return;
    case "iniciar_checkout":
      fbq("track", "InitiateCheckout", { currency: "COP", value: props.valor });
      return;
    case "busqueda_paleta":
      fbq("track", "Search", { search_string: props.consulta });
      return;
  }
}
