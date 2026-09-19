/** Regresión con modelos reales. Requiere pnpm dev y consume cuota de Gateway.
 * node scripts/verificar-asesor.mjs [ciclismo|ciclismo-inicial|sin-cafeina|incompleto]
 * ASISTENTE_URL permite apuntar a un preview en lugar de localhost.
 */
import assert from "node:assert/strict";

const historial = [
  ["user", "Entreno 3 días por semana, ¿qué me recomiendas?"],
  ["assistant", "Para recomendar bien, necesito saber qué deporte entrenas y cuánto dura cada sesión en minutos. ¿Me puedes contar? También si prefieres productos sin cafeína o si no importa."],
  ["user", "no me importa la Ceferina en los productos y entreno 1:30 cicling"],
  ["assistant", "Me falta confirmar algunos detalles para darte una recomendación concreta. ¿Qué actividad vas a hacer, cuánto durará y qué productos o sabores prefieres?"],
  ["user", "hago cycling dura 1:30 y productos o sabores no me importa para eso te pido que me recomiéndes"],
];
const casos = {
  ciclismo: { turnos: historial, debeRecomendar: true },
  "ciclismo-inicial": { turnos: historial.slice(0, 3), debeRecomendar: true },
  "sin-cafeina": {
    turnos: [...historial, ["assistant", "Puedo proponerte una bebida para el ciclismo."], ["user", "Cambio de idea: quiero evitar por completo la cafeína. Cualquier sabor está bien."]],
    debeRecomendar: true,
    sinCafeina: true,
  },
  incompleto: { turnos: [historial[0]], debeRecomendar: false },
};

const seleccion = process.argv[2];
assert(!seleccion || Object.hasOwn(casos, seleccion), "Caso desconocido");
for (const [nombre, caso] of Object.entries(casos)) {
  if (seleccion && seleccion !== nombre) continue;
  const response = await fetch(`${process.env.ASISTENTE_URL ?? "http://localhost:3000"}/api/asesor/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: caso.turnos.map(([role, text]) => ({ role, parts: [{ type: "text", text }] })) }),
    signal: AbortSignal.timeout(65_000),
  });
  assert.equal(response.status, 200, `${nombre}: HTTP ${response.status}`);
  const events = (await response.text()).split("\n")
    .filter((line) => line.startsWith("data: {"))
    .map((line) => JSON.parse(line.slice(6)));
  const error = events.find((event) => event.type === "error");
  assert(!error, `${nombre}: ${error?.errorText}`);
  assert(events.some((event) => event.type === "finish"), `${nombre}: stream incompleto`);
  const texto = events.filter((event) => event.type === "text-delta").map((event) => event.delta).join("");
  const recomendaciones = events.find((event) => event.type === "data-recomendacion")?.data.recomendaciones ?? [];
  assert(texto.length > 0, `${nombre}: respuesta vacía`);
  assert.equal(recomendaciones.length > 0, caso.debeRecomendar, `${nombre}: ${texto}`);
  if (caso.debeRecomendar) {
    assert(!/qué actividad vas a hacer|cuánto durará|cuánto dura cada sesión/i.test(texto), `${nombre}: vuelve a pedir datos conocidos`);
  }
  if (caso.sinCafeina) {
    assert(recomendaciones.every((item) => item.variante.nutricion.nutrientes.cafeinaMg === 0), "Ignoró la nueva restricción de cafeína");
  }
  console.log(JSON.stringify({ caso: nombre, resultado: "OK", texto, productos: recomendaciones.map((item) => `${item.producto.title} / ${item.variante.title}`) }, null, 2));
}
