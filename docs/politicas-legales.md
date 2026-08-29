# Políticas legales

La revisión legal de agosto de 2026 (Marcela) pidió partir el documento único
en cinco páginas enlazadas una por una desde el pie. Así quedó:

| Página                                                      | De dónde sale el texto                       |
| ----------------------------------------------------------- | -------------------------------------------- |
| `/terminos-y-condiciones/`                                    | Shopify → **Términos del servicio** (preámbulo) |
| `/cambios-garantia-retracto/`                                 | Shopify → sección "Devoluciones, cambios…"     |
| `/tratamiento-de-datos/`                                      | Shopify → sección "Privacidad y tratamiento…"  |
| `/envios-y-entregas/`                                         | Shopify → sección "Política de envíos…"        |
| `/politica-de-cookies/`                                       | **El repo** (`src/app/politica-de-cookies/`)   |

`/politicas-devolucion-privacidad/` —la URL del documento único de
WordPress— sigue viva como índice de las cinco. No se puede borrar: está
indexada y enlazada desde fuera. Sus anclas viejas (`#devolucion`,
`#privacidad`, `#envios`) saltan solas a la página nueva.

## Dónde se edita cada texto

Cuatro de las cinco se editan en **Shopify → Configuración → Políticas**, sin
tocar el repo. La web las recachea cada hora.

La de cookies vive en el repo a propósito: Shopify no tiene ranura para
cookies, y ese texto describe scripts concretos (GA4, pixel de Meta, Web
Analytics, el carrito en `localStorage`). Si se quita o se agrega un script,
la página se actualiza en el mismo commit.

## Cómo se reparte hoy el documento consolidado

El documento revisado llegó **entero dentro de la ranura de Términos del
servicio**, con sus tres secciones adentro, mientras las ranuras de
devoluciones, privacidad y envíos seguían con el texto anterior —que
contradice al nuevo: el viejo dice que no se hacen reembolsos donde el nuevo
reconoce el derecho de retracto.

Para que el sitio no publicara las dos versiones a la vez, cada página toma su
sección del documento consolidado (`src/lib/politicas-secciones.ts`). Los
cortes son los encabezados en mayúsculas.

**Esto se resuelve solo.** El día que el equipo reparta el documento entre las
ranuras y deje en Términos del servicio únicamente los términos, no habrá
secciones que extraer y cada página caerá automáticamente en su ranura propia.
No hay bandera que bajar ni código que borrar.

## Lo que todavía falta, y es tarea de panel

1. **Repartir el documento** entre las cuatro ranuras de Shopify. La web ya no
   depende de esto, pero **el checkout sí**: Shopify enlaza sus propias
   ranuras al pie del pago, así que hasta que se repartan, quien pague verá
   ahí el texto viejo.
2. **Escribir unos Términos y Condiciones de verdad.** El documento revisado no
   trae un cuerpo de T&C: llama "Términos y Condiciones" al conjunto de las
   tres políticas. Por eso `/terminos-y-condiciones/` hoy solo muestra el
   preámbulo. Falta lo propio de unos T&C: identificación del comerciante,
   precios e impuestos, cómo se perfecciona el contrato, propiedad intelectual
   y ley aplicable.
3. **Revisar el texto de cookies** con Marcela: lo redactó desarrollo a partir
   de los scripts que corren de verdad, no un abogado.
4. **Validar con la pasarela** la afirmación sobre tarjetas. Lo que sí consta
   del lado técnico: la web nunca toca datos de tarjeta, el pago ocurre entero
   en el checkout de Shopify (`pagos.actimax.com.co`).

## Aviso de cookies

El sitio **no tiene banner de cookies**: informa en la política y explica cómo
desactivarlas desde el navegador. Poner un banner es una decisión aparte, y
tendría que ir acompañada de Consent Mode en GA4 y del consentimiento del
pixel de Meta para que no sea decorativo.
