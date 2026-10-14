import { describe, expect, it } from "vitest";
import { calculateBikeSize, calculateBmi, calculateCalories, calculateGelCount } from "./blog-calculators";

describe("calculadoras migradas del blog", () => {
  it("calcula el IMC y clasifica los límites sin redondearlos primero", () => {
    expect(calculateBmi(70, 175).bmi).toBeCloseTo(22.857);
    expect(calculateBmi(74, 200).category).toBe("Peso normal");
    expect(calculateBmi(100, 200).category).toBe("Sobrepeso");
    expect(calculateBmi(120, 200).category).toBe("Obesidad");
  });

  it("reproduce el ejemplo Harris-Benedict del artículo y ajusta el objetivo", () => {
    const input = { weightKg: 65, heightCm: 165, age: 30, sex: "female" as const, activity: 1.55, goal: "maintain" as const };
    // El texto antiguo tiene un error aritmético: 655 + 624 + 297 - 141 = 1435.
    expect(calculateCalories(input).basal).toBe(1435);
    expect(calculateCalories(input).maintenance).toBeCloseTo(2224.25);
    expect(calculateCalories({ ...input, goal: "lose" }).target).toBeCloseTo(1890.6125);
    expect(calculateCalories({ ...input, goal: "gain" }).target).toBeCloseTo(2557.8875);
    expect(calculateCalories({ ...input, sex: "male" }).basal).toBeCloseTo(1577.5);
  });

  it("reproduce las tallas para una entrepierna de 84 cm", () => {
    expect(calculateBikeSize(84, "road").size).toBeCloseTo(55.86);
    expect(calculateBikeSize(84, "mountain")).toEqual({ size: 18.984, unit: "pulgadas" });
  });

  it("no recomienda tomar un gel después de terminar una actividad corta", () => {
    expect(calculateGelCount(40)).toBe(0);
    expect(calculateGelCount(60)).toBe(1);
    expect(calculateGelCount(120)).toBe(2);
    expect(calculateGelCount(240)).toBe(5);
  });

  it("rechaza datos vacíos, negativos, no finitos y edades no adultas", () => {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(() => calculateBmi(value, 175)).toThrow();
      expect(() => calculateBmi(70, value)).toThrow();
      expect(() => calculateBikeSize(value, "road")).toThrow();
      expect(() => calculateGelCount(value)).toThrow();
    }
    expect(() => calculateCalories({ weightKg: 65, heightCm: 165, age: 15, sex: "female", activity: 1.55, goal: "maintain" })).toThrow();
  });
});
