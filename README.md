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

**Integrado con Shopify:**

- El catálogo lee productos publicados mediante la Storefront API y conserva
  un respaldo local si Shopify no está disponible.
- El carrito se conserva en el navegador. "Finalizar compra" crea un carrito
  en Shopify y abre su checkout seguro; Shopify calcula el total definitivo,
  envío, impuestos y pago.

**Simulado (solo para el demo):**

- Las 3 entradas del blog son artículos de muestra (`src/data/blog.ts`).
- El enlace de WhatsApp de mayoristas apunta a un número de relleno.

## Arquitectura pensada para migrar a Shopify

El plan es que la tienda real corra sobre **Shopify** (la administra una
persona no técnica) con este front en Next.js:

- Toda la lectura de productos pasa por `src/lib/catalog.ts`, que usa Shopify
  cuando están configuradas las credenciales y el JSON local como respaldo.
- El carrito visual vive en `src/components/cart/`; al finalizar, la ruta
  `src/app/api/checkout/route.ts` crea el carrito de Shopify y devuelve su
  `checkoutUrl` hosteado.
- El blog saldrá del blog nativo de Shopify (mismo panel de administración que
  los productos).

## Configurar Shopify y pagos de prueba

Configura estas variables en `.env.local` y también en el proveedor de
despliegue:

```bash
SHOPIFY_STORE_DOMAIN=tu-tienda.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=tu_token_storefront
```

Los productos deben estar activos y publicados en el canal asociado a la
Storefront API. Esta interfaz vende la primera variante de cada producto.

Para recorrer el pago sin cobrar en una tienda de desarrollo:

1. Ve a **Shopify Admin → Configuración → Pagos**.
2. Agrega y activa **(for testing) Bogus Gateway**. Si hay otro proveedor de
   tarjeta activo, desactívalo primero cuando Shopify lo solicite.
3. Ve a **Tienda online → Preferencias → Protección con contraseña**, define
   la contraseña de la tienda y guárdala. No es la contraseña de tu cuenta de
   administrador: Shopify no permite desactivar esta pantalla en una tienda de
   desarrollo.
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
