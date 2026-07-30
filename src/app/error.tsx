"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 md:py-32">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Algo salió mal
      </p>
      <h1 className="mt-3 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-7xl">
        No pudimos cargar esta página
      </h1>
      <p className="mt-5 max-w-md text-muted-foreground">
        Fue un error nuestro, no tuyo. Suele resolverse reintentando.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="race" size="lg" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
