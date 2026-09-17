import { describe, expect, it } from "vitest";
import {
  atribucionDesdeTexto,
  leerAtribucion,
  parametrosUtm,
  resumenAtribucion,
  saneaAtribucion,
} from "./atribucion";

const HOY = new Date("2026-09-17T15:00:00.000Z");

describe("leerAtribucion", () => {
  it("saca los UTM de la URL de entrada y anota el día del clic", () => {
    expect(
      leerAtribucion("?utm_source=instagram&utm_medium=cpc&utm_campaign=maraton-medellin", HOY),
    ).toEqual({
      fuente: "instagram",
      medio: "cpc",
      campana: "maraton-medellin",
      fecha: "2026-09-17",
    });
  });

  it("normaliza a minúsculas para no partir una campaña en dos", () => {
    expect(leerAtribucion("?utm_source=Instagram", HOY)?.fuente).toBe("instagram");
  });

  it("conserva las tildes: el valor termina a la vista en el admin", () => {
    expect(leerAtribucion("?utm_campaign=maratón-medellín", HOY)?.campana).toBe("maratón-medellín");
  });

  it("no deja pasar marcado: el UTM lo escribe cualquiera que arme un enlace", () => {
    const campana = leerAtribucion('?utm_campaign=<img src=x onerror="hack">', HOY)?.campana;
    expect(campana).not.toMatch(/[<>"'=]/);
  });

  it("aplana los separadores de los nombres de campaña de Meta", () => {
    const campana = leerAtribucion("?utm_campaign=Conversiones+%7C+Geles+%7C+Sep", HOY)?.campana;
    expect(campana).toBe("conversiones geles sep");
  });

  it("recorta los valores larguísimos a algo que quepa en el pedido", () => {
    expect(leerAtribucion(`?utm_campaign=${"a".repeat(200)}`, HOY)?.campana).toHaveLength(64);
  });

  it("reconoce el canal por el identificador de clic cuando no hay UTM", () => {
    expect(leerAtribucion("?gclid=EAIaIQ", HOY)).toEqual({ clic: "google-ads", fecha: "2026-09-17" });
    expect(leerAtribucion("?fbclid=IwAR", HOY)?.clic).toBe("meta");
  });

  it("le cree antes a Google que a Meta: gclid sí prueba pauta, fbclid no", () => {
    expect(leerAtribucion("?fbclid=IwAR&gclid=EAIaIQ", HOY)?.clic).toBe("google-ads");
  });

  it("no inventa atribución cuando la URL no trae nada", () => {
    expect(leerAtribucion("", HOY)).toBeNull();
    expect(leerAtribucion("?pagina=2", HOY)).toBeNull();
    expect(leerAtribucion("?utm_source=", HOY)).toBeNull();
  });
});

describe("saneaAtribucion", () => {
  it("acepta lo que el navegador manda al checkout", () => {
    expect(saneaAtribucion({ fuente: "meta", medio: "paid", fecha: "2026-09-10" }, HOY)).toEqual({
      fuente: "meta",
      medio: "paid",
      fecha: "2026-09-10",
    });
  });

  it("rechaza un canal de clic que este módulo no emite", () => {
    expect(saneaAtribucion({ clic: "lo-que-sea" }, HOY)).toBeNull();
    expect(saneaAtribucion({ clic: "meta" }, HOY)?.clic).toBe("meta");
  });

  it("ignora una fecha con formato ajeno y pone la de hoy", () => {
    expect(saneaAtribucion({ fuente: "google", fecha: "ayer" }, HOY)?.fecha).toBe("2026-09-17");
  });

  it("no se traga cualquier cosa que llegue en el cuerpo", () => {
    expect(saneaAtribucion("instagram", HOY)).toBeNull();
    expect(saneaAtribucion(null, HOY)).toBeNull();
    expect(saneaAtribucion({ fuente: 42 }, HOY)).toBeNull();
  });
});

describe("resumenAtribucion", () => {
  it("arma la línea que se lee en el pedido", () => {
    expect(
      resumenAtribucion({ fuente: "instagram", medio: "cpc", campana: "maraton", fecha: "2026-09-17" }),
    ).toBe("instagram / cpc / maraton");
  });

  it("no deja huecos cuando la campaña viene a medias", () => {
    expect(resumenAtribucion({ fuente: "instagram", campana: "maraton", fecha: "2026-09-17" })).toBe(
      "instagram / maraton",
    );
  });

  it("marca el clic sin UTM como lo que es, no como una campaña", () => {
    expect(resumenAtribucion({ clic: "meta", fecha: "2026-09-17" })).toBe("meta / sin-utm");
  });

  it("devuelve null cuando no hay de dónde agarrarse", () => {
    expect(resumenAtribucion(null)).toBeNull();
  });
});

describe("parametrosUtm", () => {
  it("devuelve solo los que existen, listos para la URL del checkout", () => {
    expect(
      parametrosUtm({ fuente: "instagram", contenido: "carrusel-1", fecha: "2026-09-17" }),
    ).toEqual([
      ["utm_source", "instagram"],
      ["utm_content", "carrusel-1"],
    ]);
    expect(parametrosUtm(null)).toEqual([]);
  });
});

describe("atribucionDesdeTexto", () => {
  it("lee lo guardado mientras esté vigente", () => {
    const guardado = JSON.stringify({ fuente: "instagram", fecha: "2026-09-10" });
    expect(atribucionDesdeTexto(guardado, HOY)?.fuente).toBe("instagram");
  });

  it("deja caducar el clic a los 30 días para que una campaña vieja no cobre una venta de hoy", () => {
    const viejo = JSON.stringify({ fuente: "instagram", fecha: "2026-08-01" });
    expect(atribucionDesdeTexto(viejo, HOY)).toBeNull();
  });

  it("sobrevive a un localStorage corrupto o vacío", () => {
    expect(atribucionDesdeTexto("{no es json", HOY)).toBeNull();
    expect(atribucionDesdeTexto(null, HOY)).toBeNull();
    expect(atribucionDesdeTexto("", HOY)).toBeNull();
  });
});
