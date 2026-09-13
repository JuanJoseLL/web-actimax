/* Imports relativos: vitest no resuelve el alias "@/". */
import { describe, expect, it } from "vitest";
import { TAG_SOLO_EN_KIT, esSoloEnKit } from "./taxonomia";

/**
 * Esta etiqueta es lo único que separa una unidad suelta —comprable solo
 * dentro del armador de kits— de un producto del catálogo. Un falso negativo
 * publica en la tienda un sachet suelto que nadie quiso publicar; un falso
 * positivo borra del catálogo un producto que sí se vende. Las dos caras
 * duelen, así que las dos están cubiertas.
 */
describe("esSoloEnKit", () => {
  it("reconoce la etiqueta tal cual", () => {
    expect(esSoloEnKit(["geles", TAG_SOLO_EN_KIT, "durante"])).toBe(true);
  });

  it("aguanta lo que Operaciones escriba a mano", () => {
    expect(esSoloEnKit(["Unidad"])).toBe(true);
    expect(esSoloEnKit(["  UNIDAD  "])).toBe(true);
  });

  it("no esconde el catálogo por parecerse", () => {
    expect(esSoloEnKit(["unidades"])).toBe(false);
    expect(esSoloEnKit(["unidad-suelta"])).toBe(false);
    expect(esSoloEnKit(["por unidad"])).toBe(false);
  });

  it("un producto normal nunca es unidad", () => {
    expect(esSoloEnKit(["kits", "running", "antes"])).toBe(false);
    expect(esSoloEnKit([])).toBe(false);
  });
});
