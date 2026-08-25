# Métricas de la tienda: qué medimos y cómo va

Tablero del plan de 90 días (24 ago – 22 nov 2026). Cinco números, un dueño
por número, y una fila nueva en la bitácora cada lunes.

- Plan completo (responsables y fases): https://claude.ai/code/artifact/e2a7011b-4358-4780-a9cd-504b0d4bcc0e
- Análisis técnico de donde salió el baseline: https://claude.ai/code/artifact/e9ae7264-4fec-4b5a-9d91-3e1a80614e65
- Estrategia de marketing y ruta de 90 días, con calendario de carreras (24 ago 2026): https://claude.ai/code/artifact/ceab491c-b1b8-4e46-aa71-fb06680335cf

## Cómo sacar el tablero

```bash
pnpm tablero                                    # última semana completa (lunes a domingo, UTC)
pnpm tablero -- --since 2026-08-24 --until 2026-08-30
pnpm tablero -- --json                          # lo mismo como JSON
```

Imprime en markdown la fila para la bitácora de abajo y el detalle (embudo por
dispositivo, ventas, calidad del tráfico por fuente, señales). Cruza dos
fuentes:

| Fuente | Qué aporta | Credenciales |
| --- | --- | --- |
| Vercel Web Analytics (API `v1/query/web-analytics`) | el camino: visitas, ficha, carrito, checkout, por dispositivo y por fuente | token del CLI (`~/Library/Application Support/com.vercel.cli/auth.json`) o `VERCEL_TOKEN`. Si dice `invalidToken`, correr `vercel whoami` |
| Shopify Admin API | el desenlace: pedidos pagados, ingresos, ticket, recompra | `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET` en `.env.local` |

Las reseñas no las saca el script: las cuenta Operaciones en Judge.me.

## Los cinco números

| # | Métrica | Definición exacta | Dueño | Baseline (15–22 ago) | Meta 22 nov |
| --- | --- | --- | --- | ---: | ---: |
| 1 | **Ficha→carrito en móvil** | visitantes únicos con `agregar_al_carrito` ÷ visitantes únicos con `producto_visto`, ambos con `deviceType = mobile` | Juan José | 5 de 100 (47/905) | **10 de 100** |
| 2 | **Pedidos por semana** | pedidos de Shopify con `displayFinancialStatus = PAID`, no cancelados, no de prueba, normalizados a 7 días | Dirección | 20 (23 en 8 días) | **40** |
| 3 | **Ticket medio** | ingresos ÷ pedidos, sobre `currentTotalPriceSet` (incluye envío, descuenta devoluciones) | Dirección | $139.777 | **$155.000** |
| 4 | **Recompra** | pedidos cuyo cliente tiene la etiqueta `woo-import` (compró en la tienda antigua) o `numberOfOrders > 1` ÷ pedidos | Marketing | 43% (10/23) | **50%** |
| 5 | **Reseñas publicadas** | total de reseñas visibles en Judge.me | Operaciones | 1 | **25** |

Y uno de contexto que no tiene dueño porque depende de todos: **conversión del
sitio** = pedidos ÷ visitantes reales. Baseline 0,84% (23/2.729); la meta
implícita del plan es 1,5%.

### Qué significa llegar

40 pedidos/semana × $155.000 ≈ **$25 millones al mes**, contra ~$12 millones
del baseline, sin comprar más tráfico.

## Bitácora semanal

Una fila por semana, lunes a domingo. `pnpm tablero` la imprime lista para
pegar; las reseñas las pone Operaciones. En **Notas** va lo que cambió esa
semana (qué se lanzó, qué campaña corrió), para poder atribuir el movimiento.

| Semana | Ficha→carrito móvil (de 100) | Pedidos/semana | Ticket medio | Recompra | Conversión | Reseñas | Notas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-08-15 → 2026-08-22 _(baseline, 8 días)_ | 5 | 20 | $139.777 | 43,5% | 0,84% | 1 | Semana de referencia. Cédula ya resuelta desde el 16. |
| 2026-08-24 → 2026-08-30 | | | | | | | |
| 2026-08-31 → 2026-09-06 | | | | | | | |
| 2026-09-07 → 2026-09-13 | | | | | | | |
| 2026-09-14 → 2026-09-20 | | | | | | | |
| 2026-09-21 → 2026-09-27 | | | | | | | |
| 2026-09-28 → 2026-10-04 | | | | | | | |
| 2026-10-05 → 2026-10-11 | | | | | | | |
| 2026-10-12 → 2026-10-18 | | | | | | | |
| 2026-10-19 → 2026-10-25 | | | | | | | |
| 2026-10-26 → 2026-11-01 | | | | | | | |
| 2026-11-02 → 2026-11-08 | | | | | | | |
| 2026-11-09 → 2026-11-15 | | | | | | | |
| 2026-11-16 → 2026-11-22 | | | | | | | |

## Baseline completo (15–22 de agosto de 2026)

Para comparar cualquier cosa que no esté en los cinco números.

**Embudo (visitantes únicos, 8 días):** 2.729 visitantes reales → 1.007 vieron
ficha (37%) → 61 agregaron al carrito (6,1%) → 64 iniciaron checkout → 23
pagaron (36% del checkout).

**Por dispositivo (ficha → carrito):** móvil 47/905 = 5,2% · escritorio 14/95 =
14,7% · el 90% de las visitas es móvil.

**Ventas:** 23 pedidos (#1010–#1032) · $3.214.875 · ticket medio $139.777 ·
mediana $123.000 · 17 de 23 alcanzaron envío gratis · 5 de exactamente
$120.000 · 17 de 23 con un solo producto · 10 de 23 de clientes antiguos.

**Calidad del tráfico (ficha → checkout, de cada 100):** directo 15 · Google 10 ·
Instagram 7 · Facebook 2.

**Por producto (vistas de ficha → pedidos):** Pre-Race 17→3 (18%) · Triatlón MD
28→4 (14%) · 42K 46→4 (9%) · Élite tarro (ambas) 86→6 (7%) · 21K Running 376→5
(1,3%) · 21K 268→3 (1,1%) · 42K Running 70→0.

**Herramientas:** Mi Plan 38 visitantes, 18 planes, 2 al carrito · filtros
155/1.110 · buscador 7 personas, 3 búsquedas sin resultado («hidratante»).

## Cosas que hay que saber al leer los números

- **El evento `compra` de Vercel subcuenta.** Solo dispara si el comprador
  vuelve al sitio después de pagar; en el baseline midió 10 de 23. Los pedidos
  siempre se leen de Shopify. El evento queda en el tablero solo como
  referencia.
- **La atribución de la venta por fuente no sirve.** El referente al volver del
  checkout es `pagos.actimax.com.co` (mismo dominio raíz) y se descarta, así
  que las compras salen como «directo». La calidad por fuente se mide en
  ficha → checkout, que ocurre dentro de la misma sesión.
- **Visitantes reales = visitantes − los de `/en`.** `/en` no existe (404) y
  recibió 1.581 visitantes bot el 13–14 de agosto y otros 91 el 18–19. Desde
  el 24 ago 2026 el sitio no envía a Vercel las vistas del 404
  (`src/components/WebAnalytics.tsx`), así que en ventanas nuevas el descuento
  da cero y los bots que sondean URLs inventadas ya no cuentan; el script lo
  conserva para comparar con las semanas anteriores. Como capa adicional hay
  una regla del Firewall de Vercel sobre `/en` (primero en modo `log`).
- **Tráfico de fuera de Colombia: se segmenta, no se bloquea.** El 27% de los
  visitantes (US, MX, ES, AR) son casi todos lectores del blog; solo 4 de 70
  checkouts de la semana del 16–22 ago vinieron de fuera y ningún pedido.
  Bloquear por país tumbaría a Googlebot, Merchant Center, el rastreador de
  Meta, los webhooks de Shopify y los rastreadores de IA, todos con IP
  extranjera. El tablero muestra la fila «en Colombia» para leer la
  conversión con el denominador que importa.
- **Ventanas en UTC, y cada endpoint de Vercel normaliza `until` distinto.**
  Verificado el 23 ago 2026: en `visits/count` y `events/count`,
  `until=2026-08-22` es inclusivo (hasta el 23 a las 00:00) y pasarle hora
  recorta al inicio del día. En `visits/aggregate` y `events/aggregate` se
  redondea a la hora siguiente: `2026-08-22` queda en las 01:00 del 22 (se
  pierde casi todo el día) y `2026-08-22T23:59:59.999Z` da la medianoche
  exacta. El script ya manda la forma correcta a cada uno; al consultar a mano
  con `curl`, mirar `query.until` en la respuesta antes de creerle al número.
  Shopify se consulta con un día de margen y se recorta en UTC en el script
  para cuadrar.
- **Vercel Pro guarda máximo 2 propiedades por evento.** La tercera se descarta
  en silencio y aparece como `""` al agrupar. `recomendador_kit` manda tres y
  pierde `destino` hasta que se arregle.
- **Semanas de pocos pedidos son ruidosas.** Con 20–40 pedidos, un cambio de
  ±5 puntos en recompra o de ±$10.000 en ticket puede ser azar. Leer la
  tendencia de tres semanas, no la semana sola.
- **Cuando Vercel responda `invalidToken`,** el token del CLI expiró: correr
  `vercel whoami` y repetir.

## Eventos que emite la web

Los define `src/lib/track.ts` (fan-out a Vercel, GA4 y Meta). Los que usa el
tablero, con sus propiedades:

| Evento | Propiedades | Dónde dispara |
| --- | --- | --- |
| `producto_visto` | `producto` | `BuyBox` al montar la ficha |
| `agregar_al_carrito` | `producto`, `origen` (`pagina-producto`, `catalogo`, `carrito`, `mi-plan`, `paleta`) | `AddToCartButton`, `CommandPalette` |
| `ver_carrito` | `valor`, `unidades` | `CartProvider` al abrir el drawer |
| `iniciar_checkout` | `valor`, `via` (`carrito`, `comprar-ahora`) | `CartProvider` |
| `checkout_fallido` | `motivo`, `via` | `CartProvider` |
| `compra` | `valor`, `via` | `CartProvider` al volver del checkout (subcuenta, ver arriba) |
| `recomendador_kit` | `deporte`, `distancia`, `destino` (la 3.ª se pierde) | `FuelFinder` |
| `plan_creado` | `pack`, `distancia` | `ActimaxPlanBuilder` |
| `busqueda_paleta` | `consulta`, `resultado` | `CommandPalette` |
| `newsletter_suscripcion` | `resultado`, `origen` | `NewsletterForm` |
| `resena_enviada` | `producto`, `estrellas` | `ReviewForm` |
