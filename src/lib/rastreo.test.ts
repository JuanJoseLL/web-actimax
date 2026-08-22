import { describe, expect, it } from "vitest";
import {
  guiaLegible,
  normalizarGuia,
  rutaRastreo,
  transportadoraPorEmpresa,
  transportadoraPorSlug,
} from "./rastreo";

describe("normalizarGuia", () => {
  it("quita la basura con la que llegan los numeros tecleados a mano", () => {
    // El pedido #1002 quedo guardado en Shopify con un punto al final.
    expect(normalizarGuia("91540504865.")).toBe("91540504865");
    expect(normalizarGuia(" 034 058 245 387 ")).toBe("034058245387");
    expect(normalizarGuia("034-058-245-387")).toBe("034058245387");
  });

  it("no revienta cuando falta la guia", () => {
    expect(normalizarGuia(null)).toBe("");
    expect(normalizarGuia(undefined)).toBe("");
    expect(normalizarGuia("")).toBe("");
  });
});

describe("guiaLegible", () => {
  it("agrupa de a 3 los 12 digitos de Envia", () => {
    expect(guiaLegible("034058245387")).toBe("034 058 245 387");
  });

  it("agrupa de a 4 cuando no cuadra en grupos de 3", () => {
    expect(guiaLegible("91540504895")).toBe("9154 0504 895");
  });

  it("deja intactas las guias muy cortas", () => {
    expect(guiaLegible("123")).toBe("123");
  });
});

describe("transportadoraPorEmpresa", () => {
  it("reconoce a Envia escrita de cualquier forma", () => {
    for (const escrito of ["Envía", "envia", "ENVIA COLVANES", "Colvanes", "envía (colvanes)"]) {
      expect(transportadoraPorEmpresa(escrito)?.slug).toBe("envia");
    }
  });

  it("reconoce a Coordinadora", () => {
    expect(transportadoraPorEmpresa("Coordinadora")?.slug).toBe("coordinadora");
  });

  it("no adivina cuando en el panel dejaron 'Otra' a secas", () => {
    // Es el caso del pedido #1004: Shopify no guarda cual transportadora es,
    // asi que la pagina tiene que preguntarle al cliente.
    expect(transportadoraPorEmpresa("Otra")).toBeNull();
    expect(transportadoraPorEmpresa("Other")).toBeNull();
    expect(transportadoraPorEmpresa("")).toBeNull();
    expect(transportadoraPorEmpresa(null)).toBeNull();
  });
});

describe("transportadoraPorSlug", () => {
  it("resuelve los slugs que viajan en la URL", () => {
    expect(transportadoraPorSlug("envia")?.nombre).toBe("Envía (Colvanes)");
    expect(transportadoraPorSlug(" Coordinadora ")?.slug).toBe("coordinadora");
    expect(transportadoraPorSlug("servientrega")).toBeNull();
    expect(transportadoraPorSlug(null)).toBeNull();
  });
});

describe("rutaRastreo", () => {
  it("arma la URL con slash final para que Shopify no se coma un 308", () => {
    expect(rutaRastreo("034 058 245 387", "envia")).toBe(
      "/rastreo/?guia=034058245387&t=envia",
    );
  });

  it("omite la transportadora cuando no se sabe cual es", () => {
    expect(rutaRastreo("034058245387")).toBe("/rastreo/?guia=034058245387");
    expect(rutaRastreo("034058245387", null)).toBe("/rastreo/?guia=034058245387");
  });
});

describe("enlace directo", () => {
  it("Coordinadora apunta a la guia; Envia no tiene a donde apuntar", () => {
    const coordinadora = transportadoraPorSlug("coordinadora");
    expect(coordinadora?.enlaceGuia?.("91540504895")).toBe(
      "https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/?guia=91540504895",
    );
    expect(transportadoraPorSlug("envia")?.enlaceGuia).toBeNull();
  });
});
