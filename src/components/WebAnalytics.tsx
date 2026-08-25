"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/**
 * Web Analytics de Vercel sin las vistas del 404.
 *
 * Los bots que sondean URLs inexistentes (/en, rutas heredadas de WordPress…)
 * corren un Chrome headless con user-agent real, así que pasan el filtro por
 * user-agent que Vercel ya aplica y en agosto de 2026 llegaron a ser el 29% de
 * los "visitantes". Web Analytics cuenta al visitante desde su primera vista,
 * de modo que no enviar la del 404 los saca del tablero por completo; a un
 * humano que cae en un enlace roto se le sigue contando en cuanto llega a una
 * página real. El marcador lo pone src/app/not-found.tsx en el HTML, para que
 * funcione igual en la carga inicial y en las navegaciones internas.
 */
export function WebAnalytics() {
  return <Analytics beforeSend={descartarVistas404} />;
}

function descartarVistas404(evento: BeforeSendEvent): BeforeSendEvent | null {
  if (evento.type === "pageview" && document.querySelector("[data-pagina-404]")) return null;
  return evento;
}
