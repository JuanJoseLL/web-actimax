import { describe, expect, it } from "vitest";
import {
  armarSnapshot,
  faseBlackFriday,
  precioPromo,
  sincronizarPrecios,
  type Graphql,
  type ProductoSnapshot,
} from "./black-friday";

describe("faseBlackFriday", () => {
  it("empieza el lunes 23 a las 6 p. m. de Colombia, no antes", () => {
    expect(faseBlackFriday(new Date("2026-11-23T22:59:59Z"))).toBe("antes");
    expect(faseBlackFriday(new Date("2026-11-23T23:00:00Z"))).toBe("activa");
  });

  it("el domingo 29 cuenta entero y se acaba a medianoche", () => {
    // 11:59 p. m. del domingo en Bogotá ya es lunes en UTC.
    expect(faseBlackFriday(new Date("2026-11-30T04:59:59Z"))).toBe("activa");
    expect(faseBlackFriday(new Date("2026-11-30T05:00:00Z"))).toBe("revertir");
  });

  it("pasados tres días ya no devuelve precios: el cron del año siguiente no hace nada", () => {
    expect(faseBlackFriday(new Date("2026-12-03T05:00:00Z"))).toBe("fuera");
    expect(faseBlackFriday(new Date("2027-11-23T23:00:00Z"))).toBe("fuera");
  });
});

describe("armarSnapshot", () => {
  const [producto] = armarSnapshot(
    [
      {
        id: "p1",
        handle: "pack",
        title: "Pack",
        variants: [
          { id: "v1", title: "Normal", price: "81000.00", compareAtPrice: null },
          { id: "v2", title: "Ya en oferta", price: "70000.00", compareAtPrice: "83000.00" },
        ],
      },
    ],
    20,
  );

  it("sin oferta previa, el tachado es el precio de hoy", () => {
    expect(producto.variants[0].promo).toEqual({ price: 64800, compareAt: 81000 });
    expect(producto.variants[0].antes).toEqual({ price: 81000, compareAt: null });
  });

  it("con oferta previa, el 20% sale del precio de venta y conserva el tachado", () => {
    expect(producto.variants[1].promo).toEqual({ price: 56000, compareAt: 83000 });
    expect(producto.variants[1].antes).toEqual({ price: 70000, compareAt: 83000 });
  });

  it("redondea a pesos enteros", () => {
    expect(precioPromo(9999, 20)).toBe(7999);
  });
});

describe("sincronizarPrecios", () => {
  const snapshot: ProductoSnapshot[] = [
    {
      id: "p1",
      handle: "bebida",
      title: "Bebida",
      variants: [
        {
          id: "v1",
          title: "Limón",
          antes: { price: 81000, compareAt: null },
          promo: { price: 64800, compareAt: 81000 },
        },
        {
          id: "v2",
          title: "Uva",
          antes: { price: 81000, compareAt: null },
          promo: { price: 64800, compareAt: 81000 },
        },
      ],
    },
  ];

  function tienda(precios: Record<string, string>) {
    const mutaciones: Array<Record<string, unknown>> = [];
    const graphql = (async (query: string, variables: Record<string, unknown> = {}) => {
      if (query.includes("PreciosActuales")) {
        return {
          nodes: [
            {
              id: "p1",
              variants: { nodes: Object.entries(precios).map(([id, price]) => ({ id, price })) },
            },
          ],
        };
      }
      mutaciones.push(variables);
      return { productVariantsBulkUpdate: { userErrors: [] } };
    }) as Graphql;
    return { graphql, mutaciones };
  }

  it("aplica el precio de promo con su tachado", async () => {
    const { graphql, mutaciones } = tienda({ v1: "81000.00", v2: "81000.00" });
    const resultado = await sincronizarPrecios(graphql, snapshot, "aplicar");
    expect(resultado).toMatchObject({ cambiadas: 2, yaEstaban: 0, omitidas: 0 });
    expect(mutaciones).toEqual([
      {
        productId: "p1",
        variants: [
          { id: "v1", price: "64800", compareAtPrice: "81000" },
          { id: "v2", price: "64800", compareAtPrice: "81000" },
        ],
      },
    ]);
  });

  it("correrlo dos veces no cambia nada", async () => {
    const { graphql, mutaciones } = tienda({ v1: "64800.00", v2: "64800.00" });
    const resultado = await sincronizarPrecios(graphql, snapshot, "aplicar");
    expect(resultado).toMatchObject({ cambiadas: 0, yaEstaban: 2, omitidas: 0 });
    expect(mutaciones).toEqual([]);
  });

  it("al revertir quita el tachado y no pisa un precio cambiado a mano", async () => {
    const { graphql, mutaciones } = tienda({ v1: "64800.00", v2: "70000.00" });
    const resultado = await sincronizarPrecios(graphql, snapshot, "revertir");
    expect(resultado).toMatchObject({ cambiadas: 1, omitidas: 1 });
    expect(resultado.avisos[0]).toContain("bebida (Uva)");
    expect(mutaciones).toEqual([
      { productId: "p1", variants: [{ id: "v1", price: "81000", compareAtPrice: null }] },
    ]);
  });
});
