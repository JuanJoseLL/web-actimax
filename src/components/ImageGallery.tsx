"use client";

import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExpandIcon,
  Minimize2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const zoomViewportRef = useRef<HTMLDivElement>(null);
  const main = images[active] ?? images[0];

  useEffect(() => {
    const viewport = zoomViewportRef.current;
    if (!zoomed || viewport === null) return;

    viewport.scrollTo({
      left: (viewport.scrollWidth - viewport.clientWidth) / 2,
      top: (viewport.scrollHeight - viewport.clientHeight) / 2,
    });
  }, [zoomed]);

  function selectImage(index: number) {
    const gallery = galleryRef.current;
    setActive(index);
    setZoomed(false);
    gallery?.scrollTo({ left: index * gallery.clientWidth });
  }

  function openZoom(index: number) {
    setActive(index);
    setZoomed(false);
    setZoomOpen(true);
  }

  return (
    <>
      <div>
        {images.length > 0 ? (
          <div className="relative">
            <div
              ref={galleryRef}
              onScroll={(event) => {
                const gallery = event.currentTarget;
                const next = Math.round(gallery.scrollLeft / gallery.clientWidth);
                setActive(Math.max(0, Math.min(next, images.length - 1)));
              }}
              /* En móvil la caja es 4:3 y nunca más de media pantalla: con la
                 foto cuadrada a ancho completo, precio y botón quedaban a un
                 scroll entero del H1. En escritorio vuelve al cuadrado. */
              className="product-gallery-scroll flex aspect-[4/3] max-h-[48vh] snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth rounded-xl bg-muted ring-1 ring-border motion-reduce:scroll-auto lg:aspect-square lg:max-h-none"
            >
              {images.map((src, index) => (
                <button
                  type="button"
                  key={`${src}-${index}`}
                  onClick={() => openZoom(index)}
                  aria-label={`Ampliar imagen ${index + 1} de ${images.length}: ${alt}`}
                  className="group relative block h-full w-full shrink-0 snap-center cursor-zoom-in overflow-hidden"
                >
                  {/* La primera foto es el LCP de la ficha: precarga + prioridad
                      alta. Las fotos son cuadradas, así que en la caja 4:3 de
                      móvil ocupan el 75% del ancho; pedir 100vw traía un
                      candidato más pesado del necesario. */}
                  <Image
                    src={src}
                    alt={index === 0 ? alt : `${alt}, imagen ${index + 1}`}
                    fill
                    preload={index === 0}
                    fetchPriority={index === 0 ? "high" : undefined}
                    sizes="(min-width: 1280px) 580px, (min-width: 1024px) 50vw, 75vw"
                    className="object-contain p-3 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.02] sm:p-8"
                  />
                  <span className="pointer-events-none absolute bottom-3 right-3 flex min-h-9 items-center gap-2 rounded-full bg-background/90 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-sm">
                    <ExpandIcon className="size-4" />
                    Ampliar
                  </span>
                </button>
              ))}
            </div>
            {images.length > 1 ? (
              /* Contador dentro de la caja (y no debajo) para no empujar el
                 botón de compra bajo el pliegue en móvil. */
              <p
                aria-live="polite"
                className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-background/90 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-tinta/70 shadow-sm backdrop-blur-sm sm:hidden"
              >
                {active + 1} / {images.length} · Desliza
              </p>
            ) : null}
          </div>
        ) : (
          <div className="aspect-[4/3] max-h-[48vh] rounded-xl bg-muted ring-1 ring-border lg:aspect-square lg:max-h-none" />
        )}

        {images.length > 1 ? (
          <>
            <div className="product-gallery-scroll mt-3 hidden gap-2 overflow-x-auto pb-1 sm:flex">
              {images.map((src, index) => (
                <Button
                  type="button"
                  key={`${src}-${index}`}
                  onClick={() => selectImage(index)}
                  aria-label={`Ver imagen ${index + 1} de ${images.length}`}
                  aria-pressed={index === active}
                  variant="outline"
                  size="icon"
                  className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted p-0 transition-all ${
                    index === active
                      ? "border-primary ring-2 ring-primary"
                      : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-1.5 mix-blend-multiply"
                  />
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <Dialog
        open={zoomOpen}
        onOpenChange={(open) => {
          setZoomOpen(open);
          if (!open) setZoomed(false);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="inset-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-tinta p-0 text-white ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">Galería ampliada de {alt}</DialogTitle>
          <DialogDescription className="sr-only">
            Imagen {active + 1} de {images.length}. Usa el botón de zoom para ampliar la imagen.
          </DialogDescription>

          <div className="relative z-10 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-white/15 bg-tinta/95 px-3 pt-[env(safe-area-inset-top)] sm:px-5">
            <p className="min-w-0 truncate font-mono text-[11px] font-bold uppercase tracking-wider text-white/70">
              {active + 1} / {images.length} · {alt}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setZoomed((current) => !current)}
                className="text-white hover:bg-white/10 hover:text-white"
                aria-label={zoomed ? "Ajustar imagen a la pantalla" : "Ampliar imagen dos veces"}
              >
                {zoomed ? <Minimize2Icon /> : <ExpandIcon />}
              </Button>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar imagen ampliada"
                >
                  <XIcon />
                </Button>
              </DialogClose>
            </div>
          </div>

          <div
            ref={zoomViewportRef}
            className="product-gallery-zoom relative min-h-0 flex-1 overflow-auto overscroll-contain bg-tinta"
          >
            {main !== undefined ? (
              <button
                type="button"
                onClick={() => setZoomed((current) => !current)}
                className={`relative block ${
                  zoomed
                    ? "h-[200dvh] w-[200vw] cursor-zoom-out"
                    : "h-full min-h-[calc(100dvh-4rem)] w-full cursor-zoom-in"
                }`}
                aria-label={zoomed ? "Reducir imagen" : "Ampliar imagen dos veces"}
              >
                <Image
                  src={main}
                  alt={`${alt}, imagen ${active + 1} ampliada`}
                  fill
                  sizes={zoomed ? "200vw" : "100vw"}
                  className="object-contain p-3 sm:p-6"
                />
              </button>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-between px-2 sm:px-5">
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={active === 0}
                onClick={() => selectImage(active - 1)}
                className="pointer-events-auto border-white/25 bg-tinta/75 text-white hover:bg-tinta hover:text-white"
                aria-label="Ver imagen anterior"
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={active === images.length - 1}
                onClick={() => selectImage(active + 1)}
                className="pointer-events-auto border-white/25 bg-tinta/75 text-white hover:bg-tinta hover:text-white"
                aria-label="Ver imagen siguiente"
              >
                <ChevronRightIcon />
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
