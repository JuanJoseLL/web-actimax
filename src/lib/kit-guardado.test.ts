/* Imports relativos: vitest no resuelve el alias "@/". */
import { describe, expect, it } from "vitest";
import type { UnidadKit } from "./arma-kit";
import { kitGuardado, saboresDeSeleccion, seleccionGuardadaValida } from "./kit-guardado";

const GEL: UnidadKit = {
  handle: "unidad-gel-energetico-30g",
  title: "Gel Energético 30 g — unidad",
  etiqueta: "Gel",
  momento: "durante",
  price: 9000,
  nombreOpcion: "Sabores",
  sabores: [
    { variantId: "gid://v/1", nombre: "Fresa-Banano (sin cafeína)", image: null, inStock: true },
    { variantId: "gid://v/2", nombre: "Mango con cafeína", image: null, inStock: true },
    { variantId: "gid://v/3", nombre: "Manzana con cafeína", image: null, inStock: false },
  ],
};

const BARRA: UnidadKit = {
  handle: "unidad-protein-bar",
  title: "Protein Bar — unidad",
  etiqueta: "Barra",
  momento: "despues",
  price: 15000,
  nombreOpcion: "Title",
  sabores: [{ variantId: "gid://v/9", nombre: null, image: null, inStock: true }],
};

const UNIDADES = [GEL, BARRA];

/**
 * Lo que vuelve de localStorage es entrada no confiable: puede venir de una
 * versión vieja de la página, de otro navegador, o editada a mano. Ninguna de
 * esas formas puede tumbar el armador ni meter en el kit algo que no se pueda
 * comprar.
 */
describe("seleccionGuardadaValida", () => {
  it("conserva lo que todavía se puede comprar", () => {
    expect(seleccionGuardadaValida({ "gid://v/1": 3, "gid://v/9": 2 }, UNIDADES)).toEqual({
      "gid://v/1": 3,
      "gid://v/9": 2,
    });
  });

  it("descarta variantes que ya no están en el catálogo", () => {
    expect(seleccionGuardadaValida({ "gid://v/1": 2, "gid://v/404": 5 }, UNIDADES)).toEqual({
      "gid://v/1": 2,
    });
  });

  it("descarta lo agotado en vez de restaurar algo impagable", () => {
    expect(seleccionGuardadaValida({ "gid://v/3": 4 }, UNIDADES)).toEqual({});
  });

  it("descarta cantidades que no son enteros positivos", () => {
    const guardado = {
      "gid://v/1": 0,
      "gid://v/2": -3,
      "gid://v/9": 1.5,
    };
    expect(seleccionGuardadaValida(guardado, UNIDADES)).toEqual({});
  });

  it("recorta una cantidad absurda en vez de dibujarla", () => {
    expect(seleccionGuardadaValida({ "gid://v/1": 9999 }, UNIDADES)).toEqual({
      "gid://v/1": 99,
    });
  });

  it("arranca en limpio ante cualquier cosa que no sea un objeto", () => {
    for (const basura of [null, undefined, 7, "kit", [1, 2], true]) {
      expect(seleccionGuardadaValida(basura, UNIDADES)).toEqual({});
    }
  });

  it("sin unidades comprables no restaura nada", () => {
    const agotado: UnidadKit = {
      ...GEL,
      sabores: GEL.sabores.map((sabor) => ({ ...sabor, inStock: false })),
    };
    expect(seleccionGuardadaValida({ "gid://v/1": 2 }, [agotado])).toEqual({});
  });
});

describe("saboresDeSeleccion", () => {
  it("deja elegido el sabor que el kit realmente lleva", () => {
    expect(saboresDeSeleccion({ "gid://v/2": 3 }, UNIDADES)).toEqual({
      "unidad-gel-energetico-30g": "gid://v/2",
    });
  });

  it("no opina sobre las unidades que el kit no lleva", () => {
    expect(saboresDeSeleccion({ "gid://v/9": 1 }, UNIDADES)).toEqual({
      "unidad-protein-bar": "gid://v/9",
    });
  });

  it("con el kit vacío no fuerza ningún sabor", () => {
    expect(saboresDeSeleccion({}, UNIDADES)).toEqual({});
  });
});

describe("kitGuardado", () => {
  it("lee lo que dejó la visita anterior", () => {
    expect(kitGuardado('{"gid://v/2":4}', UNIDADES)).toEqual({ "gid://v/2": 4 });
  });

  it("arranca en limpio si lo guardado no es JSON", () => {
    expect(kitGuardado("{roto", UNIDADES)).toEqual({});
    expect(kitGuardado("", UNIDADES)).toEqual({});
  });
});
