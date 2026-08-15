"use client";

import { track } from "@/lib/track";
import { ArrowRightIcon, CheckCircle2Icon, MailIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "ok" | "error";

/**
 * Suscripción al boletín casi al final del home: datos de contacto a cambio
 * del descuento de bienvenida, para nutrir la base de datos de Actimax.
 */
export function NewsletterSection() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setMessage("");

    const apodo = (new FormData(event.currentTarget).get("apodo") as string) ?? "";
    try {
      /* Barra final: el sitio fuerza trailing slash y así evitamos el 308. */
      const response = await fetch("/api/newsletter/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nombre, apodo }),
      });
      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || data.ok !== true) {
        setStatus("error");
        setMessage(data.error ?? "No pudimos registrar tu correo. Inténtalo de nuevo.");
        trackSubscription("error");
        return;
      }
      setStatus("ok");
      trackSubscription("ok");
    } catch {
      setStatus("error");
      setMessage("No pudimos registrar tu correo. Revisa tu conexión e inténtalo de nuevo.");
      trackSubscription("conexion");
    }
  }

  /* La suscripción termina en la misma URL, así que ningún pageview la ve.
     Una sola propiedad alcanza: separar el éxito del fallo es lo único que
     cambia una decisión, porque un pico de "error" significa que el endpoint
     dejó de responder y nadie más se va a enterar. */
  function trackSubscription(resultado: string) {
    track("newsletter_suscripcion", { resultado });
  }

  return (
    <section id="suscribete" className="scroll-mt-28 bg-azul text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <div className="reveal">
          <p className="section-kicker section-kicker-dark">06 · Suscríbete</p>
          <h2 className="mt-4 max-w-2xl font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-6xl lg:text-7xl">
            Únete a la comunidad
            <span className="block text-amarillo">que entrena para llegar más lejos.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/70">
            Suscríbete al blog de Actimax: estrategia de nutrición, planes por
            distancia y un descuento de bienvenida para tu primera compra.
          </p>
        </div>

        <div className="reveal">
          {status === "ok" ? (
            <div
              role="status"
              className="flex items-start gap-3 border border-amarillo/40 bg-white/5 p-6"
            >
              <CheckCircle2Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-amarillo" />
              <div>
                <p className="font-display text-2xl font-bold uppercase italic">
                  ¡Ya estás en el lote!
                </p>
                <p className="mt-1 text-sm leading-relaxed text-white/70">
                  Pronto recibirás tu descuento de bienvenida y lo mejor del
                  blog en tu correo.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={subscribe} className="flex flex-col gap-3">
              {/* Honeypot: invisible para personas, irresistible para bots. */}
              <input
                type="text"
                name="apodo"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />
              <label className="sr-only" htmlFor="newsletter-nombre">
                Nombre
              </label>
              <input
                id="newsletter-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre (opcional)"
                autoComplete="given-name"
                className="h-12 border border-white/25 bg-white/8 px-4 text-sm text-white placeholder:text-white/45 focus:border-amarillo focus:outline-none"
              />
              <label className="sr-only" htmlFor="newsletter-email">
                Correo electrónico
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MailIcon
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45"
                  />
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                    className="h-12 w-full border border-white/25 bg-white/8 pl-11 pr-4 text-sm text-white placeholder:text-white/45 focus:border-amarillo focus:outline-none"
                  />
                </div>
                <Button
                  type="submit"
                  variant="raceSun"
                  disabled={status === "loading"}
                  className="h-12 shrink-0 px-6"
                >
                  {status === "loading" ? "Enviando…" : "Quiero mi descuento"}
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </div>
              {status === "error" ? (
                <p role="alert" className="text-sm font-medium text-amarillo">
                  {message}
                </p>
              ) : null}
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                Cero spam · Solo contenido útil · Cancelas cuando quieras
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
