# Metafields de los Energy Packs

La ficha de producto de cada pack (`tag: kits`) lee dos campos propios desde
Shopify. Se llenan en el admin, en la ficha del producto, sección
**Metafields** (están fijados, aparecen sin buscar):

| Campo en el admin                      | Clave              | Tipo            | Dónde se ve en la web                       |
| -------------------------------------- | ------------------ | --------------- | ------------------------------------------- |
| **Qué trae el pack**                   | `custom.contenido` | Lista de textos | Bloque "Qué trae el pack", arriba del botón |
| **Cuándo tomar qué (guía de carrera)** | `custom.guia_uso`  | JSON            | Línea de tiempo "Cuándo tomar qué", debajo del botón |

Las definiciones ya existen (las creó `scripts/create-pack-metafields.mjs`
el 23 de agosto de 2026). Cualquier cambio en un producto dispara el webhook
`products/update` y la web se actualiza sola en menos de un minuto.

## Qué trae el pack (`custom.contenido`)

Una línea por producto, con cantidad, en el orden en que se usan:

```
1 sobre de Pre Race
4 geles de fruta de 30 g
2 Energy Gel
1 sobre de Recovery Pro
```

- Máximo 120 caracteres por línea; sin punto final.
- Mientras este campo esté vacío, la web saca la lista del primer listado
  de la descripción ("El Energy Pack 42K incluye: …"). Al llenarlo, manda
  este campo y la lista de la descripción deja de mostrarse arriba.

## Cuándo tomar qué (`custom.guia_uso`)

Una lista JSON de pasos, en orden. Cada paso tiene:

| Campo     | Obligatorio | Qué va                                                                 |
| --------- | ----------- | ---------------------------------------------------------------------- |
| `cuando`  | sí          | Etiqueta corta del momento (máx. 24 caracteres): `"Desayuno"`, `"Km 7"`, `"Cada 30 min"`, `"Meta +30 min"`, `"Hora 2"` |
| `que`     | sí          | Qué se toma (máx. 80): `"Gel de fruta"`, `"1 sobre de Recovery Pro"`  |
| `nota`    | no          | Detalle corto (máx. 160): `"Con un sorbo grande de agua"`              |
| `momento` | no          | `"antes"`, `"durante"` o `"despues"` (sin tilde). Colorea el punto.    |

Ejemplo completo para el **Energy Pack Maratón 42K**:

```json
[
  { "cuando": "Desayuno", "que": "1 sobre de Pre Race", "nota": "En 250 ml de tu bebida favorita", "momento": "antes" },
  { "cuando": "Km 7", "que": "Gel de fruta", "nota": "Con un sorbo grande de agua", "momento": "durante" },
  { "cuando": "Km 14", "que": "Gel de fruta", "momento": "durante" },
  { "cuando": "Km 21", "que": "Energy Gel", "momento": "durante" },
  { "cuando": "Km 28", "que": "Gel de fruta", "momento": "durante" },
  { "cuando": "Km 30", "que": "Energy Gel", "momento": "durante" },
  { "cuando": "Km 35", "que": "Gel de fruta", "momento": "durante" },
  { "cuando": "Km 39", "que": "Energy Gel", "momento": "durante" },
  { "cuando": "Meta +30 min", "que": "1 sobre de Recovery Pro", "nota": "En 250 ml de agua", "momento": "despues" }
]
```

Para packs de ciclismo o triatlón, `cuando` puede ser por tiempo o por
tramo: `"Hora 1"`, `"Cada 45 min"`, `"Natación"`, `"Bici · hora 2"`, `"Trote"`.

Reglas:

- Máximo 12 pasos; los demás se ignoran.
- Comillas dobles, comas entre pasos, corchetes por fuera. Shopify avisa si
  el JSON está mal formado y no deja guardar.
- Un paso sin `cuando` o sin `que` se salta sin afectar los demás. Un
  `momento` distinto de los tres valores se ignora (el paso sí se muestra).
- Si el campo está vacío o todo viene mal, el bloque simplemente no aparece:
  nunca rompe la página.

## Cómo comprobar

Abrir la ficha del pack en actimax.com.co desde el celular: "Qué trae el
pack" debe salir entre el precio y el botón **Agregar al carrito**, y
"Cuándo tomar qué" debajo de los métodos de pago, deslizable hacia los lados.
