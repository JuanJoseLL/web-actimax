export const BLOG_CALCULATORS = {
  "calculadora-de-calorias": "calories",
  "calcular-imc-indice-de-masa-corporal": "bmi",
  "talla-de-bicicleta-adecuada": "bike",
} as const;

export type BlogCalculatorKind = (typeof BLOG_CALCULATORS)[keyof typeof BLOG_CALCULATORS];

export function blogCalculatorKind(slug: string): BlogCalculatorKind | undefined {
  return Object.hasOwn(BLOG_CALCULATORS, slug)
    ? BLOG_CALCULATORS[slug as keyof typeof BLOG_CALCULATORS]
    : undefined;
}

function positive(...values: number[]) {
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error("Ingresa medidas válidas, mayores que cero.");
  }
}

export function calculateBmi(weightKg: number, heightCm: number) {
  positive(weightKg, heightCm);
  const bmi = weightKg / (heightCm / 100) ** 2;
  const category = bmi < 18.5 ? "Bajo peso" : bmi < 25 ? "Peso normal" : bmi < 30 ? "Sobrepeso" : "Obesidad";
  return { bmi, category };
}

export function calculateCalories(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: "female" | "male";
  activity: number;
  goal: "maintain" | "lose" | "gain";
}) {
  positive(input.weightKg, input.heightCm, input.age);
  if (input.age < 18 || ![1.2, 1.375, 1.55, 1.725, 1.9].includes(input.activity)) {
    throw new Error("Selecciona una actividad válida e ingresa una edad de al menos 18 años.");
  }
  // Harris-Benedict, con los coeficientes publicados en el artículo.
  const basal = input.sex === "female"
    ? 655 + 9.6 * input.weightKg + 1.8 * input.heightCm - 4.7 * input.age
    : 66 + 13.7 * input.weightKg + 5 * input.heightCm - 6.8 * input.age;
  positive(basal);
  const maintenance = basal * input.activity;
  const target = maintenance * (input.goal === "lose" ? 0.85 : input.goal === "gain" ? 1.15 : 1);
  return { basal, maintenance, target };
}

export function calculateBikeSize(inseamCm: number, type: "road" | "mountain") {
  positive(inseamCm);
  // Las mismas fórmulas de entrepierna que explica el artículo.
  return type === "road"
    ? { size: inseamCm * 0.665, unit: "cm" }
    : { size: inseamCm * 0.226, unit: "pulgadas" };
}

export function calculateGelCount(minutes: number) {
  positive(minutes);
  return minutes < 45 ? 0 : 1 + Math.floor((minutes - 45) / 40);
}
