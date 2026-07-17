# Actimax — Demo de la nueva tienda

Demo de la nueva web de Actimax (nutrición deportiva especializada, Medellín)
construido con **Next.js 16 + Tailwind CSS v4**. Reemplaza al sitio actual en
WooCommerce ([actimax.com.co](https://actimax.com.co)).

## Correr el demo

```bash
pnpm install
pnpm dev
```

Abre <http://localhost:3000>.

## Qué es real y qué es simulado

**Real (extraído del sitio actual de WooCommerce):**

- Los 19 productos con nombres, precios en COP, ofertas, descripciones y
  recomendaciones de uso (`src/data/catalog.json`).
- Las 74 fotos de producto y el logo (`public/products/`).
- Las categorías: tipo (geles/bebidas/barras/kits), momento de uso
  (antes/durante/después) y deporte.

**Simulado (solo para el demo):**

- El carrito funciona (agrega, cambia cantidades, persiste), pero el botón
  "Finalizar compra" no cobra: muestra una nota de que el pago se conecta al
  lanzar (Wompi / Mercado Pago → tarjeta, PSE, Nequi).
- Las 3 entradas del blog son artículos de muestra (`src/data/blog.ts`).
- El enlace de WhatsApp de mayoristas apunta a un número de relleno.

## Arquitectura pensada para migrar a Shopify

El plan es que la tienda real corra sobre **Shopify** (la administra una
persona no técnica) con este front en Next.js:

- Toda la lectura de productos pasa por `src/lib/catalog.ts`. Hoy lee el JSON
  local; al conectar Shopify, ese módulo pasa a llamar a la Storefront API
  **sin tocar el resto del sitio**.
- El carrito local (`src/components/cart/`) se reemplaza por el carrito de
  Shopify y su checkout hosteado.
- El blog saldrá del blog nativo de Shopify (mismo panel de administración que
  los productos).

## Estructura

```
src/
  app/                 páginas (home, /productos, /productos/[handle], /blog)
  components/          Header, Footer, ProductCard, carrito, galería, etc.
  data/catalog.json    catálogo extraído de WooCommerce
  data/blog.ts         entradas de muestra
  lib/catalog.ts       capa de datos (punto único de conexión futura a Shopify)
public/products/       fotos reales de producto
```

## Identidad visual

- Azul de marca `#002F87` (tomado del SVG del logo) + amarillo señalización
  `#FFD23C` + tinta `#0A1128`.
- Titulares en **Barlow Condensed** (equivalente libre de Neue Plak, la fuente
  de marca del sitio actual), texto en **Archivo**.
- Firma visual: la línea de ruta con los tres momentos de nutrición
  (antes / durante / después) y las tarjetas tipo dorsal para los Energy Packs.
