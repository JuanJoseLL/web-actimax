import { describe, expect, it } from "vitest";
import { sugerenciaEnvioGratis, type UpsellProduct } from "./envio-gratis";
import type { ProductType } from "./taxonomia";

function producto(
  handle: string,
  price: number,
  type: ProductType | null = "kits",
): UpsellProduct {
  return {
    variantId: `gid://shopify/ProductVariant/${handle}`,
    handle,
    title: handle,
    type,
    price,
    image: null,
    options: [],
    variants: [],
  };
}

/* Precios reales del catálogo (ago 2026), que es donde la regla se pone a
   prueba: no hay nada por debajo de $35.000 y las bebidas arrancan en
   $81.000, así que las brechas chicas solo las cierra un pack. */
const CATALOGO: UpsellProduct[] = [
  producto("energy-pack-10k", 35_000),
  producto("energy-pack-15k", 40_000),
  producto("energy-pack-21k", 50_000),
  producto("bebida-elite-500", 81_000, "bebidas"),
  producto("energy-pack-42k-sub-3", 95_000),
  producto("pre-race-tarro", 102_000, "bebidas"),
  producto("gel-caja-x8", 110_000, "geles"),
  producto("protein-bar-x18", 215_000, "barras"),
];

describe("sugerenciaEnvioGratis", () => {
  it("propone lo más barato que cierra la brecha, no lo primero del catálogo", () => {
    expect(sugerenciaEnvioGratis(CATALOGO, ["gel-caja-x8"], 10_000)?.handle).toBe(
      "energy-pack-10k",
    );
  });

  it("prefiere otra categoría cuando cuesta casi lo mismo (pack → bebida)", () => {
    /* Carrito con un pack de $35.000: faltan $85.000. El más barato que
       cierra es otro pack de $95.000, pero la bebida de $102.000 entra en el
       margen y le sirve más a quien ya lleva pack. */
    const sugerencia = sugerenciaEnvioGratis(CATALOGO, ["energy-pack-10k"], 85_000);
    expect(sugerencia?.handle).toBe("pre-race-tarro");
  });

  it("no se va a un producto mucho más caro con tal de cambiar de categoría", () => {
    /* Faltan $45.000: el pack de $50.000 cierra y la bebida más barata
       ($81.000) queda fuera del margen. */
    expect(sugerenciaEnvioGratis(CATALOGO, ["energy-pack-15k"], 45_000)?.handle).toBe(
      "energy-pack-21k",
    );
  });

  it("nunca propone algo que ya está en el carrito", () => {
    const sugerencia = sugerenciaEnvioGratis(
      CATALOGO,
      ["energy-pack-10k", "energy-pack-15k"],
      35_000,
    );
    expect(sugerencia?.handle).toBe("energy-pack-21k");
  });

  it("descarta lo que no alcanza a cerrar la brecha", () => {
    /* Con $100.000 de brecha quedan fuera los packs de $95.000 para abajo. */
    const sugerencia = sugerenciaEnvioGratis(CATALOGO, [], 100_000);
    expect(sugerencia?.handle).toBe("pre-race-tarro");
    expect(sugerencia?.price).toBeGreaterThanOrEqual(100_000);
  });

  it("no sugiere nada cuando ningún producto solo cierra la brecha", () => {
    expect(sugerenciaEnvioGratis(CATALOGO, ["protein-bar-x18"], 300_000)).toBeUndefined();
    expect(sugerenciaEnvioGratis([], [], 40_000)).toBeUndefined();
  });

  it("no sugiere nada cuando el envío gratis ya está cumplido", () => {
    expect(sugerenciaEnvioGratis(CATALOGO, ["energy-pack-10k"], 0)).toBeUndefined();
    expect(sugerenciaEnvioGratis(CATALOGO, ["energy-pack-10k"], -5_000)).toBeUndefined();
  });

  it("un producto sin categoría no cuenta como complemento pero sí como respaldo", () => {
    const sinTipo = [producto("combo-misterio", 50_000, null)];
    expect(sugerenciaEnvioGratis(sinTipo, [], 40_000)?.handle).toBe("combo-misterio");
  });

  it("elige igual con dos precios empatados (orden estable, no el del catálogo)", () => {
    const empate = [producto("z-pack", 95_000), producto("a-pack", 95_000)];
    expect(sugerenciaEnvioGratis(empate, [], 90_000)?.handle).toBe("a-pack");
  });
});
