"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { track } from "@/lib/track";

export type HeroSlide = {
  id: string;
  /** Lo que dice la pestaña de abajo: se lee aunque la diapositiva no esté a la vista. */
  etiqueta: string;
  contenido: ReactNode;
};

/* Lo que dura cada diapositiva antes de pasar sola. */
const DURACION_MS = 8000;

const MOVIMIENTO_REDUCIDO = "(prefers-reduced-motion: reduce)";

function suscribirMovimiento(avisar: () => void) {
  const consulta = window.matchMedia(MOVIMIENTO_REDUCIDO);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/**
 * El carrusel del hero. Las diapositivas llegan ya dibujadas desde el
 * servidor (la primera lleva el h1 y la imagen LCP), así que esto solo mueve
 * un carril con scroll-snap: en el móvil el dedo desliza de forma nativa y en
 * escritorio mandan las pestañas y las flechas.
 *
 * Pasa solo cada DURACION_MS, pero se detiene para siempre en cuanto alguien
 * toca los controles o desliza, y se pausa mientras el puntero o el foco estén
 * encima. Con movimiento reducido no avanza nunca.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const carril = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [detenido, setDetenido] = useState(false);
  const movimientoReducido = useSyncExternalStore(
    suscribirMovimiento,
    () => window.matchMedia(MOVIMIENTO_REDUCIDO).matches,
    /* En el servidor se asume que sí hay movimiento; al hidratar se corrige. */
    () => false,
  );
  /* Un scroll que dispara el propio componente no cuenta como gesto del usuario. */
  const scrollPropio = useRef(false);

  useEffect(() => {
    const el = carril.current;
    if (el === null) return;
    let fin: ReturnType<typeof setTimeout> | undefined;
    const alDesplazar = () => {
      const indice = Math.round(el.scrollLeft / el.clientWidth);
      setActiva(Math.min(Math.max(indice, 0), slides.length - 1));
      if (!scrollPropio.current) setDetenido(true);
      clearTimeout(fin);
      fin = setTimeout(() => {
        scrollPropio.current = false;
      }, 150);
    };
    el.addEventListener("scroll", alDesplazar, { passive: true });
    return () => {
      el.removeEventListener("scroll", alDesplazar);
      clearTimeout(fin);
    };
  }, [slides.length]);

  function irA(indice: number) {
    const el = carril.current;
    if (el === null) return;
    const destino = (indice + slides.length) % slides.length;
    scrollPropio.current = true;
    el.scrollTo({
      left: destino * el.clientWidth,
      behavior: movimientoReducido ? "auto" : "smooth",
    });
    setActiva(destino);
  }

  function elegir(indice: number) {
    setDetenido(true);
    irA(indice);
  }

  const autoavance = !detenido && !movimientoReducido && slides.length > 1;

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Destacados de Actimax"
      className="hero-evolved overflow-hidden text-white"
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
      }}
    >
      <div
        ref={carril}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, indice) => (
          <div
            key={slide.id}
            id={`hero-${slide.id}`}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${indice + 1} de ${slides.length}: ${slide.etiqueta}`}
            /* Las que no están a la vista no reciben foco: el tabulador no
               debe perderse en enlaces que el usuario no ve. */
            inert={indice !== activa}
            className="w-full shrink-0 snap-start snap-always"
            onClickCapture={(e) => {
              const enlace = (e.target as HTMLElement).closest("a");
              if (enlace === null) return;
              track("hero_clic", {
                diapositiva: slide.id,
                destino: enlace.getAttribute("href"),
              });
            }}
          >
            {slide.contenido}
          </div>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="relative z-10 border-t border-white/10 bg-[#001c52]/70 backdrop-blur-sm">
          <div className="mx-auto flex max-w-[1440px] items-stretch px-2 sm:px-4 lg:px-10">
            <button
              type="button"
              onClick={() => elegir(activa - 1)}
              aria-label="Diapositiva anterior"
              className="hidden min-h-12 items-center px-3 text-white/60 transition hover:text-amarillo sm:flex"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <div className="flex min-w-0 flex-1">
              {slides.map((slide, indice) => {
                const esActiva = indice === activa;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => elegir(indice)}
                    aria-controls={`hero-${slide.id}`}
                    aria-current={esActiva ? "true" : undefined}
                    className={`group relative flex min-h-12 min-w-0 flex-1 items-center gap-2.5 px-3 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] transition sm:text-[11px] ${
                      esActiva ? "text-white" : "text-white/55 hover:text-white/85"
                    }`}
                  >
                    <span className={esActiva ? "text-amarillo" : ""}>
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{slide.etiqueta}</span>
                    <span aria-hidden className="absolute inset-x-3 top-0 h-0.5 bg-white/15">
                      {esActiva ? (
                        <span
                          key={`${activa}-${autoavance}`}
                          className="hero-progreso block h-full origin-left bg-amarillo"
                          style={
                            autoavance
                              ? {
                                  animationDuration: `${DURACION_MS}ms`,
                                  animationPlayState: pausado ? "paused" : "running",
                                }
                              : { animation: "none" }
                          }
                          onAnimationEnd={() => {
                            if (autoavance) irA(activa + 1);
                          }}
                        />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => elegir(activa + 1)}
              aria-label="Diapositiva siguiente"
              className="hidden min-h-12 items-center px-3 text-white/60 transition hover:text-amarillo sm:flex"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
