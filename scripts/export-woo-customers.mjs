/**
 * Exporta los clientes de WooCommerce en el CSV de importación de Shopify.
 *
 * Lee DOS fuentes y las deduplica por correo, porque `/customers` solo trae
 * usuarios registrados: en Woo la mayoría de compras suelen ser de invitados,
 * que tienen nombre, dirección y correo en el pedido pero nunca crearon cuenta.
 *
 *   1. /wc/v3/customers  → registrados
 *   2. /wc/v3/orders     → invitados (y de paso totales reales por cliente)
 *
 * Necesita credenciales de solo lectura (WooCommerce → Ajustes → Avanzado →
 * REST API). En .env.local:
 *
 *   WOO_CONSUMER_KEY=ck_...
 *   WOO_CONSUMER_SECRET=cs_...
 *
 * Correr ANTES del corte de DNS, mientras actimax.com.co siga siendo WordPress:
 *
 *   node --env-file=.env.local scripts/export-woo-customers.mjs
 *
 * Escribe:
 *  - shopify-import/woo-customers-export.json → crudo, para auditar
 *  - shopify-import/shopify-customers.csv     → se sube en Shopify →
 *                                               Clientes → Importar
 */
import { writeFile } from "node:fs/promises";

const WP_BASE_URL = (process.env.WP_BASE_URL ?? "https://actimax.com.co").replace(/\/$/, "");
const KEY = process.env.WOO_CONSUMER_KEY;
const SECRET = process.env.WOO_CONSUMER_SECRET;
const PER_PAGE = 100;

/* Consentimiento de marketing: Woo no guarda prueba de opt-in salvo que se
   hubiera usado un plugin, y marcar como suscrito a quien nunca aceptó es un
   problema de habeas data (Ley 1581). Por defecto "no": el formulario de
   newsletter del sitio nuevo recoge el consentimiento de verdad. */
const MARKETING = process.env.WOO_MARKETING_DEFAULT === "yes" ? "yes" : "no";

if (!KEY || !SECRET) {
  console.error(
    "Faltan WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET.\n" +
      "Genéralas en WP Admin → WooCommerce → Ajustes → Avanzado → REST API\n" +
      "(permisos: Lectura) y ponlas en .env.local.",
  );
  process.exit(1);
}

const AUTH = "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64");

/* ISO 3166-2:CO — Shopify espera estos códigos en Province Code. */
const CO_ISO = new Set(
  ("AMA ANT ARA ATL BOL BOY CAL CAQ CAS CAU CES CHO COR CUN DC GUA GUV HUI LAG " +
    "MAG MET NAR NSA PUT QUI RIS SAN SAP SUC TOL VAC VAU VID")
    .split(" "),
);

/* WooCommerce usa para Colombia códigos propios que NO son los ISO. Es la causa
   de la mayoría de los valores "inválidos" del export: BOG solo ya son ~940
   clientes de Bogotá que sin esto llegarían a Shopify sin departamento. */
const WOO_A_ISO = {
  BOG: "DC", NOR: "NSA", GUJ: "LAG", ARU: "ARA", AMZ: "AMA", VIC: "VID", CHOC: "CHO",
};

const NOMBRE_A_ISO = {
  AMAZONAS: "AMA",
  ANTIOQUIA: "ANT",
  ARAUCA: "ARA",
  ATLANTICO: "ATL",
  BOLIVAR: "BOL",
  BOYACA: "BOY",
  CALDAS: "CAL",
  CAQUETA: "CAQ",
  CASANARE: "CAS",
  CAUCA: "CAU",
  CESAR: "CES",
  CHOCO: "CHO",
  CORDOBA: "COR",
  CUNDINAMARCA: "CUN",
  BOGOTA: "DC",
  "DISTRITO CAPITAL": "DC",
  GUAINIA: "GUA",
  GUAVIARE: "GUV",
  HUILA: "HUI",
  "LA GUAJIRA": "LAG",
  GUAJIRA: "LAG",
  MAGDALENA: "MAG",
  META: "MET",
  NARINO: "NAR",
  "NORTE DE SANTANDER": "NSA",
  PUTUMAYO: "PUT",
  QUINDIO: "QUI",
  RISARALDA: "RIS",
  SANTANDER: "SAN",
  "SAN ANDRES": "SAP",
  SUCRE: "SUC",
  TOLIMA: "TOL",
  "VALLE DEL CAUCA": "VAC",
  VALLE: "VAC",
  VAUPES: "VAU",
  VICHADA: "VID",
};

/* Typos y variantes vistos en los datos reales de Woo. */
const TYPOS = {
  ANTOQUIA: "ANT", ANQIUIAUI: "ANT", CUNDIMAMARCA: "CUN", CINDINAMARCA: "CUN",
  "VALLA DEL CAUCA": "VAC", HULA: "HUI", BOOGTA: "DC", "D C": "DC",
};

/* Último recurso: la ciudad. Mucha gente escribió el barrio o la direccion en
   el campo del departamento, pero casi todos pusieron bien la ciudad. */
const CIUDAD_A_ISO = {
  BOGOTA: "DC", USAQUEN: "DC", ENGATIVA: "DC", SUBA: "DC", CHAPINERO: "DC",
  MEDELLIN: "ANT", ENVIGADO: "ANT", BELLO: "ANT", ITAGUI: "ANT", SABANETA: "ANT",
  RIONEGRO: "ANT", CAUCASIA: "ANT", APARTADO: "ANT", TURBO: "ANT",
  CALI: "VAC", BUENAVENTURA: "VAC", PALMIRA: "VAC", TULUA: "VAC", BUGA: "VAC",
  "GUADALAJARA DE BUGA": "VAC", SEVILLA: "VAC", "EL CERRITO": "VAC", YUMBO: "VAC",
  BARRANQUILLA: "ATL", SOLEDAD: "ATL", "PUERTO COLOMBIA": "ATL", MALAMBO: "ATL",
  CARTAGENA: "BOL", "CARTAGENA DE INDIAS": "BOL", TURBACO: "BOL", MAGANGUE: "BOL",
  BUCARAMANGA: "SAN", FLORIDABLANCA: "SAN", BARRANCABERMEJA: "SAN", GIRON: "SAN",
  PIEDECUESTA: "SAN", SOCORRO: "SAN",
  CUCUTA: "NSA", OCANA: "NSA", PAMPLONA: "NSA",
  PEREIRA: "RIS", DOSQUEBRADAS: "RIS", "SANTA ROSA DE CABAL": "RIS",
  MANIZALES: "CAL", VILLAMARIA: "CAL", CHINCHINA: "CAL",
  IBAGUE: "TOL", FRESNO: "TOL", NATAGAIMA: "TOL", ESPINAL: "TOL", MELGAR: "TOL",
  NEIVA: "HUI", GARZON: "HUI", PITALITO: "HUI", ALGECIRAS: "HUI",
  PASTO: "NAR", IPIALES: "NAR", TUMACO: "NAR", GUACHUCAL: "NAR",
  MONTERIA: "COR", CHINU: "COR", "CIENAGA DE ORO": "COR", "PUERTO LIBERTADOR": "COR",
  LORICA: "COR", SAHAGUN: "COR",
  VILLAVICENCIO: "MET", ACACIAS: "MET", GRANADA: "MET",
  "SANTA MARTA": "MAG", FUNDACION: "MAG", CIENAGA: "MAG",
  VALLEDUPAR: "CES", CURUMANI: "CES", AGUACHICA: "CES",
  POPAYAN: "CAU", SANTANDER_DE_QUILICHAO: "CAU",
  SINCELEJO: "SUC", COROZAL: "SUC",
  ARMENIA: "QUI", QUIMBAYA: "QUI", CALARCA: "QUI", MONTENEGRO: "QUI",
  RIOHACHA: "LAG", ALBANIA: "LAG", MAICAO: "LAG",
  QUIBDO: "CHO", FLORENCIA: "CAQ",
  YOPAL: "CAS", "VILLANUEVA CASANARE": "CAS", AGUAZUL: "CAS",
  MOCOA: "PUT", SIBUNDOY: "PUT", PUERTO_ASIS: "PUT",
  ARAUCA: "ARA", SARAVENA: "ARA", LETICIA: "AMA",
  "PUERTO CARRENO": "VID", "LA PRIMAVERA": "VID",
  SOGAMOSO: "BOY", TUNJA: "BOY", "SANTA ROSA DE VITERBO": "BOY", DUITAMA: "BOY",
  CHIQUINQUIRA: "BOY",
  MOSQUERA: "CUN", CAJICA: "CUN", FUSAGASUGA: "CUN", CHIA: "CUN", SOACHA: "CUN",
  ZIPAQUIRA: "CUN", FACATATIVA: "CUN", MADRID: "CUN", FUNZA: "CUN", GIRARDOT: "CUN",
  "SAN ANDRES": "SAP",
};

/* Nombres de departamento ordenados de más largo a más corto: sin esto,
   "VALLE DEL CAUCA" haría match con "CAUCA" y "NORTE DE SANTANDER" con
   "SANTANDER", mandando gente al departamento equivocado. */
const NOMBRES_POR_LONGITUD = Object.keys(NOMBRE_A_ISO).sort((a, b) => b.length - a.length);

function normalizarTexto(s) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Devuelve [codigoISO, comoSeResolvio]. Cadena vacía si no se pudo: es
   preferible dejar el campo en blanco que mandarle basura a Shopify. */
function normalizarDepartamento(provincia, ciudad, pais) {
  const p = normalizarTexto(provincia);
  const c = normalizarTexto(ciudad);
  if (pais && pais !== "CO") return [provincia.toUpperCase(), "no-colombia"];
  if (!p && !c) return ["", "vacio"];

  if (CO_ISO.has(p)) return [p, "ya-iso"];
  if (WOO_A_ISO[p]) return [WOO_A_ISO[p], "codigo-woo"];
  if (NOMBRE_A_ISO[p]) return [NOMBRE_A_ISO[p], "nombre"];
  if (TYPOS[p]) return [TYPOS[p], "typo"];

  for (const nombre of NOMBRES_POR_LONGITUD) {
    if (p.includes(nombre)) return [NOMBRE_A_ISO[nombre], "nombre-dentro-del-texto"];
  }
  if (CIUDAD_A_ISO[c]) return [CIUDAD_A_ISO[c], "ciudad"];
  for (const nombre of NOMBRES_POR_LONGITUD) {
    if (c.includes(nombre)) return [NOMBRE_A_ISO[nombre], "depto-dentro-de-la-ciudad"];
  }
  for (const [ciudadNombre, iso] of Object.entries(CIUDAD_A_ISO)) {
    if (ciudadNombre.length > 5 && c.includes(ciudadNombre)) return [iso, "ciudad-dentro-del-texto"];
  }
  return ["", "sin-resolver"];
}

async function fetchPaginated(endpoint, extra = "") {
  const all = [];
  for (let page = 1; ; page++) {
    const url = `${WP_BASE_URL}/wp-json/wc/v3/${endpoint}?per_page=${PER_PAGE}&page=${page}${extra}`;
    const res = await fetch(url, { headers: { Authorization: AUTH } });
    if (res.status === 401) {
      throw new Error(
        `401 en ${endpoint}: las credenciales no sirven. Verifica que la clave ` +
          `tenga permiso de Lectura y que no se haya copiado con espacios.`,
      );
    }
    if (!res.ok) throw new Error(`${endpoint} respondió ${res.status} en la página ${page}`);
    const batch = await res.json();
    all.push(...batch);
    process.stdout.write(`\r  ${endpoint}: ${all.length}`);
    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? 0);
    if (batch.length < PER_PAGE || (totalPages && page >= totalPages)) break;
  }
  process.stdout.write("\n");
  return all;
}

function limpiar(v) {
  return typeof v === "string" ? v.trim() : "";
}

/* Colombia: móviles de 10 dígitos que empiezan por 3, o ya en internacional.
   Lo que no encaje se deja en blanco — un teléfono inventado es peor que
   ninguno, y Shopify rechaza la fila entera si el formato no le cuadra. */
function sanearTelefono(t) {
  const limpio = (t ?? "").replace(/[^\d+]/g, "");
  const digitos = limpio.replace(/\D/g, "");
  if (limpio.startsWith("+") && digitos.length >= 10 && digitos.length <= 15) return limpio;
  if (digitos.length === 10 && digitos.startsWith("3")) return `+57${digitos}`;
  if (digitos.length === 12 && digitos.startsWith("57")) return `+${digitos}`;
  return "";
}

/* Un cliente por correo. Los datos del registro mandan sobre los del pedido,
   pero el pedido rellena lo que el registro tenga vacío (mucha gente se
   registra sin dirección y luego la escribe al comprar). */
function fusionar(destino, origen) {
  for (const [k, v] of Object.entries(origen)) {
    if (v !== "" && v != null && (destino[k] === "" || destino[k] == null)) destino[k] = v;
  }
}

function desdeBilling(b = {}) {
  return {
    firstName: limpiar(b.first_name),
    lastName: limpiar(b.last_name),
    company: limpiar(b.company),
    address1: limpiar(b.address_1),
    address2: limpiar(b.address_2),
    city: limpiar(b.city),
    province: limpiar(b.state),
    country: limpiar(b.country),
    zip: limpiar(b.postcode),
    phone: limpiar(b.phone),
  };
}

console.log(`Leyendo de ${WP_BASE_URL} …`);
const [customers, orders] = [
  await fetchPaginated("customers", "&role=all&orderby=id&order=asc"),
  await fetchPaginated("orders", "&status=any&orderby=id&order=asc"),
];

await writeFile(
  new URL("../shopify-import/woo-customers-export.json", import.meta.url),
  JSON.stringify({ customers, orders }, null, 2),
);

const porCorreo = new Map();

for (const c of customers) {
  const email = limpiar(c.email).toLowerCase();
  if (!email) continue;
  const base = desdeBilling(c.billing);
  porCorreo.set(email, {
    email,
    ...base,
    firstName: limpiar(c.first_name) || base.firstName,
    lastName: limpiar(c.last_name) || base.lastName,
    registrado: true,
    wooId: c.id,
    alta: (c.date_created ?? "").slice(0, 10),
    pedidos: 0,
    gastado: 0,
  });
}

/* Los pedidos aportan los invitados y los totales reales. Solo cuentan como
   gasto los pedidos efectivamente pagados. */
const PAGADOS = new Set(["completed", "processing", "on-hold"]);
let invitados = 0;
for (const o of orders) {
  const email = limpiar(o.billing?.email).toLowerCase();
  if (!email) continue;
  let cli = porCorreo.get(email);
  if (!cli) {
    cli = { email, ...desdeBilling(o.billing), registrado: false, wooId: null, alta: "", pedidos: 0, gastado: 0 };
    porCorreo.set(email, cli);
    invitados++;
  } else {
    fusionar(cli, desdeBilling(o.billing));
  }
  if (PAGADOS.has(o.status)) {
    cli.pedidos++;
    cli.gastado += Number(o.total ?? 0);
  }
}

const clientes = [...porCorreo.values()].sort((a, b) => (a.email < b.email ? -1 : 1));

const CABECERAS = [
  "First Name", "Last Name", "Email", "Accepts Email Marketing",
  "Default Address Company", "Default Address Address1", "Default Address Address2",
  "Default Address City", "Default Address Province Code", "Default Address Country Code",
  "Default Address Zip", "Default Address Phone", "Phone", "Accepts SMS Marketing",
  "Total Spent", "Total Orders", "Note", "Tax Exempt", "Tags",
];

function celda(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const comoSeResolvio = new Map();
const sinResolver = new Map();
const filas = clientes.map((c) => {
  const [prov, metodo] = normalizarDepartamento(c.province, c.city, c.country);
  comoSeResolvio.set(metodo, (comoSeResolvio.get(metodo) ?? 0) + 1);
  if (metodo === "sin-resolver") {
    const clave = `${c.province} | ciudad: ${c.city}`;
    sinResolver.set(clave, (sinResolver.get(clave) ?? 0) + 1);
  }
  const tags = ["woo-import", c.registrado ? "woo-registrado" : "woo-invitado"];
  const nota = c.registrado ? `Woo ID ${c.wooId}${c.alta ? ` · alta ${c.alta}` : ""}` : "Cliente invitado de WooCommerce";
  return [
    c.firstName, c.lastName, c.email, MARKETING,
    c.company, c.address1, c.address2,
    c.city, prov, c.country || "CO",
    /* El teléfono va SOLO en la dirección. La columna "Phone" es el teléfono
       a nivel de cliente y Shopify lo exige único en toda la tienda: al
       duplicarlo ahí, 228 clientes que compartían celular con otro (familias,
       o el mismo comprador con dos correos) fueron rechazados en la primera
       importación. El de la dirección no tiene esa restricción y es el que
       sirve para los envíos. */
    c.zip, sanearTelefono(c.phone), "", "no",
    c.gastado ? c.gastado.toFixed(2) : "", c.pedidos || "", nota, "no", tags.join(","),
  ].map(celda).join(",");
});

await writeFile(
  new URL("../shopify-import/shopify-customers.csv", import.meta.url),
  [CABECERAS.join(","), ...filas].join("\n") + "\n",
);

const conDireccion = clientes.filter((c) => c.address1).length;
console.log(`
Registrados en Woo ....... ${customers.length}
Invitados (solo pedidos) . ${invitados}
Pedidos revisados ........ ${orders.length}
--------------------------------
Clientes únicos .......... ${clientes.length}
  con dirección .......... ${conDireccion}
  sin dirección .......... ${clientes.length - conDireccion}

Consentimiento de marketing: "${MARKETING}" para todos.
CSV → shopify-import/shopify-customers.csv`);

console.log("\nDepartamento — cómo se resolvió cada uno:");
for (const [m, n] of [...comoSeResolvio].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(5)}  ${m}`);
}

if (sinResolver.size > 0) {
  console.log(
    `\nSin resolver (${sinResolver.size} casos): van a Shopify con el ` +
      `departamento en blanco, que es válido. La dirección completa sí viaja.`,
  );
  for (const [p, n] of [...sinResolver].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${n}× ${p.slice(0, 90)}`);
  }
}
