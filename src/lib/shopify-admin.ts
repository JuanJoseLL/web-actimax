/**
 * Cliente de la Admin API de Shopify para las rutas del servidor.
 *
 * Autenticación igual que los scripts de migración: SHOPIFY_ADMIN_TOKEN si
 * existe, o un token temporal canjeado con las client credentials de la app
 * (SHOPIFY_CLIENT_ID/SECRET). El token se guarda en memoria del proceso;
 * cada instancia de la función canjea el suyo la primera vez.
 *
 * Ojo: `/api/newsletter/` trae su propia copia de esto de antes. Si se toca
 * la autenticación, hay que tocar las dos o mover aquella a este módulo.
 */

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = "2026-01";

let tokenTemporal: string | null = null;
let tokenTemporalExpiraEn = 0;

/** Sin esto no hay nada que intentar: la ruta debería responder 503. */
export function hayCredencialesAdmin(): boolean {
  if (STORE_DOMAIN === undefined || STORE_DOMAIN === "") return false;
  if (ADMIN_TOKEN !== undefined && ADMIN_TOKEN !== "") return true;
  return (
    CLIENT_ID !== undefined && CLIENT_ID !== "" && CLIENT_SECRET !== undefined && CLIENT_SECRET !== ""
  );
}

async function obtenerToken(): Promise<string> {
  if (ADMIN_TOKEN !== undefined && ADMIN_TOKEN !== "") return ADMIN_TOKEN;
  if (tokenTemporal !== null && Date.now() < tokenTemporalExpiraEn - 60_000) return tokenTemporal;

  const respuesta = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID as string,
      client_secret: CLIENT_SECRET as string,
    }),
  });
  const json: { access_token?: string; expires_in?: number } = await respuesta.json();
  if (!respuesta.ok || typeof json.access_token !== "string") {
    throw new Error(`No se pudo obtener token de Admin: ${respuesta.status}`);
  }
  tokenTemporal = json.access_token;
  tokenTemporalExpiraEn = Date.now() + (json.expires_in ?? 900) * 1000;
  return tokenTemporal;
}

/**
 * Error de GraphQL con el detalle crudo, para poder distinguir un permiso
 * que falta (no tiene sentido reintentar) de una caída pasajera (sí).
 */
export class ShopifyAdminError extends Error {
  readonly errores: unknown;

  constructor(mensaje: string, errores: unknown) {
    super(mensaje);
    this.name = "ShopifyAdminError";
    this.errores = errores;
  }

  /** Le faltan scopes a la app: reintentar no arregla nada. */
  get accesoDenegado(): boolean {
    return JSON.stringify(this.errores ?? "").includes("ACCESS_DENIED");
  }
}

export async function adminGraphQL<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const respuesta = await fetch(
    `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await obtenerToken(),
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (respuesta.status === 401 || respuesta.status === 403) {
    /* Token revocado antes de expirar: soltarlo para que el siguiente
       intento canjee uno nuevo en vez de fallar durante 15 minutos. */
    tokenTemporal = null;
  }
  if (!respuesta.ok) throw new Error(`Shopify Admin respondió ${respuesta.status}`);

  const json = await respuesta.json();
  if (json.errors !== undefined) {
    throw new ShopifyAdminError(`Errores GraphQL: ${JSON.stringify(json.errors)}`, json.errors);
  }
  return json.data as T;
}
