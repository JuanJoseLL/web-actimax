export type PlanSport = "running" | "ciclismo" | "triatlon";
export type PlanClimate = "fresco" | "templado" | "calido";
export type CaffeineTolerance = "ninguna" | "baja" | "habitual";
export type FuelPreference = "gel" | "bebida" | "mixto";
export type PlanStage = "antes" | "durante" | "despues";

export interface PlanInput {
  sport: PlanSport;
  distanceKm: number;
  durationMinutes: number;
  weightKg: number;
  climate: PlanClimate;
  caffeineTolerance: CaffeineTolerance;
  preference: FuelPreference;
}

export interface PlanStep {
  id: string;
  stage: PlanStage;
  minute: number;
  title: string;
  detail: string;
  estimatedKm?: number;
  kind: "pre" | "hydrate" | "fuel" | "recovery";
}

export interface PlanSegment {
  id: string;
  startMinute: number;
  endMinute: number;
  fluidMl: number;
  fuelings: PlanStep[];
  estimatedStartKm?: number;
  estimatedEndKm?: number;
}

export interface PlanResult {
  packHandle: string;
  carbRangePerHour: [number, number];
  estimatedCarbRange: [number, number];
  fluidPerHourMl: number;
  estimatedFluidMl: number;
  fuelings: number;
  caffeineServings: number;
  caffeineSummary: string;
  before: PlanStep[];
  during: PlanStep[];
  after: PlanStep[];
  timeline: PlanStep[];
  segments: PlanSegment[];
  warnings: string[];
}

export const PLAN_PACK_HANDLES = [
  "energy-pack-de-10k",
  "energy-pack-15k",
  "energy-pack-media-maraton-21k",
  "energy-pack-maraton-42k",
  "energy-pack-42k-sub-3",
  "energy-pack-gran-fondo",
  "energy-pack-actimax-para-triatlon-media-distancia",
] as const;

const SPORT_DEFAULTS: Record<PlanSport, { distanceKm: number; durationMinutes: number }> = {
  running: { distanceKm: 21, durationMinutes: 130 },
  ciclismo: { distanceKm: 100, durationMinutes: 300 },
  triatlon: { distanceKm: 113, durationMinutes: 360 },
};

const CLIMATE_ML_PER_KG: Record<PlanClimate, number> = {
  fresco: 6,
  templado: 7,
  calido: 8,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundTo(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function defaultRunningDuration(distanceKm: number): number {
  if (distanceKm <= 11) return 60;
  if (distanceKm <= 17) return 90;
  if (distanceKm <= 30) return 130;
  return 270;
}

export function getDefaultPlanInput(
  sport: PlanSport = "running",
  distanceKm?: number,
): PlanInput {
  const defaults = SPORT_DEFAULTS[sport];
  const safeDistance =
    distanceKm !== undefined && Number.isFinite(distanceKm)
      ? clamp(distanceKm, 0.5, 500)
      : defaults.distanceKm;
  const estimatedDuration =
    distanceKm === undefined
      ? defaults.durationMinutes
      : sport === "running"
        ? defaultRunningDuration(safeDistance)
        : Math.max(30, Math.round(safeDistance * (sport === "ciclismo" ? 3 : 3.2)));
  const durationMinutes = clamp(estimatedDuration, 30, 1440);

  return {
    sport,
    distanceKm: safeDistance,
    durationMinutes,
    weightKg: 70,
    climate: "templado",
    caffeineTolerance: "baja",
    preference: "mixto",
  };
}

function validateInput(input: PlanInput): void {
  if (!Number.isFinite(input.distanceKm) || input.distanceKm < 0.5 || input.distanceKm > 500) {
    throw new RangeError("La distancia debe estar entre 0,5 y 500 km.");
  }
  if (
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes < 30 ||
    input.durationMinutes > 1440
  ) {
    throw new RangeError("La duración debe estar entre 30 minutos y 24 horas.");
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 35 || input.weightKg > 200) {
    throw new RangeError("El peso debe estar entre 35 y 200 kg.");
  }
}

function getCarbRange(durationMinutes: number): [number, number] {
  if (durationMinutes < 60) return [0, 30];
  if (durationMinutes < 150) return [30, 45];
  return [45, 60];
}

function getPackHandle(input: PlanInput): string {
  if (input.sport === "ciclismo") return "energy-pack-gran-fondo";
  if (input.sport === "triatlon") {
    return "energy-pack-actimax-para-triatlon-media-distancia";
  }
  if (input.distanceKm <= 12.5) return "energy-pack-de-10k";
  if (input.distanceKm <= 18) return "energy-pack-15k";
  if (input.distanceKm <= 31.5) return "energy-pack-media-maraton-21k";
  return input.durationMinutes <= 180
    ? "energy-pack-42k-sub-3"
    : "energy-pack-maraton-42k";
}

function getFuelMinutes(durationMinutes: number): number[] {
  if (durationMinutes < 40) return [];
  if (durationMinutes < 60) {
    return [Math.min(45, Math.max(30, durationMinutes - 10))];
  }

  const minutes: number[] = [];
  for (let minute = 45; minute <= durationMinutes - 10; minute += 40) {
    minutes.push(minute);
  }
  return minutes;
}

function isCaffeinatedFueling(
  index: number,
  total: number,
  minute: number,
  input: PlanInput,
): boolean {
  if (input.caffeineTolerance === "ninguna" || input.durationMinutes < 90) return false;
  if (input.caffeineTolerance === "baja") return index === total - 1;
  return minute >= input.durationMinutes * 0.55;
}

function getFuelCopy(
  preference: FuelPreference,
  index: number,
  caffeinated: boolean,
): { title: string; detail: string } {
  const caffeine = caffeinated ? " con cafeína" : " sin cafeína";
  const useGel =
    !caffeinated || preference === "gel" || (preference === "mixto" && index % 2 === 0);

  if (useGel) {
    return {
      title: `Toma de gel${caffeine}`,
      detail: "Consume la porción que probaste en entrenamiento y acompáñala con agua.",
    };
  }

  return {
    title: `Bebida deportiva${caffeine}`,
    detail: "Completa de forma gradual la porción planeada para esta hora; no la tomes de una vez.",
  };
}

function estimatedKm(input: PlanInput, minute: number): number | undefined {
  if (input.sport === "triatlon") return undefined;
  return Math.round((input.distanceKm * minute * 10) / input.durationMinutes) / 10;
}

export function createActimaxPlan(input: PlanInput): PlanResult {
  validateInput(input);

  const durationHours = input.durationMinutes / 60;
  const climateMinimum = input.climate === "calido" ? 500 : 400;
  const fluidPerHourMl = roundTo(
    clamp(input.weightKg * CLIMATE_ML_PER_KG[input.climate], climateMinimum, 750),
    50,
  );
  const estimatedFluidMl = roundTo(fluidPerHourMl * durationHours, 50);
  const carbRangePerHour = getCarbRange(input.durationMinutes);
  const estimatedCarbRange: [number, number] = [
    Math.round(carbRangePerHour[0] * durationHours),
    Math.round(carbRangePerHour[1] * durationHours),
  ];
  const effectivePreference =
    input.preference === "bebida" && input.caffeineTolerance === "ninguna"
      ? "gel"
      : input.preference;

  const before: PlanStep[] = [
    {
      id: "pre-30",
      stage: "antes",
      minute: -30,
      title: "Prepara la salida",
      detail:
        "Usa tu Pre Race entre 15 y 30 minutos antes, junto con el desayuno y la hidratación que ya toleras.",
      kind: "pre",
    },
  ];

  const during: PlanStep[] = [];
  const sipAmount = roundTo(fluidPerHourMl / 2, 25);
  for (let minute = 15; minute < input.durationMinutes; minute += 30) {
    during.push({
      id: `hydrate-${minute}`,
      stage: "durante",
      minute,
      title: "Punto de hidratación",
      detail: `Distribuye cerca de ${sipAmount} ml en pequeños sorbos durante los próximos 30 minutos.`,
      estimatedKm: estimatedKm(input, minute),
      kind: "hydrate",
    });
  }

  const fuelMinutes = getFuelMinutes(input.durationMinutes);
  let caffeineServings = 0;
  fuelMinutes.forEach((minute, index) => {
    const caffeinated = isCaffeinatedFueling(index, fuelMinutes.length, minute, input);
    if (caffeinated) caffeineServings += 1;
    const copy = getFuelCopy(effectivePreference, index, caffeinated);
    during.push({
      id: `fuel-${minute}`,
      stage: "durante",
      minute,
      title: copy.title,
      detail: copy.detail,
      estimatedKm: estimatedKm(input, minute),
      kind: "fuel",
    });
  });

  during.sort((a, b) => a.minute - b.minute || (a.kind === "hydrate" ? -1 : 1));

  const segmentDuration = input.durationMinutes > 480 ? 120 : 60;
  const segmentCount = Math.ceil(input.durationMinutes / segmentDuration);
  let assignedFluidMl = 0;
  const segments: PlanSegment[] = Array.from({ length: segmentCount }, (_, index) => {
    const startMinute = index * segmentDuration;
    const endMinute = Math.min((index + 1) * segmentDuration, input.durationMinutes);
    const isLast = index === segmentCount - 1;
    const fluidMl = isLast
      ? Math.max(0, estimatedFluidMl - assignedFluidMl)
      : roundTo(fluidPerHourMl * ((endMinute - startMinute) / 60), 25);
    assignedFluidMl += fluidMl;

    return {
      id: `segment-${startMinute}-${endMinute}`,
      startMinute,
      endMinute,
      fluidMl,
      fuelings: during.filter(
        (step) =>
          step.kind === "fuel" && step.minute >= startMinute && step.minute < endMinute,
      ),
      estimatedStartKm: estimatedKm(input, startMinute),
      estimatedEndKm: estimatedKm(input, endMinute),
    };
  });

  const after: PlanStep[] = [
    {
      id: "recovery-30",
      stage: "despues",
      minute: input.durationMinutes + 30,
      title: "Activa la recuperación",
      detail:
        "Dentro de los primeros 30 a 40 minutos, toma Recovery Pro y acompáñalo con una comida de recuperación.",
      kind: "recovery",
    },
  ];

  const warnings: string[] = [];
  if (input.preference === "bebida" && input.caffeineTolerance === "ninguna") {
    warnings.push(
      "Como Élite contiene cafeína, los momentos sin cafeína se cubren con gel y agua.",
    );
  } else if (input.preference === "bebida") {
    warnings.push(
      "Élite aparece solo en las tomas con cafeína; en las demás, el plan usa gel y agua.",
    );
  }
  if (input.climate === "calido") {
    warnings.push(
      "Con calor o alta humedad, ajusta los líquidos según tu sudoración y los puntos de abastecimiento.",
    );
  }
  if (input.sport === "triatlon") {
    warnings.push(
      "En triatlón, distribuye el cronograma entre ciclismo y carrera y contempla las transiciones al ensayarlo.",
    );
  }
  if (input.durationMinutes >= 300) {
    warnings.push(
      "En retos de 5 horas o más, afina líquidos, sodio y carbohidratos con lo aprendido en tus entrenamientos largos.",
    );
  }

  const caffeineSummary =
    caffeineServings === 0
      ? "Sin tomas planificadas"
      : caffeineServings === 1
        ? "1 toma hacia el final"
        : `${caffeineServings} tomas tras la mitad`;

  return {
    packHandle: getPackHandle(input),
    carbRangePerHour,
    estimatedCarbRange,
    fluidPerHourMl,
    estimatedFluidMl,
    fuelings: fuelMinutes.length,
    caffeineServings,
    caffeineSummary,
    before,
    during,
    after,
    timeline: [...before, ...during, ...after],
    segments,
    warnings,
  };
}
