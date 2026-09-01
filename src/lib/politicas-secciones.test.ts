import { describe, expect, it } from "vitest";
import { cuerpoLegal } from "./politicas-secciones";

/* Reproduce el marcado real que devuelve Shopify: encabezados de sección como
   un <b> en mayúsculas que ocupa el párrafo entero, subtítulos numerados en
   minúscula y cifras en negrita sueltas. */
const DOCUMENTO = [
  '<p class="p1"><b>COMPRA CON CONFIANZA</b></p>',
  '<p class="p1">Condiciones aplicables a las compras en actimax.com.co.</p>',
  '<p class="p2"><br></p>',
  '<p class="p1"><b>DEVOLUCIONES, CAMBIOS, RETRACTO, GARANTÍA Y REVERSIÓN DEL PAGO</b></p>',
  '<p class="p1"><b>4. Derecho de retracto</b></p>',
  '<p class="p1">Cinco días hábiles desde la entrega.</p>',
  '<p class="p1"><b>PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES</b></p>',
  '<p class="p1">ACTIVA SPORT S.A.S. es responsable del tratamiento.</p>',
  '<p class="p1"><b>POLÍTICA DE ENVÍOS Y ENTREGAS</b></p>',
  '<p class="p1"><b>$120.000 COP</b></p>',
  '<p class="p1">Envío gratis desde ese monto.</p>',
].join("\n");

const VIEJO = "<p>No realizamos reembolsos.</p>";

describe("cuerpoLegal", () => {
  it("corta el preámbulo antes de la primera sección", () => {
    const preambulo = cuerpoLegal({ parte: "preambulo", documento: DOCUMENTO });
    expect(preambulo).toContain("COMPRA CON CONFIANZA");
    expect(preambulo).not.toContain("DEVOLUCIONES");
  });

  it("da a cada sección su cuerpo, sin el encabezado ni la sección siguiente", () => {
    const cambios = cuerpoLegal({ parte: "cambios", documento: DOCUMENTO, propio: VIEJO });
    expect(cambios).toContain("Derecho de retracto");
    expect(cambios).not.toContain("DEVOLUCIONES, CAMBIOS");
    expect(cambios).not.toContain("PRIVACIDAD");
    expect(cambios).not.toContain("reembolsos");
  });

  it("prefiere el documento consolidado sobre el texto viejo de la ranura", () => {
    const datos = cuerpoLegal({ parte: "datos", documento: DOCUMENTO, propio: VIEJO });
    expect(datos).toContain("ACTIVA SPORT");
  });

  it("llega hasta el final del documento en la última sección", () => {
    const envios = cuerpoLegal({ parte: "envios", documento: DOCUMENTO });
    expect(envios).toContain("Envío gratis desde ese monto");
  });

  it("no confunde una cifra en negrita con un encabezado de sección", () => {
    // Si "$120.000 COP" cortara, la sección de envíos perdería su último párrafo.
    expect(cuerpoLegal({ parte: "envios", documento: DOCUMENTO })).toContain("$120.000 COP");
  });

  it("cae en la ranura propia cuando el documento ya no trae las secciones", () => {
    const repartido = '<p class="p1"><b>COMPRA CON CONFIANZA</b></p><p>Solo términos.</p>';
    expect(cuerpoLegal({ parte: "cambios", documento: repartido, propio: VIEJO })).toBe(VIEJO);
    // …y entonces el documento entero es el preámbulo.
    expect(cuerpoLegal({ parte: "preambulo", documento: repartido })).toContain("Solo términos");
  });

  it("cae en la ranura propia cuando la sección quedó vacía", () => {
    const sinCuerpo = DOCUMENTO.replace(
      "<p class=\"p1\">ACTIVA SPORT S.A.S. es responsable del tratamiento.</p>",
      '<p class="p2"><br></p>',
    );
    expect(cuerpoLegal({ parte: "datos", documento: sinCuerpo, propio: VIEJO })).toBe(VIEJO);
  });

  it("no inventa contenido cuando no hay ni documento ni ranura", () => {
    expect(cuerpoLegal({ parte: "cambios" })).toBeUndefined();
    expect(cuerpoLegal({ parte: "preambulo" })).toBeUndefined();
  });
});
