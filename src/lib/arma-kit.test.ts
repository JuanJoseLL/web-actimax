import { describe, expect, it } from "vitest";
import {
  MINIMO_UNIDADES,
  faltaParaEnvioGratis,
  faltanParaMinimo,
  resumenKit,
  subtotalKit,
  tituloUnidad,
  totalUnidades,
  unidadesPorMomento,
  type SeleccionKit,
  type UnidadKit,
} from "./arma-kit";
import type { Momento } from "./taxonomia";

function unidad(
  handle: string,
  momento: Momento,
  price: number,
  sabores: string[],
): UnidadKit {
  return {
    handle,
    title: handle,
    etiqueta: handle,
    momento,
    price,
    nombreOpcion: "Sabores",
    sabores: sabores.map((nombre) => ({
      variantId: `${handle}#${nombre}`,
      nombre,
      image: null,
      inStock: false,
    })),
  };
}

/** Un atajo para no repetir el handle completo al armar cada selección. */
function variante(handle: string, sabor: string): string {
  return `${handle}#${sabor}`;
}

/* Las siete unidades reales con sus precios de septiembre de 2026: es sobre
   este catálogo donde las cuentas significan algo. El sachet de Élite a
   $7.000 es la unidad más barata que existe, así que marca el piso de lo que
   puede costar un kit válido. */
const CATALOGO: UnidadKit[] = [
  unidad("unidad-sobre-pre-race", "antes", 12_000, [
    "Fresa Natural",
    "Vainilla Italiana",
    "Caramelo Inglés",
  ]),
  unidad("unidad-gel-energetico-30g", "durante", 9_000, [
    "Fresa-Banano (sin cafeína)",
    "Fresa con cafeína",
  ]),
  unidad("unidad-gel-energetico-90g", "durante", 15_000, ["Mango con cafeína"]),
  unidad("unidad-sachet-bebida-elite-cafeina", "durante", 7_000, ["Naranja", "Limón"]),
  unidad("unidad-sobre-recovery-pro", "despues", 15_000, ["Vainilla Italiana", "Fresa"]),
  unidad("unidad-protein-bar", "despues", 15_000, ["Default Title"]),
];

/** El kit más barato que se puede pagar: seis sachets de Élite, $42.000. */
const KIT_MINIMO: SeleccionKit = {
  [variante("unidad-sachet-bebida-elite-cafeina", "Naranja")]: 6,
};

describe("tituloUnidad", () => {
  it("quita el sufijo con el que Operaciones las distingue en el admin", () => {
    expect(tituloUnidad("Gel Energético 30 g — unidad")).toBe("Gel Energético 30\u00A0g");
    expect(tituloUnidad("Sachet Bebida Élite con cafeína 30 g — unidad")).toBe(
      "Sachet Bebida Élite con cafeína 30\u00A0g",
    );
    expect(tituloUnidad("Protein Bar - unidad")).toBe("Protein Bar");
  });

  it("no separa el gramaje de su número al final del renglón", () => {
    expect(tituloUnidad("Sobre Recovery Pro 37 g")).toBe("Sobre Recovery Pro 37\u00A0g");
    expect(tituloUnidad("Bebida Élite 500 ml")).toBe("Bebida Élite 500\u00A0ml");
  });

  it("no toca un nombre que no lleva ni sufijo ni gramaje", () => {
    expect(tituloUnidad("Energy Pack 21K")).toBe("Energy Pack 21K");
  });

  it("solo recorta el final, no un guion en medio del nombre", () => {
    /* "Fresa-Banano" vive dentro del nombre; recortar por cualquier guion lo
       partiría. */
    expect(tituloUnidad("Gel Fresa-Banano 90 g")).toBe("Gel Fresa-Banano 90\u00A0g");
  });
});

describe("totalUnidades", () => {
  it("no cuenta nada en una selección vacía", () => {
    expect(totalUnidades({})).toBe(0);
  });

  it("suma las cantidades de todas las variantes", () => {
    expect(
      totalUnidades({
        [variante("unidad-sobre-pre-race", "Fresa Natural")]: 1,
        [variante("unidad-gel-energetico-30g", "Fresa con cafeína")]: 4,
        [variante("unidad-protein-bar", "Default Title")]: 2,
      }),
    ).toBe(7);
  });

  it("ignora las variantes que quedaron en cero al bajar el contador", () => {
    expect(
      totalUnidades({
        [variante("unidad-gel-energetico-30g", "Fresa con cafeína")]: 3,
        [variante("unidad-gel-energetico-30g", "Fresa-Banano (sin cafeína)")]: 0,
      }),
    ).toBe(3);
  });
});

describe("subtotalKit", () => {
  it("cobra cada variante al precio de su unidad", () => {
    /* Dos geles de 30 g ($9.000) y una barra ($15.000). */
    expect(
      subtotalKit(
        {
          [variante("unidad-gel-energetico-30g", "Fresa con cafeína")]: 2,
          [variante("unidad-protein-bar", "Default Title")]: 1,
        },
        CATALOGO,
      ),
    ).toBe(33_000);
  });

  it("cobra igual dos sabores de la misma unidad", () => {
    expect(
      subtotalKit(
        {
          [variante("unidad-gel-energetico-30g", "Fresa con cafeína")]: 2,
          [variante("unidad-gel-energetico-30g", "Fresa-Banano (sin cafeína)")]: 2,
        },
        CATALOGO,
      ),
    ).toBe(36_000);
  });

  it("suma cero por una variante que ya no está en el catálogo", () => {
    /* El precio sale del catálogo, no del estado de la página: un sabor que
       Operaciones borre deja de cobrarse en vez de arrastrar su precio viejo. */
    expect(
      subtotalKit(
        {
          [variante("unidad-gel-energetico-30g", "Sabor descatalogado")]: 5,
          [variante("unidad-protein-bar", "Default Title")]: 1,
        },
        CATALOGO,
      ),
    ).toBe(15_000);
  });

  it("no cobra nada por una selección vacía", () => {
    expect(subtotalKit({}, CATALOGO)).toBe(0);
  });
});

describe("faltanParaMinimo", () => {
  it("pide las seis unidades completas cuando no hay nada elegido", () => {
    expect(faltanParaMinimo({})).toBe(MINIMO_UNIDADES);
  });

  it("descuenta lo que ya lleva el kit", () => {
    expect(
      faltanParaMinimo({ [variante("unidad-protein-bar", "Default Title")]: 4 }),
    ).toBe(2);
  });

  it("deja de pedir unidades al llegar al mínimo", () => {
    expect(faltanParaMinimo(KIT_MINIMO)).toBe(0);
    expect(
      faltanParaMinimo({ [variante("unidad-protein-bar", "Default Title")]: 12 }),
    ).toBe(0);
  });
});

describe("faltaParaEnvioGratis", () => {
  it("pide el umbral entero cuando el carrito está en cero", () => {
    expect(faltaParaEnvioGratis(0)).toBe(120_000);
  });

  it("da por cumplido el envío gratis justo en el umbral", () => {
    expect(faltaParaEnvioGratis(120_000)).toBe(0);
    expect(faltaParaEnvioGratis(180_000)).toBe(0);
  });

  it("el kit mínimo más barato todavía queda lejos del envío gratis", () => {
    /* Seis sachets de $7.000 son $42.000: el mínimo de unidades y el envío
       gratis son dos metas distintas y la página tiene que mostrar las dos. */
    const subtotal = subtotalKit(KIT_MINIMO, CATALOGO);
    expect(subtotal).toBe(42_000);
    expect(faltanParaMinimo(KIT_MINIMO)).toBe(0);
    expect(faltaParaEnvioGratis(subtotal)).toBe(78_000);
  });
});

describe("unidadesPorMomento", () => {
  it("ordena los grupos como se corre la carrera, no como llega el catálogo", () => {
    const revuelto = [CATALOGO[5], CATALOGO[2], CATALOGO[0]];

    expect(unidadesPorMomento(revuelto).map((grupo) => grupo.momento)).toEqual([
      "antes",
      "durante",
      "despues",
    ]);
  });

  it("reparte cada unidad en su momento", () => {
    const grupos = unidadesPorMomento(CATALOGO);

    expect(grupos.map((grupo) => grupo.unidades.length)).toEqual([1, 3, 2]);
    expect(grupos[1].unidades.map((u) => u.handle)).toEqual([
      "unidad-gel-energetico-30g",
      "unidad-gel-energetico-90g",
      "unidad-sachet-bebida-elite-cafeina",
    ]);
  });

  it("no deja secciones vacías en la página", () => {
    const soloDurante = unidadesPorMomento([CATALOGO[2]]);

    expect(soloDurante).toHaveLength(1);
    expect(soloDurante[0].momento).toBe("durante");
    expect(unidadesPorMomento([])).toEqual([]);
  });
});

describe("resumenKit", () => {
  it("nombra los momentos en orden de carrera aunque se elijan al revés", () => {
    const seleccion: SeleccionKit = {
      [variante("unidad-protein-bar", "Default Title")]: 1,
      [variante("unidad-sobre-pre-race", "Fresa Natural")]: 2,
      [variante("unidad-gel-energetico-30g", "Fresa con cafeína")]: 4,
    };

    expect(resumenKit(seleccion, CATALOGO)).toBe("7 unidades · antes, durante, después");
  });

  it("solo nombra los momentos que el kit cubre de verdad", () => {
    expect(
      resumenKit(
        { [variante("unidad-gel-energetico-90g", "Mango con cafeína")]: 6 },
        CATALOGO,
      ),
    ).toBe("6 unidades · durante");
  });

  it("no cuenta un momento cuyo sabor quedó en cero", () => {
    expect(
      resumenKit(
        {
          [variante("unidad-gel-energetico-90g", "Mango con cafeína")]: 6,
          [variante("unidad-protein-bar", "Default Title")]: 0,
        },
        CATALOGO,
      ),
    ).toBe("6 unidades · durante");
  });

  it("concuerda el singular con una sola unidad", () => {
    expect(
      resumenKit({ [variante("unidad-protein-bar", "Default Title")]: 1 }, CATALOGO),
    ).toBe("1 unidad · después");
  });

  it("se queda solo con el conteo cuando no hay nada elegido", () => {
    expect(resumenKit({}, CATALOGO)).toBe("0 unidades");
  });
});
