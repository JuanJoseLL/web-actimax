# ACTIMAX — SEO/AEO/GEO fase 2

Este paquete no cambia el diseño, el carrito, el checkout ni la conexión con
Shopify. Añade señales técnicas y corrige datos que consumen Google y otros
motores.

## Qué incluye

1. NAP consistente: teléfono `+57 304 658 0298`, razón social, NIT, correo,
   dirección, código postal, horario y perfil de Google Maps.
2. Entidad local: coordenadas y `hasMap` de la sede Portal del Cerro.
3. Política de cambios enlazada mediante `MerchantReturnPolicy`.
4. Política de envíos mediante `ShippingService`, con procesamiento de lunes a
   sábado y tiempos nacionales. Las tarifas no se declaran como campos
   estructurados porque Google no permite excluir San Andrés y Providencia por
   región en Colombia; el detalle completo queda en la página legal enlazada.
5. Productos: `updatedAt`, SKU y códigos GTIN/barcode reales de Shopify. Se
   mantienen las ofertas por sabor sin declarar `ProductGroup`, porque Google
   exige una URL que abra cada variante preseleccionada y el sitio todavía no
   tiene esas URL.
6. Artículos: `dateModified` real de Shopify y fechas reales en el sitemap.
7. Breadcrumbs semánticos en catálogo, blog, paginación, artículos, Arma tu
   kit, Mi Plan, comparador y rastreo, sin añadir elementos visibles.
8. Idioma `es-CO` y feed RSS en `/feed.xml`, anunciado desde los metadatos.
9. `llms.txt` corregido y ampliado con la entidad, ubicación y políticas.

## Ajuste previo en Shopify: obligatorio

Antes de desplegar el código, abre **Shopify → Configuración → Políticas →
Política de envíos** y realiza únicamente estos dos cambios:

1. En la lista de transportadoras agrega:

   `• FedEx`

2. En la sección de procesamiento, deja explícito:

   `También procesamos y despachamos pedidos los sábados. Los pedidos realizados los domingos o días festivos se procesan el siguiente día hábil.`

No cambies estas condiciones ya publicadas:

- Envíos únicamente dentro de Colombia.
- Envío gratis desde $120.000 COP, excepto San Andrés y Providencia.
- Envíos inferiores a $120.000 COP: $13.000 COP.
- San Andrés y Providencia: $30.000 COP siempre, sin envío gratis.
- Preparación y despacho dentro de los 2 días hábiles siguientes.
- Entrega nacional estimada de 3 a 5 días hábiles.

Luego guarda la política y comprueba que el texto actualizado aparezca en
<https://actimax.com.co/envios-y-entregas/>.

## Instalación desde Visual Studio Code / PowerShell

1. Abre la carpeta local del repositorio `web-actimax` en Visual Studio Code.
2. Abre **Terminal → New Terminal** y confirma que diga `PowerShell`.
3. Ejecuta, una línea a la vez:

   ```powershell
   git checkout main
   git pull origin main
   git status
   ```

4. Copia `actimax-seo-aeo-geo-phase-2.patch` dentro de la carpeta raíz del
   repositorio y ejecuta:

   ```powershell
   git apply --check .\actimax-seo-aeo-geo-phase-2.patch
   git apply .\actimax-seo-aeo-geo-phase-2.patch
   pnpm install --frozen-lockfile
   pnpm test
   pnpm lint
   pnpm build
   ```

5. Si los comandos terminan correctamente, publica:

   ```powershell
   Remove-Item .\actimax-seo-aeo-geo-phase-2.patch
   git add src docs
   git commit -m "Improve Actimax SEO entity discovery and structured data"
   git push origin main
   ```

El `push` a `main` activa el despliegue conectado a GitHub; no hace falta
entrar a Vercel.

## Comprobaciones después del despliegue

1. Abre estos enlaces en incógnito:
   - <https://actimax.com.co/llms.txt>
   - <https://actimax.com.co/feed.xml>
   - <https://actimax.com.co/sitemap.xml>
2. Confirma que `llms.txt` muestre el teléfono terminado en `0298`.
3. Prueba el home y una ficha de producto en
   <https://search.google.com/test/rich-results>.
4. En Google Search Console, inspecciona el home y una ficha de producto y
   solicita indexación solo después de que la prueba no tenga errores críticos.
5. Vuelve a enviar `https://actimax.com.co/sitemap.xml` en Search Console.

## Guía para los próximos artículos (no modifica los ya publicados)

- Una intención de búsqueda clara por artículo y un solo H1 descriptivo.
- Respuesta breve y directa en las primeras líneas; después, explicación.
- Autor real o equipo responsable y fecha de actualización solo cuando exista
  una revisión sustancial.
- Datos verificables, cantidades y recomendaciones coherentes con las fichas
  de producto; enlazar fuentes primarias cuando corresponda.
- Enlaces internos naturales a la categoría, producto o guía más útil, sin
  repetir palabras clave artificialmente.
- Imágenes propias con `alt` descriptivo; no usar el nombre del archivo como
  texto alternativo.
- FAQ únicamente si las preguntas y respuestas también son visibles para el
  lector. No crear contenido oculto solo para schema.
- Revisar título SEO, descripción, URL corta y vista previa social antes de
  publicar.
