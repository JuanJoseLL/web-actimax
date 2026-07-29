# Actimax — Storefront Shopify

Storefront de Actimax (nutrición deportiva especializada, Medellín) construido
con **Next.js 16 + Tailwind CSS v4** y conectado a Shopify.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Abre <http://localhost:3000>.

## Fuentes de datos

**Real (extraído del sitio actual de WooCommerce):**

- Los 35 productos históricos con nombres, precios en COP, descripciones y
  recomendaciones de uso (`src/data/catalog.json`).
- Las imágenes migradas a Shopify y el respaldo de medios históricos.
- Las categorías: tipo (geles/bebidas/barras/kits), momento de uso
  (antes/durante/después) y deporte.

**Integrado con Shopify:**

- El catálogo lee productos publicados mediante la Storefront API y conserva
  el catálogo local por producto cuando Shopify no está disponible o un
  producto sigue como borrador.
- Los productos con sabores exponen sus variantes reales y obligan a elegir una
  opción antes de agregarlos al carrito.
- El carrito se conserva en el navegador. "Finalizar compra" crea un carrito
  en Shopify y abre su checkout seguro; Shopify calcula el total definitivo,
  envío, impuestos y pago.

**Simulado (solo como respaldo):**

- Las 3 entradas de `src/data/blog.ts` se muestran únicamente mientras Shopify
  no tenga artículos publicados o no esté disponible.
- El enlace de WhatsApp de mayoristas apunta a un número de relleno.

## Arquitectura Shopify

El plan es que la tienda real corra sobre **Shopify** (la administra una
persona no técnica) con este front en Next.js:

- Toda la lectura de productos pasa por `src/lib/catalog.ts`, que combina
  Shopify con `src/data/catalog.json` como respaldo por handle.
- El carrito visual vive en `src/components/cart/`; al finalizar, la ruta
  `src/app/api/checkout/route.ts` crea el carrito de Shopify y devuelve su
  `checkoutUrl` hosteado.
- El blog saldrá del blog nativo de Shopify (mismo panel de administración que
  los productos). El storefront conserva las URL históricas de WordPress y lee
  los artículos publicados mediante Storefront API.

## Estado del catálogo

La migración definitiva a la tienda Client transfer de Colombia se completó el
28 de julio de 2026:

- La tienda de producción es `actimax-hzfavz8j.myshopify.com`; la anterior
  `actimax-demo.myshopify.com` queda únicamente como fuente y entorno de prueba.
- El catálogo contiene 35 productos activos, 59 variantes y 170 unidades en la
  ubicación Actimax Envigado.
- Los 35 productos están publicados en el canal Headless; los 19 productos que
  ya estaban habilitados comercialmente también conservan sus publicaciones de
  Online Store y POS.
- Las 125 imágenes de producto, las imágenes del respaldo local y las 81
  entradas del blog fueron copiadas a la nueva tienda sin depender del CDN de
  la tienda Dev.
- El GTIN `7709990576603` no se asignó porque aparece en los productos de origen
  `524`, `22458` y `22468`; debe resolverse antes de completar esos códigos.

No vuelvas a importar el CSV histórico de productos. La tienda Client transfer
es la fuente oficial para el trabajo diario. Los comandos `shopify:migrate` y
`shopify:verify` son exclusivamente de recuperación histórica y exigen declarar
explícitamente `SOURCE_SHOPIFY_STORE_DOMAIN` y
`TARGET_SHOPIFY_STORE_DOMAIN`; no configures la tienda Dev en `.env.local`.

## URL de productos

Las 35 URL canónicas de WooCommerce son parte de la identidad permanente del
catálogo y no se derivan del handle de Shopify:

- `src/data/product-identities.json` relaciona WordPress ID, handle y canonical.
- `src/lib/product-paths.ts` resuelve enlaces internos y genera los 31 rewrites
  y alias necesarios.
- `src/data/legacy-url-redirects.json` contiene únicamente redirecciones
  históricas que necesita el runtime.
- `next.config.ts` sirve los canonicals históricos y redirige las rutas planas.

No cambies un canonical existente ni vuelvas a aplanar las rutas de producto.

## Configurar Shopify y pagos de prueba

Configura estas variables en `.env.local` y también en el proveedor de
despliegue:

```bash
SHOPIFY_STORE_DOMAIN=actimax-hzfavz8j.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=token_publico_de_actimax_headless
SHOPIFY_BLOG_HANDLE=blog
```

`SHOPIFY_CLIENT_ID` y `SHOPIFY_CLIENT_SECRET` pertenecen a la integración
administrativa instalada en la tienda Actimax. Se usan únicamente en scripts de
migración y mantenimiento; no se despliegan al frontend.

Los productos deben estar activos y publicados en el canal asociado a la
Storefront API. Cuando un producto tiene varias variantes, la página exige
seleccionar una opción disponible y envía su GID exacto al checkout.

Para recorrer el pago sin cobrar mientras la Client transfer store sigue bajo
la organización del Partner:

1. Ve a **Shopify Admin → Configuración → Pagos**.
2. Agrega y activa **(for testing) Bogus Gateway**. Si hay otro proveedor de
   tarjeta activo, desactívalo primero cuando Shopify lo solicite.
3. Ve a **Tienda online → Acceso a la tienda → Protección con contraseña**,
   define la contraseña y guárdala. No es la contraseña de tu cuenta de
   administrador: Shopify no permite desactivar esta pantalla antes de la
   transferencia y activación del plan.
4. Desde esta web, agrega un producto y pulsa **Finalizar compra**. La primera
   vez, Shopify solicita la contraseña y después abre la portada de su tema;
   es una limitación de las tiendas de desarrollo. Vuelve a esta web y pulsa
   **Finalizar compra** otra vez: la contraseña ya queda autorizada en ese
   navegador y ahora debe abrir el checkout.
5. En el checkout usa `Bogus Gateway` como nombre, `1` como número de tarjeta
   para aprobar (`2` simula rechazo y `3` un error), cualquier CVV de tres
   dígitos y una fecha futura.

Bogus Gateway solo valida el flujo. Para producción se reemplaza en Shopify
por un proveedor disponible en Colombia, como Wompi o Mercado Pago, sin mover
datos de tarjeta por esta aplicación.

## Estructura

```
src/
  app/                 páginas y ruta interna /productos/[handle]
  components/          Header, Footer, ProductCard, carrito, galería, etc.
  data/catalog.json    respaldo local de los 35 productos
  data/product-identities.json  identidad y canonical de producto
  data/legacy-url-redirects.json  redirecciones requeridas en producción
  data/blog.ts         respaldo local si Shopify no está disponible
  lib/blog.ts          lectura del blog nativo de Shopify
  lib/catalog.ts       Shopify Storefront API + respaldo local
  lib/product-paths.ts resolución de URL canónicas
public/products/       fotos reales de producto
```

La migración de los 79 artículos de WordPress, sus imágenes y sus URL está
documentada en [`shopify-import/README.md`](shopify-import/README.md).

## Identidad visual

- Azul de marca `#002F87` (tomado del SVG del logo) + amarillo señalización
  `#FFD23C` + tinta `#0A1128`.
- Titulares en **Barlow Condensed** (equivalente libre de Neue Plak, la fuente
  de marca del sitio actual), texto en **Archivo**.
- Firma visual: la línea de ruta con los tres momentos de nutrición
  (antes / durante / después) y las tarjetas tipo dorsal para los Energy Packs.
