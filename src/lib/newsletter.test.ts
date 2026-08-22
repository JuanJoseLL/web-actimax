import { describe, expect, it } from "vitest";
import { MENSAJES, normalizarNacimiento, partirNombre, validarSuscripcion } from "./newsletter";

const HOY = new Date("2026-08-22T12:00:00Z");

describe("normalizarNacimiento", () => {
  it("acepta que no lo compartan: el cumpleaños es opcional", () => {
    expect(normalizarNacimiento({ dia: "", mes: "", anio: "" }, HOY)).toEqual({
      ok: true,
      iso: null,
    });
  });

  it("completa con ceros lo que se teclea de a un digito", () => {
    expect(normalizarNacimiento({ dia: "5", mes: "3", anio: "1990" }, HOY)).toEqual({
      ok: true,
      iso: "1990-03-05",
    });
  });

  it("rechaza la fecha a medias en vez de guardarla rota", () => {
    expect(normalizarNacimiento({ dia: "14", mes: "05", anio: "" }, HOY)).toEqual({
      ok: false,
      error: MENSAJES.nacimientoIncompleto,
    });
  });

  it("rechaza los dias que no existen en ese mes", () => {
    // Date los correria en silencio al 3 de marzo.
    expect(normalizarNacimiento({ dia: "31", mes: "02", anio: "1990" }, HOY).ok).toBe(false);
    expect(normalizarNacimiento({ dia: "29", mes: "02", anio: "1992" }, HOY)).toEqual({
      ok: true,
      iso: "1992-02-29",
    });
  });

  it("rechaza meses, años y textos imposibles", () => {
    expect(normalizarNacimiento({ dia: "14", mes: "13", anio: "1990" }, HOY).ok).toBe(false);
    expect(normalizarNacimiento({ dia: "14", mes: "05", anio: "90" }, HOY).ok).toBe(false);
    expect(normalizarNacimiento({ dia: "14", mes: "05", anio: "1899" }, HOY).ok).toBe(false);
    expect(normalizarNacimiento({ dia: "aa", mes: "05", anio: "1990" }, HOY).ok).toBe(false);
  });

  it("rechaza nacer en el futuro", () => {
    expect(normalizarNacimiento({ dia: "23", mes: "08", anio: "2026" }, HOY).ok).toBe(false);
    expect(normalizarNacimiento({ dia: "21", mes: "08", anio: "2026" }, HOY).ok).toBe(true);
  });
});

describe("partirNombre", () => {
  it("deja la primera palabra como nombre para el saludo del correo", () => {
    expect(partirNombre("Ana María Ruiz")).toEqual({ firstName: "Ana", lastName: "María Ruiz" });
  });

  it("no inventa apellido cuando solo escriben el nombre", () => {
    expect(partirNombre("Ana")).toEqual({ firstName: "Ana", lastName: "" });
  });
});

describe("validarSuscripcion", () => {
  const valido = {
    nombre: "  Ana   María Ruiz ",
    email: " ANA@Ejemplo.COM ",
    nacimiento: { dia: "14", mes: "5", anio: "1990" },
    acepta: true,
  };

  it("normaliza lo que llega del formulario", () => {
    expect(validarSuscripcion(valido, HOY)).toEqual({
      ok: true,
      datos: { email: "ana@ejemplo.com", nombre: "Ana María Ruiz", nacimiento: "1990-05-14" },
    });
  });

  it("exige el nombre: sin el no se sabe a quien se le escribe", () => {
    expect(validarSuscripcion({ ...valido, nombre: " " }, HOY)).toEqual({
      ok: false,
      error: MENSAJES.nombre,
    });
  });

  it("exige un correo con forma de correo", () => {
    expect(validarSuscripcion({ ...valido, email: "ana@ejemplo" }, HOY).ok).toBe(false);
    expect(validarSuscripcion({ ...valido, email: 42 }, HOY).ok).toBe(false);
  });

  it("exige la autorizacion de tratamiento de datos aunque el POST no venga del formulario", () => {
    expect(validarSuscripcion({ ...valido, acepta: false }, HOY)).toEqual({
      ok: false,
      error: MENSAJES.politica,
    });
    expect(validarSuscripcion({ ...valido, acepta: "si" }, HOY).ok).toBe(false);
    expect(validarSuscripcion({ ...valido, acepta: undefined }, HOY).ok).toBe(false);
  });

  it("sobrevive a un cuerpo sin la fecha", () => {
    expect(validarSuscripcion({ ...valido, nacimiento: undefined }, HOY)).toEqual({
      ok: true,
      datos: { email: "ana@ejemplo.com", nombre: "Ana María Ruiz", nacimiento: null },
    });
  });
});
