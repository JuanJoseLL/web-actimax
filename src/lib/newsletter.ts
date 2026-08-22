/**
 * Reglas de la suscripción al boletín. Viven acá porque el formulario y la
 * ruta `/api/newsletter` tienen que decidir igual: el navegador valida para
 * responder al instante, pero un POST directo se salta el HTML y el servidor
 * es el único que de verdad protege la base de clientes.
 */

/** El cumpleaños tal como lo escribe la persona: tres casillas sueltas. */
export interface NacimientoCrudo {
  dia: string;
  mes: string;
  anio: string;
}

export type ResultadoNacimiento =
  | { ok: true; iso: string | null }
  | { ok: false; error: string };

export interface DatosSuscripcion {
  email: string;
  nombre: string;
  /** `AAAA-MM-DD`, o `null` si prefirió no compartir su cumpleaños. */
  nacimiento: string | null;
}

export type ResultadoSuscripcion =
  | { ok: true; datos: DatosSuscripcion }
  | { ok: false; error: string };

/* Los mismos textos en el formulario y en la ruta: quien reciba el error no
   debería notar cuál de los dos lo rechazó. */
export const MENSAJES = {
  nombre: "Escribe tu nombre para saber a quién le escribimos.",
  email: "Escribe un correo válido para suscribirte.",
  nacimientoIncompleto: "Escribe tu fecha de nacimiento completa: día, mes y año.",
  nacimientoInvalido: "Esa fecha de nacimiento no existe. Revísala e inténtalo de nuevo.",
  politica: "Marca la casilla de la política de tratamiento de datos para suscribirte.",
} as const;

const NOMBRE_MAX = 80;
const ANIO_MIN = 1900;
const EMAIL = /^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]+$/;

/**
 * El cumpleaños es opcional —volverlo obligatorio costaría suscriptores—,
 * pero a medias no sirve: sin los tres números no hay a quién felicitar, así
 * que una fecha incompleta se rechaza en vez de guardarse rota.
 */
export function normalizarNacimiento(
  crudo: NacimientoCrudo,
  hoy: Date = new Date(),
): ResultadoNacimiento {
  const dia = crudo.dia.trim();
  const mes = crudo.mes.trim();
  const anio = crudo.anio.trim();

  if (dia === "" && mes === "" && anio === "") return { ok: true, iso: null };
  if (dia === "" || mes === "" || anio === "") {
    return { ok: false, error: MENSAJES.nacimientoIncompleto };
  }
  if (!/^\d{1,2}$/.test(dia) || !/^\d{1,2}$/.test(mes) || !/^\d{4}$/.test(anio)) {
    return { ok: false, error: MENSAJES.nacimientoInvalido };
  }

  const numeroDia = Number(dia);
  const numeroMes = Number(mes);
  const numeroAnio = Number(anio);
  const fecha = new Date(Date.UTC(numeroAnio, numeroMes - 1, numeroDia));

  /* El constructor "corrige" en silencio el 31 de febrero al 3 de marzo; si
     los números no vuelven iguales es que esa fecha nunca existió. */
  if (
    fecha.getUTCFullYear() !== numeroAnio ||
    fecha.getUTCMonth() !== numeroMes - 1 ||
    fecha.getUTCDate() !== numeroDia
  ) {
    return { ok: false, error: MENSAJES.nacimientoInvalido };
  }
  if (numeroAnio < ANIO_MIN || fecha.getTime() > hoy.getTime()) {
    return { ok: false, error: MENSAJES.nacimientoInvalido };
  }

  return {
    ok: true,
    iso: `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`,
  };
}

/**
 * Shopify guarda nombre y apellido por separado y sus correos saludan con el
 * nombre solo. Como el formulario pide un campo único, la primera palabra es
 * el nombre y el resto el apellido: "Ana María Ruiz" saluda "Hola, Ana" y no
 * "Hola, Ana María Ruiz".
 */
export function partirNombre(nombre: string): { firstName: string; lastName: string } {
  const partes = nombre.split(" ");
  return { firstName: partes[0], lastName: partes.slice(1).join(" ") };
}

function texto(objeto: unknown, clave: string): string {
  const valor = (objeto as Record<string, unknown> | null | undefined)?.[clave];
  return typeof valor === "string" ? valor : "";
}

/**
 * Puerta única de la suscripción. Nombre y correo son obligatorios porque sin
 * ellos no se sabe a quién se le escribe, y la casilla de tratamiento de
 * datos es la autorización que exige la ley colombiana: sin ella no hay nada
 * que registrar.
 */
export function validarSuscripcion(
  cuerpo: Record<string, unknown>,
  hoy: Date = new Date(),
): ResultadoSuscripcion {
  const nombre =
    typeof cuerpo.nombre === "string"
      ? cuerpo.nombre.trim().replace(/\s+/g, " ").slice(0, NOMBRE_MAX)
      : "";
  if (nombre.length < 2) return { ok: false, error: MENSAJES.nombre };

  const email = typeof cuerpo.email === "string" ? cuerpo.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL.test(email)) return { ok: false, error: MENSAJES.email };

  const nacimiento = normalizarNacimiento(
    {
      dia: texto(cuerpo.nacimiento, "dia"),
      mes: texto(cuerpo.nacimiento, "mes"),
      anio: texto(cuerpo.nacimiento, "anio"),
    },
    hoy,
  );
  if (!nacimiento.ok) return { ok: false, error: nacimiento.error };

  if (cuerpo.acepta !== true) return { ok: false, error: MENSAJES.politica };

  return { ok: true, datos: { email, nombre, nacimiento: nacimiento.iso } };
}
