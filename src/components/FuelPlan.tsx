import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Momento, ProductType } from "@/lib/catalog";

const STAGES: Array<{ momento: Momento; step: string; title: string; detail: string }> = [
  {
    momento: "antes",
    step: "01",
    title: "Antes",
    detail: "Carga energía y prepara tus reservas antes de la largada.",
  },
  {
    momento: "durante",
    step: "02",
    title: "Durante",
    detail: "Repón energía e hidratación para sostener tu esfuerzo.",
  },
  {
    momento: "despues",
    step: "03",
    title: "Después",
    detail: "Recupera líquidos y músculos en la ventana posterior a la meta.",
  },
];

export function FuelPlan({ momentos, type }: { momentos: Momento[]; type: ProductType | null }) {
  const activeMoments = type === "kits" ? STAGES.map((stage) => stage.momento) : momentos;

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            Estrategia de uso
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold uppercase italic leading-none sm:text-4xl">
            Tu plan de carrera
          </h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ubica este producto en tu esfuerzo y construye una estrategia que puedas probar entrenando.
        </p>
      </div>
      <ol className="mt-7 grid gap-3 md:grid-cols-3">
        {STAGES.map((stage) => {
          const isActive = activeMoments.includes(stage.momento);
          return (
            <li key={stage.momento}>
              <Card className={`h-full gap-0 py-0 ${isActive ? "border-primary bg-primary/5" : "bg-muted/45"}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`font-mono text-xs font-bold tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      SPLIT {stage.step}
                    </span>
                    {isActive ? (
                      <Badge className="rounded-sm bg-accent font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                        Este producto
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className={`mt-5 font-display text-3xl font-extrabold uppercase italic leading-none ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {stage.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stage.detail}</p>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
