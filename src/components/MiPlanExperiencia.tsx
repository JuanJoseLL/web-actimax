"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { PlanInput } from "@/lib/mi-plan";
import type { PlanPack } from "@/components/ActimaxPlanBuilder";

const Asesor = dynamic(() => import("./AsesorActimax").then((module) => module.AsesorActimax), {
  loading: () => <p role="status" className="p-12 text-center text-sm text-azul">Preparando el asesor…</p>,
});
const Calculadora = dynamic(() => import("./ActimaxPlanBuilder").then((module) => module.ActimaxPlanBuilder));

export function MiPlanExperiencia({ initialInput, packs, usarCalculadora }: { initialInput: PlanInput; packs: PlanPack[]; usarCalculadora: boolean }) {
  const [vista, setVista] = useState(usarCalculadora ? "calculadora" : "asesor");
  const [asesorAbierto, setAsesorAbierto] = useState(!usarCalculadora);
  function elegir(value: string) {
    if (value === "asesor") setAsesorAbierto(true);
    setVista(value);
  }
  return (
    <>
      <div className="border-b border-tinta/10 bg-white px-4 py-3">
        <div role="tablist" aria-label="Elige cómo crear tu plan" className="mx-auto flex max-w-6xl gap-2">
          {[["asesor", "Hablar con el asesor"], ["calculadora", "Calculadora de carrera"]].map(([value, label]) => (
            <button key={value} id={`tab-${value}`} type="button" role="tab" tabIndex={vista === value ? 0 : -1} aria-selected={vista === value} aria-controls={`panel-${value}`} onClick={() => elegir(value)} onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "asesor" : event.key === "End" ? "calculadora" : vista === "asesor" ? "calculadora" : "asesor";
              elegir(next);
              document.getElementById(`tab-${next}`)?.focus();
            }} className={`rounded-sm px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-azul ${vista === value ? "bg-azul text-white" : "text-tinta/60 hover:bg-niebla"}`}>{label}</button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="panel-asesor" aria-labelledby="tab-asesor" hidden={vista !== "asesor"}>
        {asesorAbierto ? <Asesor /> : null}
      </div>
      <div role="tabpanel" id="panel-calculadora" aria-labelledby="tab-calculadora" hidden={vista !== "calculadora"}>
        {vista === "calculadora" ? <Calculadora initialInput={initialInput} packs={packs} /> : null}
      </div>
    </>
  );
}
