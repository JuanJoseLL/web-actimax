import { describe, expect, it } from "vitest";
import {
  PROMO_DESTACADA,
  diasRestantes,
  hoyEnColombia,
  promoVigente,
  type PromoDestacada,
} from "./promo";

const promo: PromoDestacada = {
  handle: "combo-de-bebida-elite",
  kicker: "Promo",
  titulo: "Título",
  texto: "Texto",
  cta: "Ver",
  hasta: "2026-09-30",
  hastaLabel: "Hasta el 30 de septiembre",
};

describe("hoyEnColombia", () => {
  it("usa el día colombiano, no el del servidor en UTC", () => {
    // 1 de octubre a las 02:00 UTC siguen siendo las 21:00 del 30 en Bogotá.
    expect(hoyEnColombia(new Date("2026-10-01T02:00:00Z"))).toBe("2026-09-30");
    expect(hoyEnColombia(new Date("2026-10-01T06:00:00Z"))).toBe("2026-10-01");
  });
});

describe("promoVigente", () => {
  it("el último día cuenta entero", () => {
    expect(promoVigente(promo, new Date("2026-10-01T02:00:00Z"))).toBe(true);
  });

  it("se apaga al día siguiente", () => {
    expect(promoVigente(promo, new Date("2026-10-01T06:00:00Z"))).toBe(false);
  });

  it("sin promo configurada no hay banda", () => {
    expect(promoVigente(null, new Date("2026-09-21T15:00:00Z"))).toBe(false);
  });
});

describe("diasRestantes", () => {
  it("cuenta hoy: el último día es 1", () => {
    expect(diasRestantes(promo, new Date("2026-09-30T15:00:00Z"))).toBe(1);
    expect(diasRestantes(promo, new Date("2026-09-21T15:00:00Z"))).toBe(10);
  });

  it("vencida no muestra urgencia", () => {
    expect(diasRestantes(promo, new Date("2026-10-02T15:00:00Z"))).toBe(0);
  });
});

describe("PROMO_DESTACADA", () => {
  it("si hay promo, la fecha de fin es una fecha ISO", () => {
    if (PROMO_DESTACADA === null) return;
    expect(PROMO_DESTACADA.hasta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
