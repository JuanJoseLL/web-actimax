"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BikeIcon,
  CheckCircle2Icon,
  ClockIcon,
  CoffeeIcon,
  DropletsIcon,
  FootprintsIcon,
  PackageIcon,
  PrinterIcon,
  RouteIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TriangleAlertIcon,
  WavesIcon,
  ZapIcon,
} from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP } from "@/lib/format";
import {
  createActimaxPlan,
  getDefaultPlanInput,
  type CaffeineTolerance,
  type FuelPreference,
  type PlanClimate,
  type PlanInput,
  type PlanResult,
  type PlanSport,
  type PlanStep,
} from "@/lib/mi-plan";

export interface PlanPack {
  variantId: string | null;
  handle: string;
  title: string;
  price: number;
  regularPrice: number;
  onSale: boolean;
  inStock: boolean;
  excerpt: string;
  image: string | null;
}

interface PlanFormState {
  sport: PlanSport;
  distanceKm: string;
  durationHours: string;
  durationMinutes: string;
  weightKg: string;
  climate: PlanClimate;
  caffeineTolerance: CaffeineTolerance;
  preference: FuelPreference;
}

const SPORTS = [
  { value: "running", label: "Running", icon: FootprintsIcon },
  { value: "ciclismo", label: "Ciclismo", icon: BikeIcon },
  { value: "triatlon", label: "Triatlón", icon: WavesIcon },
] as const;

const SPORT_LABELS: Record<PlanSport, string> = {
  running: "Running",
  ciclismo: "Ciclismo",
  triatlon: "Triatlón",
};

function toFormState(input: PlanInput): PlanFormState {
  return {
    sport: input.sport,
    distanceKm: String(input.distanceKm),
    durationHours: String(Math.floor(input.durationMinutes / 60)),
    durationMinutes: String(input.durationMinutes % 60),
    weightKg: String(input.weightKg),
    climate: input.climate,
    caffeineTolerance: input.caffeineTolerance,
    preference: input.preference,
  };
}

function toPlanInput(form: PlanFormState): PlanInput {
  return {
    sport: form.sport,
    distanceKm: Number(form.distanceKm),
    durationMinutes: Number(form.durationHours) * 60 + Number(form.durationMinutes),
    weightKg: Number(form.weightKg),
    climate: form.climate,
    caffeineTolerance: form.caffeineTolerance,
    preference: form.preference,
  };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${remaining} min`;
  return remaining === 0 ? `${hours} h` : `${hours} h ${remaining} min`;
}

function stepTime(step: PlanStep, durationMinutes: number): string {
  if (step.stage === "antes") return `${Math.abs(step.minute)} min antes`;
  if (step.stage === "despues") return `Meta +${step.minute - durationMinutes} min`;
  return `Min ${step.minute}`;
}

function TargetCard({ icon, label, value, detail }: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border border-white/15 bg-white/7 p-4">
      <div className="flex items-center gap-2 text-amarillo">
        {icon}
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold uppercase italic leading-none text-white">
        {value}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-white/58">{detail}</p>
    </div>
  );
}

function StageCard({ number, title, step, tone }: {
  number: string;
  title: string;
  step: PlanStep;
  tone: "blue" | "yellow" | "ink";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-azul text-white"
      : tone === "yellow"
        ? "bg-amarillo text-tinta"
        : "bg-tinta text-white";

  return (
    <article className="overflow-hidden border border-tinta/10 bg-white">
      <div className={`${toneClass} flex items-center justify-between px-4 py-3`}>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em]">{number}</span>
        <CheckCircle2Icon className="size-4" />
      </div>
      <div className="p-4">
        <p className="font-display text-2xl font-extrabold uppercase italic leading-none">{title}</p>
        <p className="mt-3 text-sm font-semibold">{step.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
      </div>
    </article>
  );
}

function Timeline({ plan, durationMinutes }: { plan: PlanResult; durationMinutes: number }) {
  return (
    <ol className="relative ml-2 border-l border-tinta/15">
      {plan.timeline.map((step) => (
        <li key={step.id} className="relative pb-7 pl-7 last:pb-0">
          <span
            aria-hidden
            className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-white ${
              step.kind === "fuel"
                ? "bg-amarillo"
                : step.kind === "hydrate"
                  ? "bg-azul-vivo"
                  : "bg-tinta"
            }`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-azul">
              {stepTime(step, durationMinutes)}
            </span>
            {step.estimatedKm !== undefined ? (
              <Badge variant="outline" className="rounded-sm font-mono text-[9px]">
                km {step.estimatedKm.toLocaleString("es-CO")}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 font-semibold">{step.title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}

export function ActimaxPlanBuilder({
  initialInput,
  packs,
}: {
  initialInput: PlanInput;
  packs: PlanPack[];
}) {
  const [form, setForm] = useState<PlanFormState>(() => toFormState(initialInput));
  const [plan, setPlan] = useState<PlanResult | null>(() => createActimaxPlan(initialInput));
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  function updateForm<K extends keyof PlanFormState>(key: K, value: PlanFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setPlan(null);
    setError(null);
  }

  function selectSport(sport: PlanSport) {
    const defaults = getDefaultPlanInput(sport);
    setForm((current) => ({
      ...current,
      sport,
      distanceKm: String(defaults.distanceKm),
      durationHours: String(Math.floor(defaults.durationMinutes / 60)),
      durationMinutes: String(defaults.durationMinutes % 60),
    }));
    setPlan(null);
    setError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextPlan = createActimaxPlan(toPlanInput(form));
      setPlan(nextPlan);
      setError(null);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (caught) {
      setPlan(null);
      setError(caught instanceof Error ? caught.message : "Revisa los datos del reto.");
    }
  }

  const input = toPlanInput(form);
  const recommendedPack = plan === null
    ? undefined
    : packs.find((pack) => pack.handle === plan.packHandle);
  const whatsappHref = plan === null
    ? undefined
    : `https://wa.me/?text=${encodeURIComponent(
        `Mi Plan Actimax para ${input.distanceKm} km de ${SPORT_LABELS[input.sport]}: ` +
          `${plan.carbRangePerHour[0]}-${plan.carbRangePerHour[1]} g de carbohidratos/h, ` +
          `${plan.fluidPerHourMl} ml de líquido/h y ${plan.fuelings} momentos de combustible. ` +
          `Pruébalo primero en entrenamiento.`,
      )}`;

  return (
    <div className="bg-[#f4f2ec]">
      <section className="hero-course overflow-hidden text-white">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1fr_0.72fr] lg:items-end lg:px-8">
          <div>
            <Badge className="rounded-sm bg-amarillo font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-tinta">
              Beta · Plan personalizado
            </Badge>
            <h1 className="mt-5 max-w-4xl font-display text-6xl font-extrabold uppercase italic leading-[0.82] tracking-tight sm:text-8xl lg:text-9xl">
              Tu meta tiene
              <span className="block text-amarillo">un plan.</span>
            </h1>
          </div>
          <div className="border-l border-white/20 pl-6">
            <p className="text-lg font-medium leading-relaxed text-white/75">
              Define tu reto y construimos un punto de partida para saber qué consumir antes,
              durante y después, con un Energy Pack listo para probar en entrenamiento.
            </p>
            <div className="mt-6 flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">
              <ShieldCheckIcon className="size-4 text-amarillo" />
              Tus datos no se guardan
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:px-8">
        <Card className="gap-0 py-0 lg:sticky lg:top-24">
          <CardHeader className="border-b border-border bg-white px-5 py-5 sm:px-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              01 · Perfil del reto
            </p>
            <CardTitle className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-none">
              Cuéntanos tu ruta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-6 sm:px-6">
            <form onSubmit={handleSubmit} className="grid gap-6">
              <fieldset>
                <legend className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Deporte
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {SPORTS.map(({ value, label, icon: Icon }) => {
                    const selected = form.sport === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => selectSport(value)}
                        className={`flex min-h-20 flex-col items-center justify-center gap-2 border px-2 py-3 text-xs font-semibold transition ${
                          selected
                            ? "border-azul bg-azul text-white"
                            : "border-border bg-white text-muted-foreground hover:border-azul/50 hover:text-tinta"
                        }`}
                      >
                        <Icon className={`size-5 ${selected ? "text-amarillo" : ""}`} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="plan-distance" className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Distancia total · km
                  </label>
                  <Input
                    id="plan-distance"
                    type="number"
                    inputMode="decimal"
                    min="0.5"
                    max="500"
                    step="0.1"
                    required
                    value={form.distanceKm}
                    onChange={(event) => updateForm("distanceKm", event.target.value)}
                    className="h-11 rounded-sm bg-white font-mono text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="plan-weight" className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Peso · kg
                  </label>
                  <Input
                    id="plan-weight"
                    type="number"
                    inputMode="decimal"
                    min="35"
                    max="200"
                    step="0.5"
                    required
                    value={form.weightKg}
                    onChange={(event) => updateForm("weightKg", event.target.value)}
                    className="h-11 rounded-sm bg-white font-mono text-base"
                  />
                </div>
              </div>

              <fieldset>
                <legend className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Tiempo objetivo
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="relative">
                    <span className="sr-only">Horas</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="24"
                      required
                      value={form.durationHours}
                      onChange={(event) => updateForm("durationHours", event.target.value)}
                      className="h-11 rounded-sm bg-white pr-14 font-mono text-base"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase text-muted-foreground">horas</span>
                  </label>
                  <label className="relative">
                    <span className="sr-only">Minutos</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="59"
                      required
                      value={form.durationMinutes}
                      onChange={(event) => updateForm("durationMinutes", event.target.value)}
                      className="h-11 rounded-sm bg-white pr-14 font-mono text-base"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase text-muted-foreground">min</span>
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <p id="plan-climate" className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Clima esperado
                  </p>
                  <Select value={form.climate} onValueChange={(value) => updateForm("climate", value as PlanClimate)}>
                    <SelectTrigger aria-labelledby="plan-climate" className="h-11 w-full rounded-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fresco">Fresco · menos de 16 °C</SelectItem>
                      <SelectItem value="templado">Templado · 16 a 24 °C</SelectItem>
                      <SelectItem value="calido">Cálido · más de 24 °C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <p id="plan-caffeine" className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Tolerancia a cafeína
                  </p>
                  <Select value={form.caffeineTolerance} onValueChange={(value) => updateForm("caffeineTolerance", value as CaffeineTolerance)}>
                    <SelectTrigger aria-labelledby="plan-caffeine" className="h-11 w-full rounded-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Ninguna</SelectItem>
                      <SelectItem value="baja">Baja · una toma final</SelectItem>
                      <SelectItem value="habitual">Habitual y ya probada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <p id="plan-preference" className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Combustible preferido
                </p>
                <Select value={form.preference} onValueChange={(value) => updateForm("preference", value as FuelPreference)}>
                  <SelectTrigger aria-labelledby="plan-preference" className="h-11 w-full rounded-sm bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mixto">Mixto · gel y bebida</SelectItem>
                    <SelectItem value="gel">Principalmente gel</SelectItem>
                    <SelectItem value="bebida">Principalmente bebida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error !== null ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>No pudimos crear el plan</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" variant="race" size="lg" className="h-auto py-4 text-lg">
                <SparklesIcon data-icon="inline-start" />
                Crear mi plan Actimax
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                No guardamos peso, tolerancia ni datos del reto.
              </p>
            </form>
          </CardContent>
        </Card>

        <section ref={resultsRef} className="scroll-mt-24">
          {plan === null ? (
            <div className="grid min-h-[440px] place-items-center border border-dashed border-tinta/20 bg-white/55 p-8 text-center">
              <div className="max-w-md">
                <RouteIcon className="mx-auto size-10 text-azul" />
                <h2 className="mt-4 font-display text-4xl font-extrabold uppercase italic leading-none">
                  Tu plan está listo para recalcular
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Ajustaste el perfil. Presiona “Crear mi plan Actimax” para actualizar objetivos, cronograma y kit.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-7">
              <div className="bg-tinta p-5 text-white sm:p-7">
                <div className="flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amarillo">
                      02 · Tu estrategia orientativa
                    </p>
                    <h2 className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-none sm:text-5xl">
                      {input.distanceKm.toLocaleString("es-CO")} km · {SPORT_LABELS[input.sport]}
                    </h2>
                    <p className="mt-2 text-sm text-white/60">Tiempo objetivo: {formatDuration(input.durationMinutes)}</p>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button type="button" variant="outline" size="sm" onClick={() => window.print()} className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                      <PrinterIcon /> Imprimir
                    </Button>
                    {whatsappHref !== undefined ? (
                      <Button asChild variant="raceSun" size="sm">
                        <a href={whatsappHref} target="_blank" rel="noreferrer">Compartir</a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <TargetCard
                    icon={<ZapIcon className="size-4" />}
                    label="Carbohidratos"
                    value={`${plan.carbRangePerHour[0]}–${plan.carbRangePerHour[1]} g/h`}
                    detail={`${plan.estimatedCarbRange[0]}–${plan.estimatedCarbRange[1]} g estimados en todo el reto`}
                  />
                  <TargetCard
                    icon={<DropletsIcon className="size-4" />}
                    label="Hidratación"
                    value={`${plan.fluidPerHourMl} ml/h`}
                    detail={`${plan.estimatedFluidMl.toLocaleString("es-CO")} ml estimados en ruta`}
                  />
                  <TargetCard
                    icon={<ClockIcon className="size-4" />}
                    label="Combustible"
                    value={`${plan.fuelings} tomas`}
                    detail="Desde el minuto 45 y ajustadas a la duración"
                  />
                  <TargetCard
                    icon={<CoffeeIcon className="size-4" />}
                    label="Cafeína"
                    value={plan.caffeineServings === 0 ? "Sin cafeína" : `${plan.caffeineServings} toma${plan.caffeineServings === 1 ? "" : "s"}`}
                    detail={plan.caffeineSummary}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StageCard number="01 · Salida" title="Antes" step={plan.before[0]} tone="blue" />
                <StageCard
                  number="02 · En ruta"
                  title="Durante"
                  step={{
                    id: "during-summary",
                    stage: "durante",
                    minute: 0,
                    title: `${plan.fuelings} momentos de combustible`,
                    detail: `Apunta a ${plan.carbRangePerHour[0]}–${plan.carbRangePerHour[1]} g de carbohidratos y ${plan.fluidPerHourMl} ml de líquido por hora.`,
                    kind: "fuel",
                  }}
                  tone="yellow"
                />
                <StageCard number="03 · Meta" title="Después" step={plan.after[0]} tone="ink" />
              </div>

              <Card className="gap-0 py-0">
                <CardHeader className="border-b border-border px-5 py-5 sm:px-6">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                    03 · Cronograma
                  </p>
                  <CardTitle className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-none">
                    Qué hacer y cuándo
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 py-6 sm:px-6">
                  <Timeline plan={plan} durationMinutes={input.durationMinutes} />
                  {plan.warnings.length > 0 ? (
                    <aside className="mt-7 border-t border-tinta/10 pt-5">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-tinta/45">
                        Para afinar la estrategia
                      </p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {plan.warnings.map((warning, index) => (
                          <li key={warning} className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                            <span className="mt-0.5 font-mono text-[9px] font-bold text-azul/55">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </aside>
                  ) : null}
                </CardContent>
              </Card>

              {recommendedPack !== undefined ? (
                <Card className="gap-0 overflow-hidden py-0">
                  <div className="grid md:grid-cols-[0.8fr_1.2fr]">
                    <div className="relative min-h-72 bg-[#e8ebf0]">
                      <span className="absolute left-4 top-3 z-0 font-display text-8xl font-extrabold italic leading-none text-white">KIT</span>
                      {recommendedPack.image !== null ? (
                        <Image
                          src={recommendedPack.image}
                          alt={recommendedPack.title}
                          fill
                          sizes="(min-width: 768px) 32vw, 100vw"
                          className="relative z-10 object-contain p-7 mix-blend-multiply"
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-col bg-white">
                      <div className="flex-1 p-5 sm:p-7">
                        <Badge className="rounded-sm bg-amarillo font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-tinta">
                          04 · Pack comercial más cercano
                        </Badge>
                        <h2 className="mt-4 font-display text-4xl font-extrabold uppercase italic leading-none sm:text-5xl">
                          {recommendedPack.title}
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{recommendedPack.excerpt}</p>
                        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                          El contenido del pack es fijo. Revisa cafeína y unidades frente a tu cronograma antes de competir.
                        </p>
                      </div>
                      <CardFooter className="flex-col items-stretch gap-4 px-5 py-5 sm:px-7">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            {recommendedPack.onSale ? (
                              <p className="font-mono text-xs text-muted-foreground line-through">{formatCOP(recommendedPack.regularPrice)}</p>
                            ) : null}
                            <p className="font-mono text-2xl font-bold tabular-nums">{formatCOP(recommendedPack.price)}</p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/productos/${recommendedPack.handle}`}>Ver contenido</Link>
                          </Button>
                        </div>
                        {recommendedPack.variantId !== null ? (
                          <AddToCartButton
                            product={{
                              variantId: recommendedPack.variantId,
                              handle: recommendedPack.handle,
                              title: recommendedPack.title,
                              price: recommendedPack.price,
                              image: recommendedPack.image,
                            }}
                            variant="full"
                            disabled={!recommendedPack.inStock}
                          />
                        ) : (
                          <Alert>
                            <PackageIcon />
                            <AlertTitle>Compra temporalmente no disponible</AlertTitle>
                            <AlertDescription>El plan sigue visible, pero el catálogo está usando su respaldo local.</AlertDescription>
                          </Alert>
                        )}
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ) : (
                <Alert>
                  <PackageIcon />
                  <AlertTitle>Estamos preparando el pack recomendado</AlertTitle>
                  <AlertDescription>
                    Puedes revisar todos los <Link href="/productos?tipo=kits">Energy Packs disponibles</Link>.
                  </AlertDescription>
                </Alert>
              )}

              <Alert className="px-4 py-4">
                <ShieldCheckIcon />
                <AlertTitle>Entrena el plan antes de competir</AlertTitle>
                <AlertDescription>
                  Esta herramienta entrega un punto de partida educativo, no una valoración médica. Ajusta según tolerancia, sudoración, altitud y abastecimiento. Si tienes una condición de salud, consulta a un profesional.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
