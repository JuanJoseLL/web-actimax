import { describe, expect, it } from "vitest";
import { scoreMatch } from "./palette-search";
import { searchKeywords } from "./search-keywords";
import type { Momento, ProductType } from "./taxonomia";

/** Simula la paleta: value = handle, keywords = [título, ...sinónimos]. */
function matches(
  search: string,
  handle: string,
  title: string,
  type: ProductType,
  momentos: Momento[],
): boolean {
  return scoreMatch(handle, search, [title, ...searchKeywords({ type, momentos })]) > 0;
}

describe("searchKeywords", () => {
  it('"proteina" encuentra la barra y las bebidas de recuperación', () => {
    expect(
      matches("proteina", "protein-bar-caja-x18", "Barra de Proteína Protein Bar", "barras", ["durante"]),
    ).toBe(true);
    expect(
      matches("proteína", "recovery-pro-tarro-400gr", "Bebida de Recuperación Recovery Pro", "bebidas", ["despues"]),
    ).toBe(true);
  });

  it('"pre entreno" y "preentreno" encuentran la bebida Pre Race', () => {
    expect(
      matches("pre entreno", "pre-race-en-tarro-400gr", "Bebida Pre Race", "bebidas", ["antes"]),
    ).toBe(true);
    expect(
      matches("preentreno", "pre-race-caja-x12", "Bebida Pre Race – Caja x 12 sobres", "bebidas", ["antes"]),
    ).toBe(true);
  });

  it('"electrolitos" e "hidratacion" encuentran la bebida de durante', () => {
    expect(
      matches("electrolitos", "bebida-deportiva-elite-tarro-500gr", "Bebida Élite", "bebidas", ["durante"]),
    ).toBe(true);
    expect(
      matches("hidratacion", "bebida-deportiva-elite-tarro-500gr", "Bebida Élite", "bebidas", ["durante"]),
    ).toBe(true);
  });

  it("no inventa proteína en productos que no la aportan", () => {
    expect(
      matches("proteina", "gel-energetico-actimax-caja-x8", "Gel Energético – Caja x 8", "geles", ["durante"]),
    ).toBe(false);
  });
});
