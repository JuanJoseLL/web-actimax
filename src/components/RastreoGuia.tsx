"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * El número de guía, grande y con botón de copiar.
 *
 * Cuando la transportadora no tiene enlace directo —Envía es el caso— copiar
 * y pegar es lo único que le queda al cliente, así que el botón es la pieza
 * central de la página y no un adorno.
 */
export function RastreoGuia({ guia, legible }: { guia: string; legible: string }) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (temporizador.current !== null) clearTimeout(temporizador.current);
    };
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(guia);
    } catch {
      /* Safari en iOS niega el portapapeles si la pestaña perdió el foco, y
         algún navegador viejo no trae la API. El número se ve en pantalla y
         se puede seleccionar a mano, así que no vale la pena alarmar. */
      return;
    }
    setCopiado(true);
    if (temporizador.current !== null) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(false), 2500);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Número de guía
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        {/* select-all para que un toque largo en el móvil agarre el número
            entero y no solo un grupo de dígitos. */}
        <p className="select-all font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {legible}
        </p>
        <Button type="button" variant="outline" size="lg" onClick={copiar}>
          {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copiado ? "Número de guía copiado" : ""}
      </p>
    </div>
  );
}
