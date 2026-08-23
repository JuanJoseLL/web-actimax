#!/usr/bin/env node
/**
 * Crea (una sola vez) las definiciones de metafield que la ficha de producto
 * lee para los Energy Packs —ver docs/metafields-packs.md—:
 *
 *   custom.contenido  list.single_line_text_field   "Qué trae el pack"
 *   custom.guia_uso   json                          "Cuándo tomar qué"
 *
 * Las dos quedan con acceso Storefront (sin eso la Storefront API devuelve
 * null aunque el valor esté cargado) y fijadas en la ficha del admin para
 * que Operaciones las vea sin buscar. Si ya existen no hace nada.
 *
 *   pnpm packs:metafields
 */

const STORE = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-01";

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Faltan SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET.");
}

const DEFINICIONES = [
  {
    namespace: "custom",
    key: "contenido",
    name: "Qué trae el pack",
    description:
      "Una línea por producto del pack, con cantidad: «1 sobre de Pre Race», «4 geles de fruta de 30 g». Se muestra arriba del botón de compra.",
    type: "list.single_line_text_field",
    ownerType: "PRODUCT",
    pin: true,
    access: { storefront: "PUBLIC_READ" },
  },
  {
    namespace: "custom",
    key: "guia_uso",
    name: "Cuándo tomar qué (guía de carrera)",
    description:
      'Lista JSON de pasos en orden: [{"cuando":"Km 7","que":"Gel de fruta","nota":"Con un sorbo de agua","momento":"durante"}]. Formato completo en docs/metafields-packs.md del repo web.',
    type: "json",
    ownerType: "PRODUCT",
    pin: true,
    access: { storefront: "PUBLIC_READ" },
  },
];

async function token() {
  const response = await fetch(`https://${STORE}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  const json = await response.json();
  if (!response.ok || typeof json.access_token !== "string") {
    throw new Error(`No se pudo autenticar con ${STORE}: ${JSON.stringify(json)}`);
  }
  return json.access_token;
}

const accessToken = await token();

async function graphql(query, variables = {}) {
  const response = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await response.json();
  if (!response.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
  return json.data;
}

const EXISTENTES = /* GraphQL */ `
  query Existentes {
    metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: "custom") {
      nodes { key type { name } access { storefront } }
    }
  }
`;

const CREAR = /* GraphQL */ `
  mutation Crear($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id key access { storefront } }
      userErrors { field message code }
    }
  }
`;

const existentes = new Map(
  (await graphql(EXISTENTES)).metafieldDefinitions.nodes.map((d) => [d.key, d]),
);

for (const definition of DEFINICIONES) {
  const previa = existentes.get(definition.key);
  if (previa) {
    console.log(
      `custom.${definition.key}: ya existe (${previa.type.name}, storefront=${previa.access.storefront}); sin cambios.`,
    );
    continue;
  }
  const { metafieldDefinitionCreate: result } = await graphql(CREAR, { definition });
  if (result.userErrors.length > 0) {
    throw new Error(`custom.${definition.key}: ${JSON.stringify(result.userErrors)}`);
  }
  console.log(
    `custom.${definition.key}: creada (${result.createdDefinition.id}, storefront=${result.createdDefinition.access.storefront}).`,
  );
}
