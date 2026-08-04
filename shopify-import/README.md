# Migracion del blog WordPress a Shopify

El storefront conserva las URL publicas de WordPress aunque Shopify guarde los
articulos internamente en `/blogs/blog/...`:

- 72 articulos siguen disponibles en `/blog/{slug}/`.
- Los 9 articulos historicos publicados en la raiz siguen en `/{slug}/`.
- Las categorias siguen disponibles en `/blog/{categoria}/`.
- Las imagenes antiguas bajo `/wp-content/uploads/...` redirigen a Shopify CDN.

## 1. Preparar y auditar

```bash
pnpm blog:prepare
```

Este comando consulta la API publica de WordPress y genera:

- `blog-migration-manifest.json`: inventario de articulos, fechas, SEO e imagenes.
- `../src/data/blog-paths.json`: mapa de URL que usa el storefront.
- `shopify-native-blog-redirects.csv`: alternativa si se abandona el frontend
  headless y el dominio se conecta directamente al tema nativo de Shopify.

## 2. Dar acceso de migracion

En Shopify Admin, crea una aplicacion personalizada con estos permisos de Admin
API:

- `read_content` y `write_content`
- `read_files` y `write_files`

Instala la aplicacion y agrega sus credenciales a `.env.local`:

```bash
SHOPIFY_CLIENT_ID=...
SHOPIFY_CLIENT_SECRET=...
SHOPIFY_BLOG_HANDLE=blog
```

El importador intercambia estas credenciales por un token temporal de 24 horas.
Las credenciales son solo para el proceso local de migracion. No deben
configurarse en el frontend ni subirse al repositorio.

## 3. Importar

```bash
pnpm blog:import
```

El importador es reanudable e idempotente. Crea o actualiza articulos por
`handle`, copia las imagenes externas, las imagenes base64 y las imagenes
heredadas del catalogo local a Shopify Files, conserva las fechas historicas y
guarda el progreso en `blog-migration-state.json`.

## 4. Verificar

```bash
pnpm blog:verify
pnpm build
```

La verificacion compara WordPress con Storefront API y falla si falta un
articulo, cambia un titulo, falta una imagen destacada o cualquier imagen del
blog o cualquier imagen externa del catalogo no esta alojada en Shopify CDN.

## Corte de dominio

Antes de apuntar `actimax.com.co` al nuevo storefront:

1. Ejecutar de nuevo `pnpm blog:import` para capturar cambios editoriales finales.
2. Ejecutar `pnpm blog:verify` y probar una muestra de articulos antiguos y nuevos.
3. Desplegar el frontend con `NEXT_PUBLIC_SITE_URL=https://actimax.com.co`.
4. Mantener una copia del WordPress y sus medios durante al menos 90 dias.
5. Enviar `https://actimax.com.co/sitemap.xml` a Google Search Console.
6. Revisar errores 404, indexacion y Core Web Vitals durante las semanas siguientes.

## Fotos de producto

`product-photos-manifest.json` declara, por handle, que fotos nuevas van (en
orden, con su `alt`) y que media vieja se conserva (`keep`: las tablas
nutricionales). Todo lo demas se borra.

```bash
pnpm photos:stage    # copia la sesion de fotos a public/products con nombre SEO
pnpm photos:plan     # muestra que se subiria, conservaria y borraria
pnpm photos:apply    # sube, reordena y borra en Shopify + sincroniza el repo
pnpm photos:verify   # comprueba que Shopify, catalog.json y los 301 coinciden
```

`apply` es reanudable e idempotente: si las fotos ya estan en Shopify no las
vuelve a subir. Antes de borrar guarda en `product-photos-state.json` la URL de
cada archivo eliminado, porque las redirecciones de
`/wp-content/uploads/...` de `legacy-image-redirects.json` apuntaban a esos
mismos archivos; el paso de sincronizacion las reapunta una a una a la foto
nueva equivalente para no perder el SEO de imagenes ya indexadas.

## Resenas de productos

`pnpm reviews:prepare` consulta los productos publicados en Shopify y convierte
`src/data/reviews.json` al formato de importacion de Judge.me. El resultado queda
en `judgeme-reviews.csv`; las resenas de productos que ya no existen se omiten.
