import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
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
  NoObjectGeneratedError: { isInstance: (error: unknown) => (error as Error)?.name === "AI_NoObjectGeneratedError" },
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

/** Lo que devuelve el modelo: la clave corta de la variante en vez de handle + GID. */
function salida(respuesta: RespuestaAsesor) {
  return {
    ...respuesta,
    recomendaciones: respuesta.recomendaciones.map(({ variantId, motivo, momento, porcionesNecesarias }) => ({ variante: variantId.slice(variantId.lastIndexOf("/") + 1), motivo, momento, porcionesNecesarias })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.consultar.mockResolvedValue({ responseMessages: [] });
  mocks.generar.mockResolvedValue({ output: salida(propuesta) });
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
  it("una respuesta sin JSON parseable gasta el reintento en vez de fallar", async () => {
    mocks.generar.mockRejectedValueOnce(Object.assign(new Error("No object generated"), { name: "AI_NoObjectGeneratedError" }));
    const result = await responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn());
    expect(result.resultado.recomendaciones).toHaveLength(1);
    expect(mocks.generar).toHaveBeenCalledTimes(2);
  });
  it("otros errores del modelo no se reintentan a ciegas", async () => {
    mocks.generar.mockRejectedValueOnce(new Error("Gateway 500"));
    await expect(responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn())).rejects.toThrow("Gateway 500");
    expect(mocks.generar).toHaveBeenCalledTimes(1);
  });
  it("un fallo de Jev no deja pasar recomendaciones sin comprobar", async () => {
    mocks.evaluar.mockRejectedValue(new Error("Gateway unavailable"));
    await expect(responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn())).rejects.toThrow("Gateway unavailable");
  });
  it("un catálogo vacío no puede convertirse en productos inventados", async () => {
    await expect(responderAsesor(conversacion, catalogoParaAsesor([]), new AbortController().signal, vi.fn())).rejects.toThrow("No pude validar");
    expect(mocks.evaluar).not.toHaveBeenCalled();
  });
  it("una variante pertenece a un solo producto: no se puede cruzar con otro", async () => {
    const otro = { ...catalogo[0], handle: "otro-producto", variantes: [{ ...catalogo[0].variantes[0], id: "gid://shopify/ProductVariant/2" }] };
    mocks.generar.mockResolvedValueOnce({ output: { ...salida(propuesta), recomendaciones: [{ ...salida(propuesta).recomendaciones[0], variante: "2" }] } });
    const result = await responderAsesor(conversacion, [...catalogo, otro], new AbortController().signal, vi.fn());
    expect(result.resultado.recomendaciones[0].producto.handle).toBe("otro-producto");
    const schema = mocks.generar.mock.calls[0][0].output.schema;
    expect(schema.safeParse({ ...salida(propuesta), recomendaciones: [{ ...salida(propuesta).recomendaciones[0], variante: "999" }] }).success).toBe(false);
  });
  it("el esquema cabe en el límite de Gemini con el catálogo real de GID largos", async () => {
    const productos = Array.from({ length: 14 }, (_, index) => ({
      ...catalogo[0], handle: `bebida-deportiva-elite-con-cafeina-tarro-de-500gr-${index}`,
      variantes: Array.from({ length: 4 }, (_, v) => ({ ...catalogo[0].variantes[0], id: `gid://shopify/ProductVariant/671732150${index}${v}0589` })),
    }));
    await responderAsesor(conversacion, [...catalogo, ...productos], new AbortController().signal, vi.fn()).catch(() => {});
    const json = JSON.stringify(z.toJSONSchema(mocks.generar.mock.calls[0][0].output.schema, { io: "output" }));
    expect(json).not.toMatch(/oneOf|gid:\/\//);
    // 30 opciones con GID completo ya daban 400; 57 claves cortas quedan muy por debajo.
    expect(json.length).toBeLessThan(4000);
  });
  it("la reparación recibe la propuesta rechazada, no solo una orden genérica", async () => {
    const invalida = structuredClone(propuesta);
    invalida.recomendaciones[0].variantId = "gid://shopify/ProductVariant/inventada";
    mocks.generar.mockResolvedValueOnce({ output: salida(invalida) }).mockResolvedValueOnce({ output: salida(propuesta) });
    const result = await responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn());
    expect(result.resultado.recomendaciones).toHaveLength(1);
    expect(mocks.generar.mock.calls[1][0].instructions).toContain("inventada");
  });
  it("separa herramientas y JSON estructurado para proveedores como Gemini", async () => {
    const resultadoHerramienta = { role: "tool", content: [{ type: "tool-result", toolCallId: "catalogo-1", toolName: "consultarCatalogo", output: { type: "json", value: { productos: [] } } }] };
    mocks.consultar.mockResolvedValueOnce({ responseMessages: [resultadoHerramienta] });
    await responderAsesor(conversacion, catalogo, new AbortController().signal, vi.fn());
    expect(mocks.configurar.mock.calls[0][0]).not.toHaveProperty("output");
    expect(mocks.generar.mock.calls[0][0]).not.toHaveProperty("tools");
    expect(mocks.generar.mock.calls[0][0].messages.at(-1)).toEqual(resultadoHerramienta);
  });
  it("avisa de las variantes retenidas mientras la cafeína no esté confirmada", async () => {
    const conCafeina = { ...catalogo[0], handle: "pack-sachets-bebida-elite-cafeina", variantes: [{ ...catalogo[0].variantes[0], id: "gid://shopify/ProductVariant/2", nutricion: FORMULAS.eliteCon }] };
    await responderAsesor(conversacion, [...catalogo, conCafeina], new AbortController().signal, vi.fn());
    const consultar = mocks.configurar.mock.calls[0][0].tools.consultarCatalogo.execute;
    const perfil = { deporte: "ciclismo", duracionMinutos: 90, sesionesSemanales: null, cafeina: "sin_confirmar" as const, restricciones: [], presupuestoCOP: null };
    const retenida = await consultar({ perfil });
    expect(retenida.productos.map((item: { handle: string }) => item.handle)).toEqual(["energy-gel-caja-x24"]);
    expect(retenida.retenidasPorCafeina.variantes).toBe(1);
    const abierta = await consultar({ perfil: { ...perfil, cafeina: "permitida" as const } });
    expect(abierta.productos).toHaveLength(2);
    expect(abierta).not.toHaveProperty("retenidasPorCafeina");
  });
  it("respeta cancelación antes de consumir modelos", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(responderAsesor(conversacion, catalogo, controller.signal, vi.fn())).rejects.toThrow();
    expect(mocks.generar).not.toHaveBeenCalled();
  });
});
