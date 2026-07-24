import { describe, expect, it } from "vitest";
import {
  createActimaxPlan,
  getDefaultPlanInput,
  type PlanInput,
} from "./mi-plan";

function plan(overrides: Partial<PlanInput> = {}) {
  return createActimaxPlan({
    ...getDefaultPlanInput("running", 21),
    ...overrides,
  });
}

describe("createActimaxPlan", () => {
  it("mantiene seguros los valores precargados desde la URL", () => {
    const input = getDefaultPlanInput("triatlon", 9999);

    expect(input.distanceKm).toBe(500);
    expect(input.durationMinutes).toBe(1440);
    expect(() => createActimaxPlan(input)).not.toThrow();
  });

  it("elige el pack de running más cercano por distancia", () => {
    expect(plan({ distanceKm: 10 }).packHandle).toBe("energy-pack-de-10k");
    expect(plan({ distanceKm: 15 }).packHandle).toBe("energy-pack-15k");
    expect(plan({ distanceKm: 21 }).packHandle).toBe("energy-pack-media-maraton-21k");
    expect(plan({ distanceKm: 42, durationMinutes: 240 }).packHandle).toBe(
      "energy-pack-maraton-42k",
    );
    expect(plan({ distanceKm: 42, durationMinutes: 180 }).packHandle).toBe(
      "energy-pack-42k-sub-3",
    );
  });

  it("elige packs específicos para ciclismo y triatlón", () => {
    expect(plan({ sport: "ciclismo" }).packHandle).toBe("energy-pack-gran-fondo");
    expect(plan({ sport: "triatlon" }).packHandle).toBe(
      "energy-pack-actimax-para-triatlon-media-distancia",
    );
  });

  it("no programa combustible en esfuerzos menores de 40 minutos", () => {
    const result = plan({ distanceKm: 5, durationMinutes: 39 });
    expect(result.fuelings).toBe(0);
    expect(result.during.filter((step) => step.kind === "fuel")).toHaveLength(0);
  });

  it("programa combustible desde el minuto 45 sin hacerlo en la meta", () => {
    const result = plan({ durationMinutes: 240 });
    const fuelMinutes = result.during
      .filter((step) => step.kind === "fuel")
      .map((step) => step.minute);

    expect(fuelMinutes).toEqual([45, 85, 125, 165, 205]);
    expect(fuelMinutes.every((minute) => minute <= 230)).toBe(true);
  });

  it("aumenta la hidratación orientativa con peso y calor", () => {
    const lightCool = plan({ weightKg: 55, climate: "fresco" });
    const heavyHot = plan({ weightKg: 90, climate: "calido" });

    expect(heavyHot.fluidPerHourMl).toBeGreaterThan(lightCool.fluidPerHourMl);
    expect(heavyHot.fluidPerHourMl).toBeLessThanOrEqual(750);
    expect(heavyHot.estimatedFluidMl).toBeGreaterThan(lightCool.estimatedFluidMl);
  });

  it("excluye la cafeína cuando la tolerancia es ninguna", () => {
    const result = plan({
      durationMinutes: 240,
      caffeineTolerance: "ninguna",
      preference: "mixto",
    });

    expect(result.caffeineServings).toBe(0);
    expect(
      result.during
        .filter((step) => step.kind === "fuel")
        .every((step) => step.title.includes("sin cafeína")),
    ).toBe(true);
  });

  it("reserva una sola toma con cafeína al final para tolerancia baja", () => {
    const result = plan({ durationMinutes: 240, caffeineTolerance: "baja" });
    const fuelSteps = result.during.filter((step) => step.kind === "fuel");

    expect(result.caffeineServings).toBe(1);
    expect(fuelSteps.at(-1)?.title).toContain("con cafeína");
    expect(fuelSteps.slice(0, -1).every((step) => step.title.includes("sin cafeína"))).toBe(true);
  });

  it("cambia bebida con cafeína por gel y agua cuando se pide cero cafeína", () => {
    const result = plan({
      durationMinutes: 130,
      caffeineTolerance: "ninguna",
      preference: "bebida",
    });

    expect(result.warnings[0]).toContain("Élite");
    expect(result.during.filter((step) => step.kind === "fuel")[0]?.title).toContain("gel");
  });

  it("no inventa una bebida Actimax sin cafeína", () => {
    const result = plan({
      durationMinutes: 240,
      caffeineTolerance: "baja",
      preference: "bebida",
    });
    const fuelSteps = result.during.filter((step) => step.kind === "fuel");

    expect(fuelSteps.slice(0, -1).every((step) => step.title.includes("gel sin cafeína"))).toBe(true);
    expect(fuelSteps.at(-1)?.title).toContain("Bebida deportiva con cafeína");
  });

  it("no muestra kilómetros lineales en el cronograma de triatlón", () => {
    const result = plan({ sport: "triatlon", durationMinutes: 360 });

    expect(result.during.every((step) => step.estimatedKm === undefined)).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("transiciones"))).toBe(true);
  });

  it("rechaza datos fuera de los límites del formulario", () => {
    expect(() => plan({ durationMinutes: 29 })).toThrow("30 minutos");
    expect(() => plan({ weightKg: 20 })).toThrow("peso");
    expect(() => plan({ distanceKm: 501 })).toThrow("distancia");
  });
});
