"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { PlanInput } from "@/lib/mi-plan";
import type { PlanPack } from "@/components/ActimaxPlanBuilder";

const Asesor = dynamic(() => import("./AsesorActimax").then((module) => module.AsesorActimax), {
  loading: () => <p role="status" className="p-12 text-center text-sm text-azul">Preparando el asesor…</p>,
});
const Calculadora = dynamic(() => import("./ActimaxPlanBuilder").then((module) => module.ActimaxPlanBuilder));

const PESTANAS = [
  ["asesor", "Hablar con el asesor"],
  ["calculadora", "Calculadora de carrera"],
] as const;

export function MiPlanExperiencia({ initialInput, packs, usarCalculadora }: { initialInput: PlanInput; packs: PlanPack[]; usarCalculadora: boolean }) {
  const [vista, setVista] = useState(usarCalculadora ? "calculadora" : "asesor");
  const [asesorAbierto, setAsesorAbierto] = useState(!usarCalculadora);
  function elegir(value: string) {
    if (value === "asesor") setAsesorAbierto(true);
    setVista(value);
  }
  /* El asesor ocupa exactamente la pantalla bajo la cabecera: el chat no debe
     empujar su propio campo de texto fuera de vista en el móvil. La
     calculadora, en cambio, es un documento largo y usa el scroll de página. */
  return (
    <div className={vista === "asesor" ? "flex h-[calc(100svh-var(--altura-cabecera))] flex-col" : "flex flex-col"}>
      <div className="shrink-0 border-b border-tinta/10 bg-white px-4">
        <div role="tablist" aria-label="Elige cómo crear tu plan" className="mx-auto flex max-w-6xl gap-1">
          {PESTANAS.map(([value, label]) => (
            <button key={value} id={`tab-${value}`} type="button" role="tab" tabIndex={vista === value ? 0 : -1} aria-selected={vista === value} aria-controls={`panel-${value}`} onClick={() => elegir(value)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "asesor" : event.key === "End" ? "calculadora" : vista === "asesor" ? "calculadora" : "asesor";
              elegir(next);
              document.getElementById(`tab-${next}`)?.focus();
            }} className={`min-h-12 flex-1 rounded-none border-b-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-azul sm:flex-none sm:px-5 ${vista === value ? "border-azul text-azul" : "border-transparent text-tinta/55 hover:text-tinta"}`}>{label}</button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="panel-asesor" aria-labelledby="tab-asesor" data-asesor-chat hidden={vista !== "asesor"} className={vista === "asesor" ? "flex min-h-0 flex-1 flex-col" : undefined}>
        {asesorAbierto ? <Asesor /> : null}
      </div>
      <div role="tabpanel" id="panel-calculadora" aria-labelledby="tab-calculadora" hidden={vista !== "calculadora"}>
        {vista === "calculadora" ? <Calculadora initialInput={initialInput} packs={packs} /> : null}
      </div>
    </div>
  );
}
