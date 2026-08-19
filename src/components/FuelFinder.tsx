"use client";

import Link from "next/link";
import { track } from "@/lib/track";
import { CompassIcon, RouteIcon, ShoppingBagIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canonicalProductPath } from "@/lib/product-paths";

type Sport = "running" | "ciclismo" | "triatlon";
type Distance = "10k" | "15k" | "21k" | "42k";

const RECOMMENDATIONS = {
  "running-10k": {
    handle: "energy-pack-de-10k",
    title: "Energy Pack 10K",
    label: "Tu primer reto",
    detail: "Energía para salir, un gel en ruta y recuperación al cruzar la meta.",
  },
  "running-15k": {
    handle: "energy-pack-15k",
    title: "Energy Pack 15K",
    label: "Ritmo sostenido",
    detail: "Una estrategia ligera para rendir kilómetro tras kilómetro.",
  },
  "running-21k": {
    handle: "energy-pack-media-maraton-21k",
    title: "Energy Pack Media Maratón 21K",
    label: "Media maratón",
    detail: "Combustible e hidratación para mantener el ritmo durante todo el recorrido.",
  },
  "running-42k": {
    handle: "energy-pack-maraton-42k",
    title: "Energy Pack Maratón 42K",
    label: "Larga distancia",
    detail: "Un plan completo para energía, electrolitos y recuperación.",
  },
  ciclismo: {
    handle: "energy-pack-gran-fondo",
    title: "Energy Pack Gran Fondo",
    label: "Ciclismo de fondo",
    detail: "Nutrición pensada para muchas horas de ascensos, calor y esfuerzo sostenido.",
  },
  triatlon: {
    handle: "energy-pack-actimax-para-triatlon-media-distancia",
    title: "Energy Pack Triatlón 70.3",
    label: "Media distancia",
    detail: "Una estrategia completa para llegar fuerte desde el agua hasta la carrera.",
  },
} as const;

function getRecommendation(sport: Sport, distance: Distance) {
  if (sport === "ciclismo" || sport === "triatlon") return RECOMMENDATIONS[sport];
  return RECOMMENDATIONS[`running-${distance}`];
}

export function FuelFinder({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [sport, setSport] = useState<Sport>("running");
  const [distance, setDistance] = useState<Distance>("21k");
  const recommendation = getRecommendation(sport, distance);
  const planDistance =
    sport === "running" ? distance.replace("k", "") : sport === "ciclismo" ? "100" : "113";

  function trackRecommendation(destination: "producto" | "plan") {
    track("recomendador_kit", {
      deporte: sport,
      distancia: Number(planDistance),
      destino: destination,
    });
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant={tone === "dark" ? "raceOutline" : "race"}
          size="lg"
          className="h-auto px-8 py-4 text-lg"
        >
          <CompassIcon data-icon="inline-start" />
          Encuentra tu kit
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 overflow-hidden p-0 data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 sm:px-6 sm:pt-6">
          <SheetHeader className="p-0 pr-10">
            <Badge className="w-fit rounded-sm bg-accent font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              Recomendador Actimax
            </Badge>
            <SheetTitle className="mt-2 font-display text-4xl font-extrabold uppercase italic leading-none">
              Tu próximo reto empieza aquí
            </SheetTitle>
            <SheetDescription>
              Elige tu disciplina y un reto base. Después ajustaremos tiempo, clima y tolerancia para construir tu plan.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <p id="finder-sport" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Deporte
              </p>
              <Select value={sport} onValueChange={(value) => setSport(value as Sport)}>
                <SelectTrigger aria-labelledby="finder-sport" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="ciclismo">Ciclismo</SelectItem>
                  <SelectItem value="triatlon">Triatlón</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <p id="finder-distance" className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Distancia
              </p>
              <Select value={distance} onValueChange={(value) => setDistance(value as Distance)}>
                <SelectTrigger aria-labelledby="finder-distance" className="w-full" disabled={sport !== "running"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10k">10K</SelectItem>
                  <SelectItem value="15k">15K</SelectItem>
                  <SelectItem value="21k">21K</SelectItem>
                  <SelectItem value="42k">42K</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="gap-0 bg-muted py-0">
            <CardHeader className="px-5 pt-5">
              <div className="flex items-center gap-2">
                <RouteIcon className="size-4 text-primary" />
                <Badge variant="outline" className="rounded-sm font-mono text-[10px] uppercase tracking-wider">
                  {recommendation.label}
                </Badge>
              </div>
              <CardTitle className="mt-3 font-display text-3xl font-extrabold uppercase italic leading-none">
                {recommendation.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 text-sm leading-relaxed text-muted-foreground">
              {recommendation.detail}
            </CardContent>
          </Card>
          <p className="py-4 text-xs leading-relaxed text-muted-foreground">
            Recomendación orientativa. Prueba tu nutrición durante los entrenamientos antes de competir.
          </p>
        </div>

        <div className="shrink-0 border-t bg-popover px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgb(0_0_0/0.08)] sm:px-6 sm:pt-4">
          <Button asChild variant="race" size="lg" className="h-auto w-full py-3 text-base">
            <Link
              href={canonicalProductPath(recommendation.handle)}
              onClick={() => trackRecommendation("producto")}
            >
              <ShoppingBagIcon data-icon="inline-start" />
              Ver y comprar este kit
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="mt-2 h-auto w-full py-3">
            <Link
              href={`/mi-plan/?deporte=${sport}&distancia=${planDistance}`}
              /* El pageview no conserva los parámetros. El evento registra
                 el reto elegido y cuál de las dos salidas tomó el usuario. */
              onClick={() => trackRecommendation("plan")}
            >
              Personalizar mi plan
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
