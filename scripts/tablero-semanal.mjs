#!/usr/bin/env node
/**
 * Tablero semanal de la tienda —ver docs/metricas.md—.
 *
 * Cruza dos fuentes para una ventana de días completos (UTC):
 *   - Vercel Web Analytics: el camino (visitas, ficha, carrito, checkout).
 *   - Shopify Admin: el desenlace (pedidos pagados, ingresos, ticket, recompra).
 *
 * Imprime el tablero en markdown, listo para pegar en la bitácora de
 * docs/metricas.md.
 *
 *   pnpm tablero                                # última semana completa (lunes a domingo)
 *   pnpm tablero -- --since 2026-08-15 --until 2026-08-22
 *   pnpm tablero -- --json                      # el mismo tablero como JSON
 *
 * Credenciales:
 *   - Shopify: SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET (.env.local).
 *   - Vercel: VERCEL_TOKEN, o si no, el token del CLI en
 *     ~/Library/Application Support/com.vercel.cli/auth.json. Si responde
 *     `invalidToken`, correr `vercel whoami` para refrescarlo.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const VERCEL_TEAM = "team_gqc636AOIiwGjRv8Cx9D8JpR";
const VERCEL_PROJECT = "prj_c7XCVuwtpXLX8GOWNhk2jcJCalc2";
const ENVIO_GRATIS_UMBRAL = 120000;

const STORE = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";
if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET.");
}

/* ---------- ventana ---------- */

function parseArgs(argv) {
  const args = { json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--since") args.since = argv[++i];
    else if (argv[i] === "--until") args.until = argv[++i];
    else if (argv[i] === "--json") args.json = true;
  }
  return args;
}

/** Última semana completa de lunes a domingo, en UTC. */
function ultimaSemanaCompleta() {
  const hoy = new Date();
  const dow = hoy.getUTCDay(); // 0 = domingo
  const diasDesdeLunes = (dow + 6) % 7;
  const lunesActual = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - diasDesdeLunes));
  const domingoPasado = new Date(lunesActual.getTime() - 86400000);
  const lunesPasado = new Date(domingoPasado.getTime() - 6 * 86400000);
  return { since: isoDia(lunesPasado), until: isoDia(domingoPasado) };
}

function isoDia(d) {
  return d.toISOString().slice(0, 10);
}

function diasEnVentana(since, until) {
  return Math.round((Date.parse(until) - Date.parse(since)) / 86400000) + 1;
}

/* ---------- Vercel Web Analytics ---------- */

function vercelToken() {
  if (process.env.VERCEL_TOKEN) return process.env.VERCEL_TOKEN;
  const ruta = join(homedir(), "Library", "Application Support", "com.vercel.cli", "auth.json");
  try {
    return JSON.parse(readFileSync(ruta, "utf8")).token;
  } catch {
    throw new Error(`No hay VERCEL_TOKEN ni token del CLI en ${ruta}. Corre \`vercel whoami\`.`);
  }
}

async function vercel(endpoint, params, { since, until }) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${endpoint}`);
  url.searchParams.set("teamId", VERCEL_TEAM);
  url.searchParams.set("projectId", VERCEL_PROJECT);
  // Los endpoints normalizan `until` distinto (verificado el 23 ago 2026):
  //   */count      → fecha sola = día inclusivo; con hora recorta al inicio del día.
  //   */aggregate  → redondea a la hora siguiente: fecha sola = 01:00 de ese
  //                  día (se pierde casi todo); T23:59:59.999Z = medianoche exacta.
  url.searchParams.set("since", since);
  url.searchParams.set("until", endpoint.endsWith("/aggregate") ? `${until}T23:59:59.999Z` : until);
  url.searchParams.set("limit", "100");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${vercelToken()}` } });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Vercel ${endpoint}: ${json.error?.code ?? res.status} ${json.error?.message ?? ""}`);
  }
  return json.data;
}

async function eventoPorDispositivo(nombre, ventana) {
  const filas = await vercel("events/aggregate", { by: "deviceType", filter: `eventName eq '${nombre}'` }, ventana);
  const porTipo = Object.fromEntries(filas.map((f) => [f.deviceType, f]));
  const total = filas.reduce((acc, f) => ({ visitors: acc.visitors + f.visitors, count: acc.count + f.count }), {
    visitors: 0,
    count: 0,
  });
  return { total, mobile: porTipo.mobile ?? { visitors: 0, count: 0 }, desktop: porTipo.desktop ?? { visitors: 0, count: 0 } };
}

async function eventoPorPropiedad(nombre, propiedad, ventana) {
  const filas = await vercel("events/aggregate", { by: `eventData/${propiedad}`, filter: `eventName eq '${nombre}'` }, ventana);
  return Object.fromEntries(filas.map((f) => [f[`eventData/${propiedad}`], f]));
}

/** Agrupa referrers en las fuentes que importan para el tablero. */
function fuente(referrer) {
  if (referrer === "") return "directo";
  if (/instagram\.com$/.test(referrer)) return "instagram";
  if (/facebook\.com$/.test(referrer)) return "facebook";
  if (/google\./.test(referrer)) return "google";
  return "otros";
}

async function eventoPorFuente(nombre, ventana) {
  const filas = await vercel("events/aggregate", { by: "referrerHostname", filter: `eventName eq '${nombre}'` }, ventana);
  const agrupado = {};
  for (const f of filas) {
    const key = fuente(f.referrerHostname ?? "");
    agrupado[key] = (agrupado[key] ?? 0) + f.visitors;
  }
  return agrupado;
}

async function datosVercel(ventana) {
  const [visitas, bots, colombia, ficha, carrito, checkout, compra, fallido, origenCarrito, fichaFuente, checkoutFuente] =
    await Promise.all([
      vercel("visits/count", {}, ventana),
      /* Desde el 24 ago 2026 el sitio no envía las vistas del 404, así que
         esto da cero en ventanas nuevas; queda para comparar con las viejas. */
      vercel("visits/count", { filter: "requestPath eq '/en'" }, ventana),
      vercel("visits/count", { filter: "country eq 'CO'" }, ventana),
      eventoPorDispositivo("producto_visto", ventana),
      eventoPorDispositivo("agregar_al_carrito", ventana),
      eventoPorDispositivo("iniciar_checkout", ventana),
      eventoPorDispositivo("compra", ventana),
      eventoPorPropiedad("checkout_fallido", "motivo", ventana),
      eventoPorPropiedad("agregar_al_carrito", "origen", ventana),
      eventoPorFuente("producto_visto", ventana),
      eventoPorFuente("iniciar_checkout", ventana),
    ]);
  return {
    visitantes: visitas.visitors,
    visitantesBots: bots.visitors,
    visitantesReales: visitas.visitors - bots.visitors,
    visitantesColombia: colombia.visitors,
    ficha,
    carrito,
    checkout,
    compra,
    checkoutFallido: Object.fromEntries(Object.entries(fallido).map(([k, v]) => [k, v.count])),
    carritoDesdeCarrito: origenCarrito.carrito?.visitors ?? 0,
    carritoDesdeMiPlan: origenCarrito["mi-plan"]?.visitors ?? 0,
    fuentes: Object.fromEntries(
      ["directo", "google", "instagram", "facebook"].map((k) => [k, { ficha: fichaFuente[k] ?? 0, checkout: checkoutFuente[k] ?? 0 }]),
    ),
  };
}

/* ---------- Shopify Admin ---------- */

async function tokenShopify() {
  const res = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: "client_credentials" }),
  });
  const json = await res.json();
  if (!res.ok || typeof json.access_token !== "string") {
    throw new Error(`Shopify no entregó token: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

async function adminGraphQL(token, query, variables) {
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}

const PEDIDOS_QUERY = `
  query Pedidos($query: String!, $after: String) {
    orders(first: 250, after: $after, sortKey: CREATED_AT, query: $query) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          name
          createdAt
          test
          cancelledAt
          displayFinancialStatus
          currentTotalPriceSet { shopMoney { amount } }
          totalShippingPriceSet { shopMoney { amount } }
          lineItems(first: 50) { edges { node { quantity } } }
          customer { tags numberOfOrders }
        }
      }
    }
  }
`;

async function pedidosShopify({ since, until }) {
  const token = await tokenShopify();
  // Un día de margen a cada lado: el filtro de Shopify usa la zona de la
  // tienda y acá recortamos en UTC para cuadrar con Vercel.
  const desde = isoDia(new Date(Date.parse(since) - 86400000));
  const hasta = isoDia(new Date(Date.parse(until) + 86400000));
  const query = `created_at:>=${desde} created_at:<=${hasta}`;
  const pedidos = [];
  let after = null;
  do {
    const data = await adminGraphQL(token, PEDIDOS_QUERY, { query, after });
    pedidos.push(...data.orders.edges.map((e) => e.node));
    after = data.orders.pageInfo.hasNextPage ? data.orders.pageInfo.endCursor : null;
  } while (after);

  const inicio = `${since}T00:00:00.000Z`;
  const fin = `${until}T23:59:59.999Z`;
  return pedidos.filter(
    (p) => p.createdAt >= inicio && p.createdAt <= fin && !p.test && p.cancelledAt === null && p.displayFinancialStatus === "PAID",
  );
}

function mediana(valores) {
  if (valores.length === 0) return 0;
  const orden = [...valores].sort((a, b) => a - b);
  return orden[Math.floor(orden.length / 2)];
}

function resumenPedidos(pedidos) {
  const totales = pedidos.map((p) => Number(p.currentTotalPriceSet.shopMoney.amount));
  const ingresos = totales.reduce((a, b) => a + b, 0);
  const antiguos = pedidos.filter(
    (p) => p.customer !== null && (p.customer.tags.includes("woo-import") || Number(p.customer.numberOfOrders) > 1),
  ).length;
  return {
    pedidos: pedidos.length,
    ingresos,
    ticketMedio: pedidos.length ? Math.round(ingresos / pedidos.length) : 0,
    mediana: mediana(totales),
    envioGratis: totales.filter((t) => t >= ENVIO_GRATIS_UMBRAL).length,
    exactoUmbral: totales.filter((t) => t === ENVIO_GRATIS_UMBRAL).length,
    unSoloProducto: pedidos.filter((p) => p.lineItems.edges.length === 1).length,
    clientesAntiguos: antiguos,
  };
}

/* ---------- salida ---------- */

const cop = (n) => `$${Math.round(n).toLocaleString("es-CO")}`;
const pct = (a, b, dec = 1) => (b === 0 ? "—" : `${((100 * a) / b).toFixed(dec).replace(".", ",")}%`);
const por100 = (a, b) => (b === 0 ? "—" : `${Math.round((100 * a) / b)}`);

function imprimirMarkdown(ventana, v, s) {
  const dias = diasEnVentana(ventana.since, ventana.until);
  const semanaFactor = 7 / dias;
  const filaBitacora = [
    `${ventana.since} → ${ventana.until}`,
    por100(v.carrito.mobile.visitors, v.ficha.mobile.visitors),
    Math.round(s.pedidos * semanaFactor),
    cop(s.ticketMedio),
    pct(s.clientesAntiguos, s.pedidos),
    pct(s.pedidos, v.visitantesReales, 2),
  ];

  console.log(`## Tablero · ${ventana.since} → ${ventana.until} (${dias} días, UTC)\n`);
  console.log(`### Fila para la bitácora de docs/metricas.md\n`);
  console.log(`| Semana | Ficha→carrito móvil (de 100) | Pedidos/semana | Ticket medio | Recompra | Conversión | Reseñas | Notas |`);
  console.log(`|---|---:|---:|---:|---:|---:|---:|---|`);
  console.log(`| ${filaBitacora.join(" | ")} | _(Operaciones)_ | |\n`);

  console.log(`### Embudo (visitantes únicos)\n`);
  console.log(`| Etapa | Total | Móvil | Escritorio |`);
  console.log(`|---|---:|---:|---:|`);
  console.log(`| Visitantes reales | ${v.visitantesReales} | | | `);
  console.log(`| — en Colombia | ${v.visitantesColombia} (${pct(v.visitantesColombia, v.visitantesReales)}) | | |`);
  console.log(`| Vieron ficha | ${v.ficha.total.visitors} | ${v.ficha.mobile.visitors} | ${v.ficha.desktop.visitors} |`);
  console.log(
    `| Agregaron al carrito | ${v.carrito.total.visitors} (${pct(v.carrito.total.visitors, v.ficha.total.visitors)}) | ${v.carrito.mobile.visitors} (${pct(v.carrito.mobile.visitors, v.ficha.mobile.visitors)}) | ${v.carrito.desktop.visitors} (${pct(v.carrito.desktop.visitors, v.ficha.desktop.visitors)}) |`,
  );
  console.log(`| Iniciaron checkout | ${v.checkout.total.visitors} | ${v.checkout.mobile.visitors} | ${v.checkout.desktop.visitors} |`);
  console.log(`| Pedidos pagados (Shopify) | ${s.pedidos} (${pct(s.pedidos, v.checkout.total.visitors)} del checkout) | | |`);
  console.log(`| Evento \`compra\` (referencia, subcuenta) | ${v.compra.total.visitors} | | |\n`);

  console.log(`### Ventas (Shopify, pedidos pagados no cancelados)\n`);
  console.log(`- Pedidos: **${s.pedidos}** · ingresos **${cop(s.ingresos)}** · ticket medio **${cop(s.ticketMedio)}** · mediana ${cop(s.mediana)}`);
  console.log(`- Alcanzaron envío gratis: ${s.envioGratis} de ${s.pedidos} · exactamente ${cop(ENVIO_GRATIS_UMBRAL)}: ${s.exactoUmbral} · un solo producto: ${s.unSoloProducto}`);
  console.log(`- Clientes antiguos (woo-import o 2.º+ pedido): **${s.clientesAntiguos} de ${s.pedidos}** (${pct(s.clientesAntiguos, s.pedidos)})\n`);

  console.log(`### Calidad del tráfico (ficha → checkout, de cada 100)\n`);
  console.log(`| Fuente | Ficha | Checkout | De cada 100 |`);
  console.log(`|---|---:|---:|---:|`);
  for (const [k, f] of Object.entries(v.fuentes)) {
    console.log(`| ${k} | ${f.ficha} | ${f.checkout} | ${por100(f.checkout, f.ficha)} |`);
  }
  console.log();

  console.log(`### Señales\n`);
  const fallidos = Object.entries(v.checkoutFallido).map(([m, n]) => `${m}: ${n}`).join(", ") || "ninguno";
  console.log(`- Checkout fallido: ${fallidos}`);
  console.log(`- Agregados desde el carrito (sugerencia): ${v.carritoDesdeCarrito} · desde Mi Plan: ${v.carritoDesdeMiPlan}`);
  console.log(`- Visitantes bot en /en descontados: ${v.visitantesBots}`);
}

const args = parseArgs(process.argv.slice(2));
const ventana = args.since && args.until ? { since: args.since, until: args.until } : ultimaSemanaCompleta();
if (!/^\d{4}-\d{2}-\d{2}$/.test(ventana.since) || !/^\d{4}-\d{2}-\d{2}$/.test(ventana.until)) {
  throw new Error("--since y --until van en formato YYYY-MM-DD.");
}

const [v, pedidos] = await Promise.all([datosVercel(ventana), pedidosShopify(ventana)]);
const s = resumenPedidos(pedidos);

if (args.json) {
  console.log(JSON.stringify({ ventana, vercel: v, shopify: s }, null, 2));
} else {
  imprimirMarkdown(ventana, v, s);
}
