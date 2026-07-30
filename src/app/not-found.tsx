import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página no encontrada — Actimax",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 md:py-32">
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Error 404
      </p>
      <h1 className="mt-3 font-display text-6xl font-extrabold uppercase italic leading-none sm:text-8xl">
        Esta página no existe
      </h1>
      <p className="mt-5 max-w-md text-muted-foreground">
        Puede que el enlace haya cambiado con la tienda nueva o que esté mal
        escrito. Lo importante sigue aquí:
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild variant="race" size="lg">
          <Link href="/productos/">Ver la tienda</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Ir al inicio</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/blog/">Leer el blog</Link>
        </Button>
      </div>
    </div>
  );
}
