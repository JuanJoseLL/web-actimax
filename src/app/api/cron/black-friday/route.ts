import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import snapshot from "@/data/black-friday-precios.json";
import {
  faseBlackFriday,
  sincronizarPrecios,
  type ModoPrecios,
  type ProductoSnapshot,
} from "@/lib/black-friday";
import { adminGraphQL, hayCredencialesAdmin } from "@/lib/shopify-admin";

/**
 * Pone y quita los precios de Black Friday (ver src/lib/black-friday.ts).
 *
 * La llama el cron de Vercel (vercel.json) a la hora de inicio y a la de
 * cierre; Vercel manda `Authorization: Bearer $CRON_SECRET`. Qué hacer lo
 * decide el reloj, no quien llama: durante la promo deja los precios
 * rebajados, en los tres días siguientes al cierre los devuelve, y fuera de
 * eso no hace nada. Así un disparo repetido, atrasado o del año que viene es
 * inofensivo.
 *
 * `?accion=aplicar|revertir` se salta el reloj, para el respaldo manual
 * (misma cabecera Authorization).
 *
 * Al terminar invalida `catalog`: los webhooks de producto ya lo hacen, pero
 * el banner (BlackFriday.tsx) se prende y se apaga con esa misma etiqueta y
 * tiene que evaluarse después de la hora, no antes.
 */
function autorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (secreto === undefined || secreto === "") return false;
  const recibido = Buffer.from(request.headers.get("authorization") ?? "");
  const esperado = Buffer.from(`Bearer ${secreto}`);
  return recibido.length === esperado.length && timingSafeEqual(recibido, esperado);
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hayCredencialesAdmin()) {
    return NextResponse.json({ error: "Sin credenciales de Admin" }, { status: 503 });
  }

  const accion = new URL(request.url).searchParams.get("accion");
  const fase = faseBlackFriday(new Date());
  let modo: ModoPrecios | null = null;
  if (accion === "aplicar" || accion === "revertir") modo = accion;
  else if (fase === "activa") modo = "aplicar";
  else if (fase === "revertir") modo = "revertir";

  if (modo === null) {
    return NextResponse.json({ fase, hecho: "nada" });
  }

  const resultado = await sincronizarPrecios(
    adminGraphQL,
    snapshot as ProductoSnapshot[],
    modo,
  );
  revalidateTag("catalog", "max");

  console.log("[black-friday]", JSON.stringify({ fase, ...resultado }));
  /* 500 si algo quedó sin mover: Vercel lo marca como cron fallido y se ve
     en el panel sin tener que leer el log. */
  return NextResponse.json(
    { fase, ...resultado },
    { status: resultado.omitidas > 0 ? 500 : 200 },
  );
}
