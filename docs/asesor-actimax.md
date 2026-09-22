# Asesor Actimax — fase 1

El asesor vive en `/mi-plan/`, junto a la calculadora existente. Las entradas
con `?deporte=` o `?distancia=` siguen abriendo la calculadora. La conversación
se mantiene al cambiar de pestaña y se descarta al salir/recargar; no se guarda
el perfil en una base de datos ni se envía el texto a Web Analytics.

## Servicios y configuración

Únicos servicios de runtime: Shopify Storefront y Vercel AI Gateway.
Dependencias añadidas: `ai`, `@ai-sdk/react`, `zod`. Node.js 22 o superior.

```dotenv
# Configurar en .env.local y en Vercel (solo servidor).
AI_GATEWAY_API_KEY=...
# Opcional: modelo conversacional con herramientas y salida estructurada.
ACTIMAX_CHAT_MODEL=openai/gpt-4.1-mini
```

También se admite la autenticación OIDC de Vercel (`VERCEL_OIDC_TOKEN`); el SDK
resuelve las credenciales. El endpoint responde 503 si no hay credenciales.
El proyecto Gateway debe tener acceso y cuota para ambos modelos.

- `ToolLoopAgent`: consulta de catálogo. `generateText` produce después la salida
  Zod, sin herramientas activas. Separar esas llamadas permite usar Gemini, que
  rechaza herramientas forzadas junto a `responseMimeType: application/json`.
- `openai/gpt-4.1-mini`: modelo de conversación inicial, intercambiable mediante
  la variable anterior. Comprobado con las credenciales actuales. El modelo
  Gemini 3.8 Flash consultado durante desarrollo exige créditos de pago en la
  cuenta actual.
- `typesafe-ai/jev`: **evaluador**, no modelo de chat. Se invoca mediante
  `experimental_evaluate` y evalúa el fundamento de la propuesta antes de
  publicarla. Sus decisiones son probabilísticas, no una garantía de exactitud.
  Las comprobaciones de productos, variantes, restricciones y precios se hacen
  además en TypeScript.

La API de evaluación es experimental; las versiones del SDK están fijadas.
Revisar los cambios de esa API y ejecutar los tests al actualizar.

## Flujo

1. `POST /api/asesor/` limita tamaño/historial y acepta solo roles user/assistant.
   Los resultados de herramientas enviados por el cliente se descartan.
2. `getCatalogoAsesor()` lee Shopify sin el respaldo histórico ni el scope de
   caché de la tienda. Si Shopify falla, no se emiten productos del JSON local.
3. `catalogoParaAsesor()` une identidades explícitas de producto y sabor con la
   referencia nutricional. Elimina unidades exclusivas del armador, retirados,
   variantes agotadas, precios inválidos y composiciones no reconocidas.
4. El agente consulta un catálogo compacto: una fórmula por familia, valores
   variables por sabor y el protocolo de uso. Sin copiar HTML ni URLs de
   imágenes al contexto. Si la cafeína sigue `sin_confirmar` y eso retiene
   variantes, la herramienta lo dice (`retenidasPorCafeina`) para que el asesor
   pregunte en lugar de tomar el catálogo recortado por el completo.
5. Genera un objeto con perfil, mensaje y selecciones de variantes (tope de
   seguridad `MAX_RECOMENDACIONES = 6`, no un cupo de asesoría: la decisión de
   cuántos productos proponer es del modelo, según lo que describa el cliente).
   El modelo elige una clave corta de variante (el número final del GID, único
   en la tienda), así que no puede cruzar un producto con el sabor de otro.
   Gemini rechaza con un 400 genérico («Request contains an invalid argument»)
   los esquemas que pasan de cierto tamaño: con GID completos cabían 25
   variantes y el catálogo tiene 33, y la unión por producto que había antes
   fallaba desde 11 productos. Un test mantiene el esquema bajo ese límite. La selección se
   guía por el protocolo de uso (ver más abajo): energía e hidratación son
   necesidades distintas del momento «durante» y pueden ir juntas.
   Pregunta deporte/duración si faltan; no transforma frecuencia semanal en
   consumo de suplementos. Entiende `cycling/cicling`, `1:30` y errores de
   escritura en contexto. Si el cliente no indica sabor o delega la elección,
   propone uno disponible y lo presenta como sugerencia, no como preferencia
   del cliente. Elegir sabor no es requisito para recibir recomendaciones.
6. `validarRecomendacion()` comprueba IDs, momento, duplicados, cafeína,
   restricciones, envases enteros y presupuesto. No se inventan compras para
   varias semanas si el usuario no indicó el consumo necesario.
7. Jev evalúa por separado compatibilidad con el perfil y fundamento de las
   afirmaciones, usando conversación y catálogo como evidencia. Puede haber una
   reparación, que recibe la propuesta rechazada y los problemas identificados.
   Un segundo rechazo se muestra como error recuperable, sin volver a pedir
   deporte/duración que el usuario ya dio ni publicar productos. Si falla el
   servicio de evaluación se devuelve un error
   recuperable, no una recomendación sin verificar.
8. El protocolo UI del SDK transmite estados de progreso y, tras validar, texto
   y tarjetas. El texto pendiente de evaluación nunca se envía al navegador.
9. Al pulsar Agregar, `POST /api/asesor/carrito/` vuelve a comprobar variante,
   disponibilidad y precio. Si cambió el precio, pide actualizar la selección.
   El navegador usa después el `CartProvider` existente; Shopify calcula el
   precio definitivo en su checkout.

El agente no recibe herramientas meteorológicas ni de búsqueda. No puede
afirmar que investigó una carrera. Las condiciones que aporte el cliente se
tratan como datos del cliente, no como hechos verificados externamente.

## Referencia nutricional

`src/data/nutricion.ts` registra las 12 presentaciones del Catálogo Actimax 2026
aportado por la marca, con fórmulas compartidas y composición de geles por sabor.
La división histórica de Shopify entre productos con/sin cafeína produce 14
identidades de catálogo para esas 12 presentaciones. La referencia no implica
que todas estén publicadas o disponibles hoy.

No se modifica Shopify automáticamente. Para actualizar fórmulas, modificar la
referencia y sus pruebas; precio, publicación y existencias siguen en Shopify.
Packs y unidades del armador no se recomiendan en esta fase: el material recibido
no define composición estructurada de esos packs y el armador conserva su propio
flujo de unidades. Recovery normal se conserva como conocimiento estructurado,
pero está retirado en el registro del sitio y no se ofrece.

### Bases y discrepancias que se conservaron

- **Desconocido ≠ cero:** las cantidades no significativas de nutrientes
  permanecen `null`. No se usa «no es fuente significativa» para fabricar una
  cifra exacta.
- **Cafeína:** única excepción. La marca confirmó el 21 sep 2026 que un producto
  sin sección de cafeína no la contiene, así que Protein Bar, Recovery y
  Recovery Pro figuran con 0 y se ofrecen a quien pide «sin cafeína». La regla
  que excluye cafeína `null` se mantiene para productos nuevos sin confirmar.
- **Atributos:** los iconos generales no estaban asignados por producto. No se
  declara que sean sin gluten, veganos o sin lácteos. La miel de Protein Bar
  descarta vegano; suero/caseinato descartan vegano y sin lácteos en Recovery.
- **Energy Gel ≠ Gel Energético:** 22 g por tubo de Energy Gel de 30 g, frente a
  9,4–10 g en los sobres de Gel Energético de 30 g.
- **Geles:** datos específicos por sabor; Fresa-banano es sin cafeína. El gel de
  90 g se expresa por sobre completo, aunque la guía indique medios sobres.
- **Élite:** cálculo por bidón usando los destacados de 30 g/500 ml: 27,5 g de
  carbohidratos y 255 mg de sodio sin cafeína; 250 mg de sodio y 55 mg de cafeína
  para la fórmula con cafeína. La tabla de 15 g/240 ml se conserva separada;
  duplicarla no da los mismos números y no se mezcla con los destacados.
- **Rendimiento:** se redondea hacia abajo el número de porciones completas por
  envase. Pre Race 500 g / 36 g = 13 completas; Recovery Pro 400 g / 37 g = 10;
  Élite 500 g / 30 g = 16 bidones completos. Las cifras 14/11/17 de la marca son
  aproximaciones. Las compras se calculan por masa total y se redondean hacia
  arriba en envases enteros, aprovechando los restos entre tarros del mismo sabor
  para no recomendar envases de más.
- **Preparación:** varias fichas declaran tabla por 240 ml y preparación por
  250 ml, y difieren en cucharadas/scoops. Se mantienen los gramos y se indica
  la discrepancia, sin recalcular nutrientes a partir de esas medidas.
- **Recovery Pro:** se anuncian cuatro proteínas, pero solo se nombran tres;
  no se añade una cuarta. La grasa total de caja/tarro se declara de forma
  diferente; no se copia el dato del tarro como afirmación para la caja.
- **Sabores Shopify:** alias explícitos verificados para «Tutti Fruti»,
  «Cookies and Cream» y «Fresa-Banano (sin cafeína)». Un sabor desconocido o
  surtido no recibe una composición por similitud.

### Protocolo de uso

`PROTOCOLO_ENTRENAMIENTO` guarda la guía por etapas de la marca y viaja con el
catálogo en cada consulta, así que Jev la acepta como evidencia igual que la
tabla nutricional: umbral de 45 minutos de sesión, Pre Race unos 30 minutos
antes, 1 gel cada 30 min en zona 4-5 o cada 45 min en zona 2-3, ≈500 ml por
hora de bebida preparada a sorbos cada 10 min, y proteína con carbohidratos en
los primeros 30 minutos después.

Sin ese dato el asesor no tenía con qué distinguir un gel de una bebida —el
prompt solo traía barandas contra invenciones— y en producción repetía siempre
el mismo par (Pre Race en tarro + Bebida Élite en tarro), sin geles ni
recuperación. El caso `cobertura` de `verificar-asesor.mjs` cubre esa regresión.

No se incluyen las advertencias de salud del material original (lesiones,
defensas, sobreentrenamiento, lactato): son afirmaciones clínicas que el asesor
no puede sostener, y el prompt sigue prohibiendo convertir el protocolo en
promesas de resultado. Un test comprueba que esos términos no entren.

## Límites y operación

- Hasta 24 mensajes, 24.000 caracteres de conversación y 48 KB de request.
- Una consulta de herramienta y una generación estructurada por intento, con
  una reparación como máximo. Si Gemini termina sin JSON parseable, se gasta
  ese intento en vez de mostrar un error.
- Hasta 6 productos por recomendación, el mismo tope en `/api/asesor/carrito/`.
- Timeout total de 55 s; función Vercel de 60 s.
- Límite complementario de 20 requests/10 min por IP e instancia (incluye
  comprobaciones de carrito). No es un contador distribuido.
- Configurar rate limiting nativo en Vercel Firewall para `/api/asesor/` y
  `/api/asesor/carrito/`, y presupuesto del proyecto en AI Gateway antes de
  ampliar el tráfico. Así no hace falta añadir Redis u otro servicio.
- La cuota gratuita puede limitar un modelo aunque una llamada pequeña pase.
  Verificar créditos/acceso de Gateway para tráfico de producción.
- Eventos de producto: `consulta_asesor` y `agregar_al_carrito` con
  `origen: asesor`; nunca el texto de la conversación.

## Verificación

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Las pruebas de agente usan dobles de modelos y no gastan créditos. Cubren
rechazos de Jev, indisponibilidad, cancelación, grounding de variantes, cafeína,
alias, fórmulas, redondeos de compra, presupuesto e historial no confiable.
Las comprobaciones reales de Gateway se hacen aparte con las credenciales del
entorno. Probar también una conversación incompleta, otra con producto/sabor
concretos, ajuste de presupuesto y cambio de preferencia de cafeína.

La conversación que antes entraba en bucle está guardada como regresión real:

```sh
# Con pnpm dev en ejecución. Consume cuota de AI Gateway.
node scripts/verificar-asesor.mjs
# También admite un caso individual:
node scripts/verificar-asesor.mjs ciclismo
```

Comprueba que recomienda con «1:30 cicling», respeta un cambio posterior a
«sin cafeína», pregunta solo cuando faltan datos y que una sesión larga e
intensa recibe gel y recuperación, no solo un producto de antes y una bebida. La causa del bucle era que
todo rechazo de validación devolvía la misma pregunta genérica, con reglas
demasiado restrictivas sobre el sabor y sin límites de variantes en el esquema.

Referencias: [AI SDK Agents](https://ai-sdk.dev/docs/agents/building-agents),
[AI SDK Evaluation](https://ai-sdk.dev/docs/ai-sdk-core/evaluation),
[Jev en Gateway](https://vercel.com/ai-gateway/models/jev).
