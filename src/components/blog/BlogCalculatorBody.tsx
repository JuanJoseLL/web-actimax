"use client";

import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { calculateBikeSize, calculateBmi, calculateCalories, type BlogCalculatorKind } from "@/lib/blog-calculators";

const fieldClass = "mt-2 block w-full rounded-md border border-tinta/20 bg-white px-3 py-3 text-base text-tinta";
const format = (value: number, digits = 0) => value.toLocaleString("es-CO", { maximumFractionDigits: digits });

/** Monta React dentro del marcador del plugin, conservando el HTML del artículo. */
export function BlogCalculatorBody({ html, kind }: { html: string; kind: BlogCalculatorKind }) {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const attach = useCallback((node: HTMLDivElement | null) => {
    setContainer(node?.querySelector<HTMLElement>("#fitcalc_actimax") ?? null);
  }, []);

  return (
    <>
      <div ref={attach} className="prose-actimax prose-blog pt-8 text-[15px] text-foreground/85" dangerouslySetInnerHTML={{ __html: html }} />
      {container ? createPortal(<BlogCalculator kind={kind} />, container) : null}
    </>
  );
}

function NumberField({ name, label, min = 1, max, step = "any" }: {
  name: string; label: string; min?: number; max?: number; step?: string;
}) {
  return <label className="block font-medium">{label}<input className={fieldClass} name={name} type="number" inputMode="decimal" min={min} max={max} step={step} required /></label>;
}

function BlogCalculator({ kind }: { kind: BlogCalculatorKind }) {
  const [result, setResult] = useState<ReactNode>(null);
  const [error, setError] = useState("");
  const title = kind === "calories" ? "Calculadora de calorías diarias" : kind === "bmi" ? "Calculadora de IMC para adultos" : "Calculadora de talla de bicicleta";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const number = (key: string) => Number(data.get(key));
    setError("");
    try {
      if (kind === "bmi") {
        const { bmi, category } = calculateBmi(number("weight"), number("height"));
        setResult(<><strong>Tu IMC: {format(bmi, 1)}</strong><br />{category}</>);
      } else if (kind === "bike") {
        const { size, unit } = calculateBikeSize(number("inseam"), data.get("bike") === "mountain" ? "mountain" : "road");
        setResult(<><strong>Talla aproximada del cuadro: {format(size, 1)} {unit}</strong><br />Busca la talla disponible más cercana en la tabla del fabricante.</>);
      } else {
        const { basal, maintenance, target } = calculateCalories({
          weightKg: number("weight"), heightCm: number("height"), age: number("age"),
          sex: data.get("sex") === "male" ? "male" : "female", activity: number("activity"),
          goal: data.get("goal") === "lose" ? "lose" : data.get("goal") === "gain" ? "gain" : "maintain",
        });
        setResult(<><strong>Para tu objetivo: {format(target)} kcal/día</strong><br />Mantenimiento: {format(maintenance)} kcal/día.<br />Metabolismo basal: {format(basal)} kcal/día.</>);
      }
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "Revisa los datos ingresados.");
    }
  }

  return (
    <section aria-label={title} className="my-8 rounded-xl border border-tinta/15 bg-[#f4f2ec] p-5 sm:p-8">
      <h2 className="!mt-0">{title}</h2>
      <form onSubmit={submit} onChange={() => { setResult(null); setError(""); }}>
        <div className="grid gap-5 sm:grid-cols-2">
          {kind === "bike" ? <>
            <NumberField name="inseam" label="Longitud de entrepierna (cm)" />
            <label className="block font-medium">Tipo de bicicleta<select className={fieldClass} name="bike"><option value="road">Carretera</option><option value="mountain">Montaña</option></select></label>
          </> : <>
            <NumberField name="weight" label="Peso (kg)" />
            <NumberField name="height" label="Estatura (cm)" />
          </>}
          {kind === "calories" ? <>
            <NumberField name="age" label="Edad (años)" min={18} max={120} step="1" />
            <label className="block font-medium">Sexo para la fórmula<select className={fieldClass} name="sex"><option value="female">Mujer</option><option value="male">Hombre</option></select></label>
            <label className="block font-medium">Actividad física<select className={fieldClass} name="activity" defaultValue="1.2">
              <option value="1.2">Sedentaria: poco o ningún ejercicio</option><option value="1.375">Ligera: 1–3 días por semana</option><option value="1.55">Moderada: 3–5 días por semana</option><option value="1.725">Alta: 6–7 días por semana</option><option value="1.9">Muy alta: ejercicio intenso dos veces al día</option>
            </select></label>
            <label className="block font-medium">Objetivo<select className={fieldClass} name="goal"><option value="maintain">Mantener peso</option><option value="lose">Perder peso (déficit del 15%)</option><option value="gain">Ganar peso (superávit del 15%)</option></select></label>
          </> : null}
        </div>
        <button type="submit" className="mt-6 rounded-md bg-azul px-6 py-3 font-bold text-white hover:opacity-90">Calcular</button>
        <div aria-live="polite" aria-atomic="true">
          {error ? <p role="alert" className="mt-5">{error}</p> : null}
          {result ? <div className="mt-5 rounded-md border border-tinta/15 bg-white p-5">{result}</div> : null}
        </div>
      </form>
      <p className="!mb-0 text-sm text-tinta/70">{kind === "bike"
        ? "Estimación basada en la entrepierna. Comprueba la geometría y las tallas de la marca y prueba la bicicleta para afinar el ajuste."
        : kind === "bmi"
          ? "Clasificación para adultos. El IMC no distingue músculo de grasa; en niños y adolescentes se interpreta con tablas por edad y sexo."
          : "Estimación para adultos con la fórmula Harris-Benedict y los factores de actividad descritos en este artículo."}</p>
    </section>
  );
}
