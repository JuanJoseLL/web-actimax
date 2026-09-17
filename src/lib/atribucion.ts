/**
 * Atribución de la visita: de dónde llegó quien compra.
 *
 * El sitio vive en Vercel y el checkout en `pagos.actimax.com.co`, así que al
 * volver de pagar el referente es el mismo dominio raíz y se descarta: todas
 * las compras salían como «directo» (ver docs/metricas.md). La salida es no
 * depender del referente. Se leen los UTM de la URL de entrada, se guardan en
 * el navegador y viajan al carrito como atributo del pedido, de modo que cada
 * pedido diga de dónde vino —con plata real, no con lo que Meta o Google se
 * quieran acreditar— y el desglose por campaña se lea en el tablero.
 *
 * Gana el ÚLTIMO clic con UTM, no el primero: es el criterio de Meta y GA4,
 * así que las cifras se pueden comparar entre sí, y evita que una campaña de
 * hace meses se lleve el crédito de una compra de hoy. Caduca a los 30 días.
 *
 * El módulo no importa nada del navegador en su superficie pura: `route.ts`
 * reutiliza `saneaAtribucion`, `resumenAtribucion` y `parametrosUtm` en el
 * servidor, y solo `recordarAtribucion`/`atribucionGuardada` tocan
 * `localStorage`, igual que en [visitante.ts].
 */

export const CLAVE_ATRIBUCION = "ax_atr";

/* Un mes es lo que Meta y GA4 usan por defecto para el clic, y es de sobra
   para esta tienda: el 80% de los pedidos ocurre el mismo día de la visita. */
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;

/* Los UTM los escribe quien monta la pauta, así que llegan como sea: se
   recorta a algo que quepa y se lea en el pedido sin romper el admin. */
const LARGO_MAXIMO = 64;

/* Identificadores de clic que delatan el canal aunque el anuncio venga sin
   UTM. `gclid`, `gbraid` y `wbraid` solo existen en clics pagos de Google, así
   que valen como prueba de pauta; `fbclid` viaja también en los enlaces
   orgánicos de Instagram y Facebook, de modo que se guarda como «meta» a
   secas y no como pauta. Aun así sirve: rescata las visitas del navegador
   interno de Instagram, que no manda referente y hoy caen en «directo». */
const IDS_DE_CLIC: ReadonlyArray<readonly [string, string]> = [
  ["gclid", "google-ads"],
  ["gbraid", "google-ads"],
  ["wbraid", "google-ads"],
  ["msclkid", "bing-ads"],
  ["ttclid", "tiktok"],
  ["fbclid", "meta"],
];

/* Orden fijo: es el de la cadena que ve Operaciones en el pedido. */
const CAMPOS_UTM = [
  ["fuente", "utm_source"],
  ["medio", "utm_medium"],
  ["campana", "utm_campaign"],
  ["contenido", "utm_content"],
  ["termino", "utm_term"],
] as const;

export interface Atribucion {
  fuente?: string;
  medio?: string;
  campana?: string;
  contenido?: string;
  termino?: string;
  /** Canal deducido del identificador de clic cuando no hay UTM. */
  clic?: string;
  /** Día del clic (ISO, sin hora): lo que hace caducar la atribución. */
  fecha: string;
}

/**
 * Normaliza un valor de UTM. Baja a minúsculas para que «Instagram» e
 * «instagram» no aparezcan como dos campañas distintas en el tablero, y deja
 * fuera todo lo que no sea letra, número o separador corriente: el valor
 * termina en el admin de Shopify y no vale la pena dejarle pasar lo que sea.
 */
function limpiar(valor: string | null | undefined): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._\-+ ]+/gu, "")
    /* Los nombres de campaña de Meta vienen llenos de separadores («Conversiones
       | Geles | Sep»); al quitarlos quedan huecos dobles que ensuciarían la
       línea del pedido. Ojo que la barra también se va: así un nombre de
       campaña no puede colarle un segmento falso al «fuente / medio / campaña». */
    .replace(/\s+/g, " ")
    .slice(0, LARGO_MAXIMO)
    .trim();
  return limpio === "" ? undefined : limpio;
}

function tieneUtm(atribucion: Atribucion): boolean {
  return CAMPOS_UTM.some(([campo]) => atribucion[campo] !== undefined);
}

/** Lee los UTM y el identificador de clic de una query string. */
export function leerAtribucion(search: string, ahora: Date = new Date()): Atribucion | null {
  const params = new URLSearchParams(search);
  const atribucion: Atribucion = { fecha: ahora.toISOString().slice(0, 10) };
  for (const [campo, parametro] of CAMPOS_UTM) {
    atribucion[campo] = limpiar(params.get(parametro));
  }
  const clic = IDS_DE_CLIC.find(([parametro]) => (params.get(parametro) ?? "") !== "");
  if (clic !== undefined) atribucion.clic = clic[1];
  return tieneUtm(atribucion) || atribucion.clic !== undefined ? atribucion : null;
}

/**
 * Valida lo que llega del navegador antes de mandarlo a Shopify. El cuerpo de
 * `/api/checkout` lo controla quien visita, así que nada de esto se cree sin
 * pasarlo por el mismo `limpiar` de la captura.
 */
export function saneaAtribucion(valor: unknown, ahora: Date = new Date()): Atribucion | null {
  if (typeof valor !== "object" || valor === null) return null;
  const crudo = valor as Record<string, unknown>;
  const atribucion: Atribucion = { fecha: ahora.toISOString().slice(0, 10) };
  for (const [campo] of CAMPOS_UTM) {
    atribucion[campo] = limpiar(typeof crudo[campo] === "string" ? crudo[campo] : null);
  }
  const clic = limpiar(typeof crudo.clic === "string" ? crudo.clic : null);
  /* Solo se aceptan los canales que este módulo sabe emitir: el campo no es
     texto libre aunque venga del mismo navegador que ya lo escribió. */
  if (clic !== undefined && IDS_DE_CLIC.some(([, canal]) => canal === clic)) {
    atribucion.clic = clic;
  }
  if (typeof crudo.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(crudo.fecha)) {
    atribucion.fecha = crudo.fecha;
  }
  return tieneUtm(atribucion) || atribucion.clic !== undefined ? atribucion : null;
}

/**
 * La cadena que queda en el pedido. Se lee de corrido en el admin
 * («instagram / cpc / maraton-medellin») y se parte por " / " en el tablero.
 * `utm_content` y `utm_term` quedan fuera a propósito: alargan la línea y la
 * pregunta que hay que responder es de qué campaña vino la compra, no de qué
 * creativo. Viajan igual en la URL del checkout.
 */
export function resumenAtribucion(atribucion: Atribucion | null): string | null {
  if (atribucion === null) return null;
  const partes = [atribucion.fuente, atribucion.medio, atribucion.campana].filter(
    (parte): parte is string => parte !== undefined,
  );
  if (partes.length > 0) return partes.join(" / ");
  /* Sin UTM, el identificador de clic es todo lo que hay. Se marca como tal
     para que nadie lo lea como una campaña bien etiquetada. */
  return atribucion.clic !== undefined ? `${atribucion.clic} / sin-utm` : null;
}

/**
 * Los UTM otra vez como parámetros, para colgarlos de la URL del checkout por
 * si Shopify los levanta en «Detalles de conversión». Es gratis y no estorba;
 * el atributo del pedido es lo que de verdad responde la pregunta.
 */
export function parametrosUtm(atribucion: Atribucion | null): Array<[string, string]> {
  if (atribucion === null) return [];
  return CAMPOS_UTM.flatMap(([campo, parametro]) => {
    const valor = atribucion[campo];
    return valor === undefined ? [] : [[parametro, valor] as [string, string]];
  });
}

/* ---------- lado del navegador ---------- */

/**
 * Guarda la atribución de la URL actual, si la trae. Pisa lo que hubiera: el
 * último clic manda. Si la URL no trae nada se deja lo guardado, que es lo que
 * hace que la atribución sobreviva a la navegación por el sitio.
 */
export function recordarAtribucion(search: string, ahora: Date = new Date()): void {
  const atribucion = leerAtribucion(search, ahora);
  if (atribucion === null) return;
  try {
    window.localStorage.setItem(CLAVE_ATRIBUCION, JSON.stringify(atribucion));
  } catch {
    /* Incógnito o almacenamiento bloqueado: se pierde la atribución y ya,
       que la compra se pueda hacer importa más que saber de dónde vino. */
  }
}

/**
 * Lo guardado, ya validado y con la caducidad aplicada. Vive aparte de
 * `atribucionGuardada` para poder probar el JSON corrupto y el vencimiento sin
 * montar un `localStorage` de mentiras.
 */
export function atribucionDesdeTexto(
  crudo: string | null,
  ahora: Date = new Date(),
): Atribucion | null {
  if (crudo === null || crudo === "") return null;
  let valor: unknown;
  try {
    valor = JSON.parse(crudo);
  } catch {
    return null;
  }
  const atribucion = saneaAtribucion(valor, ahora);
  if (atribucion === null) return null;
  const clic = Date.parse(`${atribucion.fecha}T00:00:00.000Z`);
  if (Number.isNaN(clic) || ahora.getTime() - clic > VIGENCIA_MS) return null;
  return atribucion;
}

/** La atribución vigente, o null si no hay o ya caducó. */
export function atribucionGuardada(ahora: Date = new Date()): Atribucion | null {
  if (typeof window === "undefined") return null;
  try {
    return atribucionDesdeTexto(window.localStorage.getItem(CLAVE_ATRIBUCION), ahora);
  } catch {
    return null;
  }
}
