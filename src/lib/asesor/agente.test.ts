import { beforeEach, describe, expect, it, vi } from "vitest";
import { catalogoParaAsesor } from "./catalogo";
import type { ProductoAsesor } from "./catalogo";
import type { RespuestaAsesor } from "./contrato";
import { FORMULAS } from "../../data/nutricion";

const mocks = vi.hoisted(() => ({ generar: vi.fn(), consultar: vi.fn(), evaluar: vi.fn(), configurar: vi.fn() }));
vi.mock("ai", () => ({
  ToolLoopAgent: class {
    constructor(settings: unknown) { mocks.configurar(settings); }
    generate = mocks.consultar;
  },
  generateText: mocks.generar,
  experimental_evaluate: mocks.evaluar,
  Output: { object: vi.fn((options) => options) },
  isStepCount: vi.fn(),
  tool: vi.fn((options) => options),
}));
import { responderAsesor } from "./agente";

const catalogo: ProductoAsesor[] = [{
  handle: "energy-gel-caja-x24", title: "Energy Gel", path: "/producto/", image: null,
  envase: "Caja de 24", gramosEnvase: 720, porcionesCompletas: 24,
  variantes: [{ id: "gid://shopify/ProductVariant/1", title: "Durazno", price: 100000, image: null, nutricion: FORMULAS.energy }],
}];
const propuesta: RespuestaAsesor = {
  mensaje: "Para tus salidas largas.",
  perfil: { deporte: "running", duracionMinutos: 90, sesionesSemanales: 3, cafeina: "sin", restricciones: [], presupuestoCOP: null },
  recomendaciones: [{ handle: "energy-gel-caja-x24", variantId: "gid://shopify/ProductVariant/1", momento: "durante", motivo: "Para tus salidas largas.", porcionesNecesarias: null }],
};
const conversacion = [{ role: "user" as const, content: "Corro 90 min, quiero Energy Gel de durazno, sin cafeína." }];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.consultar.mockResolvedValue({ responseMessages: [] });
  mocks.generar.mockResolvedValue({ output: structuredClone(propuesta) });
  mocks.evaluar.mockResolvedValue({ answers: { perfil: { choice: "compatible" }, afirmaciones: { choice: "fundamentadas" } } });
});

describe("agente + verificación Jev", () => {
  it("publica productos hidratados solo tras validación y Jev", async () => {
    const result = await responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn());
    expect(result.resultado.recomendaciones[0].variante.price).toBe(100000);
    expect(mocks.evaluar.mock.calls[0][0].model).toBe("typesafe-ai/jev");
  });
  it("un rechazo repetido no vuelve a pedir datos que ya se dieron", async () => {
    mocks.evaluar.mockResolvedValue({ answers: { perfil: { choice: "compatible" }, afirmaciones: { choice: "inventadas" } } });
    await expect(responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn())).rejects.toThrow("No pude validar");
    expect(mocks.generar).toHaveBeenCalledTimes(2);
  });
  it("un fallo de Jev no deja pasar recomendaciones sin comprobar", async () => {
    mocks.evaluar.mockRejectedValue(new Error("Gateway unavailable"));
    await expect(responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn())).rejects.toThrow("Gateway unavailable");
  });
  it("un catálogo vacío no puede convertirse en productos inventados", async () => {
    await expect(responderAsesor(conversacion, catalogoParaAsesor([]), new AbortController().signal, vi.fn())).rejects.toThrow("No pude validar");
    expect(mocks.evaluar).not.toHaveBeenCalled();
  });
  it("el esquema del modelo impide mezclar un handle con la variante de otro producto", async () => {
    const otro = { ...catalogo[0], handle: "otro-producto", variantes: [{ ...catalogo[0].variantes[0], id: "gid://shopify/ProductVariant/2" }] };
    await responderAsesor(conversacion, [...catalogo, otro], new AbortController().signal, vi.fn());
    const schema = mocks.generar.mock.calls[0][0].output.schema;
    const mezclada = structuredClone(propuesta);
    mezclada.recomendaciones[0].variantId = otro.variantes[0].id;
    expect(schema.safeParse(mezclada).success).toBe(false);
    expect(schema.safeParse(propuesta).success).toBe(true);
  });
  it("la reparación recibe la propuesta rechazada, no solo una orden genérica", async () => {
    const invalida = structuredClone(propuesta);
    invalida.recomendaciones[0].variantId = "gid://shopify/ProductVariant/inventada";
    mocks.generar.mockResolvedValueOnce({ output: invalida }).mockResolvedValueOnce({ output: propuesta });
    const result = await responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn());
    expect(result.resultado.recomendaciones).toHaveLength(1);
    expect(mocks.generar.mock.calls[1][0].instructions).toContain("gid://shopify/ProductVariant/inventada");
  });
  it("separa herramientas y JSON estructurado para proveedores como Gemini", async () => {
    const resultadoHerramienta = { role: "tool", content: [{ type: "tool-result", toolCallId: "catalogo-1", toolName: "consultarCatalogo", output: { type: "json", value: { productos: [] } } }] };
    mocks.consultar.mockResolvedValueOnce({ responseMessages: [resultadoHerramienta] });
    await responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn());
    expect(mocks.configurar.mock.calls[0][0]).not.toHaveProperty("output");
    expect(mocks.generar.mock.calls[0][0]).not.toHaveProperty("tools");
    expect(mocks.generar.mock.calls[0][0].messages.at(-1)).toEqual(resultadoHerramienta);
  });
  it("respeta cancelación antes de consumir modelos", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(responderAsesor(conversacion, catalogo, controller.signal, vi.fn())).rejects.toThrow();
    expect(mocks.generar).not.toHaveBeenCalled();
  });
});
