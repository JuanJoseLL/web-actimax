import { describe, expect, it } from "vitest";
import { normalize, scoreMatch } from "./palette-search";

/** Un producto de la paleta: value = handle, keywords[0] = nombre visible. */
function product(handle: string, title: string, ...rest: string[]) {
  return { value: handle, keywords: [title, ...rest] };
}

function rank(
  search: string,
  candidates: ReturnType<typeof product>[],
): string[] {
  return candidates
    .map((c) => ({ c, score: scoreMatch(c.value, search, c.keywords) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ c }) => c.keywords[0]);
}

describe("normalize", () => {
  it("ignora tildes y mayúsculas", () => {
    expect(normalize("Gel CAFEÍNA")).toBe("gel cafeina");
    expect(normalize("Después · Meta")).toBe("despues · meta");
  });
});

describe("scoreMatch", () => {
  it("sin búsqueda deja pasar todo", () => {
    expect(scoreMatch("gel-cafeina", "", ["Gel Cafeína"])).toBeGreaterThan(0);
    expect(scoreMatch("gel-cafeina", "   ", ["Gel Cafeína"])).toBeGreaterThan(0);
  });

  it("encuentra sin tildes y sin importar mayúsculas", () => {
    expect(scoreMatch("gel-cafeina", "cafeina", ["Gel Cafeína"])).toBeGreaterThan(0);
    expect(scoreMatch("gel-cafeina", "CAFEÍNA", ["Gel Cafeína"])).toBeGreaterThan(0);
  });

  it("exige todas las palabras, en cualquier orden", () => {
    const keywords = ["Gel Cafeína", "Geles", "Durante · En ruta"];
    expect(scoreMatch("gel-cafeina", "cafeina gel", keywords)).toBeGreaterThan(0);
    expect(scoreMatch("gel-cafeina", "gel ruta", keywords)).toBeGreaterThan(0);
    expect(scoreMatch("gel-cafeina", "gel barra", keywords)).toBe(0);
  });

  it("busca también por tipo, momento y deporte", () => {
    const kit = product(
      "energy-pack-21k",
      "Energy Pack 21K",
      "Energy Packs",
      "Durante · En ruta",
      "Running",
    );
    expect(scoreMatch(kit.value, "running", kit.keywords)).toBeGreaterThan(0);
    expect(scoreMatch(kit.value, "en ruta", kit.keywords)).toBeGreaterThan(0);
  });

  it("pone primero el nombre que empieza por lo buscado", () => {
    /* El kit menciona "gel" en sus keywords, pero quien escribe "gel"
       espera ver los geles antes que el pack que los contiene. */
    expect(
      rank("gel", [
        product("energy-pack-21k", "Energy Pack 21K", "Kits", "geles y bebidas"),
        product("gel-cafeina", "Gel Cafeína", "Geles"),
      ]),
    ).toEqual(["Gel Cafeína", "Energy Pack 21K"]);
  });

  it("prefiere el comienzo de palabra sobre el pedazo suelto", () => {
    expect(
      rank("pack", [
        product("multipack-x12", "Multipack x12", "Kits"),
        product("energy-pack-21k", "Energy Pack 21K", "Kits"),
      ]),
    ).toEqual(["Energy Pack 21K", "Multipack x12"]);
  });

  it("no ordena por el handle, que el usuario no ve", () => {
    /* Los dos coinciden, pero uno solo lo hace por su handle: abajo va. */
    expect(
      rank("cafeina", [
        product("cafeina-gel-24", "Energía en gel", "Geles"),
        product("gel-24", "Cafeína pura", "Geles"),
      ]),
    ).toEqual(["Cafeína pura", "Energía en gel"]);
  });

  it("ya no interpreta el prefijo de cantidad como búsqueda", () => {
    /* "3x gel" era un atajo de cantidad; ahora es texto y no debe
       encontrar nada, para que nadie lo siga escribiendo a ciegas. */
    expect(scoreMatch("gel-cafeina", "3x gel", ["Gel Cafeína"])).toBe(0);
  });

  it("descarta lo que no coincide", () => {
    expect(scoreMatch("gel-cafeina", "bicicleta", ["Gel Cafeína"])).toBe(0);
  });
});
