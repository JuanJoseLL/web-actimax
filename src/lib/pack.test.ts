import { describe, expect, it } from "vitest";
import { contenidoDelPack, parseContenido, parseGuiaUso } from "./pack";

describe("parseContenido", () => {
  it("lee la lista JSON que entrega la Storefront API", () => {
    expect(parseContenido('["1 Sobre de Pre Race", "4 Energy Gel"]')).toEqual([
      "1 Sobre de Pre Race",
      "4 Energy Gel",
    ]);
  });

  it("descarta entradas vacías o que no son texto y normaliza espacios", () => {
    expect(parseContenido('["  1 Sobre ", "", 3, null, "2 Geles\\n de 30 g"]')).toEqual([
      "1 Sobre",
      "2 Geles de 30 g",
    ]);
  });

  it("devuelve vacío ante null, JSON inválido o algo que no es lista", () => {
    expect(parseContenido(null)).toEqual([]);
    expect(parseContenido(undefined)).toEqual([]);
    expect(parseContenido("no es json")).toEqual([]);
    expect(parseContenido('{"a":1}')).toEqual([]);
    expect(parseContenido("")).toEqual([]);
  });
});

describe("parseGuiaUso", () => {
  it("lee los pasos con sus campos opcionales", () => {
    const pasos = parseGuiaUso(
      JSON.stringify([
        { cuando: "Desayuno", que: "1 sobre de Pre Race", momento: "antes" },
        { cuando: "Km 7", que: "Gel de fruta", nota: "Con un sorbo de agua", momento: "durante" },
        { cuando: "Meta +30 min", que: "1 sobre de Recovery Pro", momento: "despues" },
      ]),
    );
    expect(pasos).toEqual([
      { cuando: "Desayuno", que: "1 sobre de Pre Race", momento: "antes" },
      { cuando: "Km 7", que: "Gel de fruta", nota: "Con un sorbo de agua", momento: "durante" },
      { cuando: "Meta +30 min", que: "1 sobre de Recovery Pro", momento: "despues" },
    ]);
  });

  it("descarta pasos incompletos y momentos fuera del vocabulario sin tumbar el resto", () => {
    const pasos = parseGuiaUso(
      JSON.stringify([
        { cuando: "Km 7" },
        { que: "Gel" },
        { cuando: "Km 14", que: "Gel con cafeína", momento: "mitad" },
        "texto suelto",
        null,
      ]),
    );
    expect(pasos).toEqual([{ cuando: "Km 14", que: "Gel con cafeína" }]);
  });

  it("acota la cantidad de pasos y el largo de cada campo", () => {
    const muchos = Array.from({ length: 20 }, (_, i) => ({ cuando: `Km ${i}`, que: "Gel" }));
    expect(parseGuiaUso(JSON.stringify(muchos))).toHaveLength(12);
    expect(
      parseGuiaUso(JSON.stringify([{ cuando: "x".repeat(25), que: "Gel" }])),
    ).toEqual([]);
  });

  it("devuelve vacío ante null, JSON inválido o un objeto suelto", () => {
    expect(parseGuiaUso(null)).toEqual([]);
    expect(parseGuiaUso("{")).toEqual([]);
    expect(parseGuiaUso('{"cuando":"Km 7","que":"Gel"}')).toEqual([]);
  });
});

describe("contenidoDelPack", () => {
  const descripcion =
    "<p>El pack incluye:</p><ul><li>1 Sobre de Pre Race</li><li>2 Energy Gel</li></ul>";

  it("prefiere el metafield cuando está cargado", () => {
    expect(contenidoDelPack('["6 Energy Gel"]', descripcion)).toEqual(["6 Energy Gel"]);
  });

  it("cae a la lista de la descripción cuando el metafield falta o viene vacío", () => {
    expect(contenidoDelPack(null, descripcion)).toEqual(["1 Sobre de Pre Race", "2 Energy Gel"]);
    expect(contenidoDelPack("[]", descripcion)).toEqual(["1 Sobre de Pre Race", "2 Energy Gel"]);
  });

  it("entiende las viñetas '•' en párrafos planos (Energy Pack 10K)", () => {
    const plano =
      "<p>El Energy Pack 10K incluye:</p><p>• 1 Sobre de Pre Race<br> • 1 Energy Gel (recomendado para el kilómetro 5)<br> • 1 Sobre de Recovery Pro</p><p>*Pack con unidades limitadas, disponible hasta agotar existencia.</p>";
    expect(contenidoDelPack(null, plano)).toEqual([
      "1 Sobre de Pre Race",
      "1 Energy Gel (recomendado para el kilómetro 5)",
      "1 Sobre de Recovery Pro",
    ]);
  });
});
