"use client";

import { validarSuscripcion } from "@/lib/newsletter";
import { track } from "@/lib/track";
import { ArrowRightIcon, CheckCircle2Icon, CheckIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "ok" | "error";

/* Un solo alto y un solo borde para todos los campos: el formulario vive
   sobre el azul de marca y cualquier variación se nota. */
const CAMPO =
  "h-12 border border-white/25 bg-white/8 text-base text-white placeholder:text-white/45 focus:border-amarillo focus:outline-none";

/**
 * Formulario del boletín. Va sobre fondo azul en todas partes —el home y el
 * final de cada artículo—, así que los estilos son los mismos y lo único que
 * cambia es `origen`, la propiedad que dice desde qué parte del sitio llegó
 * la suscripción.
 *
 * Nombre y correo son obligatorios (sin ellos no se sabe a quién se le
 * escribe) y la casilla de tratamiento de datos es la autorización que pide
 * la ley colombiana. El cumpleaños se queda opcional a propósito: alimenta
 * la campaña de regalo sin cobrarle un campo más a quien solo quiere el
 * descuento.
 */
export function NewsletterForm({ origen }: { origen: string }) {
  const idBase = useId();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [nacimiento, setNacimiento] = useState({ dia: "", mes: "", anio: "" });
  const [acepta, setAcepta] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function escribirFecha(campo: "dia" | "mes" | "anio", valor: string) {
    setNacimiento((actual) => ({ ...actual, [campo]: valor.replace(/\D/g, "") }));
  }

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const apodo = (new FormData(event.currentTarget).get("apodo") as string) ?? "";
    const cuerpo = { email, nombre, nacimiento, acepta, apodo };

    /* Las mismas reglas de la ruta, acá para responder al instante: el
       navegador ya exige los campos, pero no sabe que el 31 de febrero no
       existe. */
    const validacion = validarSuscripcion(cuerpo);
    if (!validacion.ok) {
      setStatus("error");
      setMessage(validacion.error);
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      /* Barra final: el sitio fuerza trailing slash y así evitamos el 308. */
      const response = await fetch("/api/newsletter/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
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
     Dos propiedades: `resultado` porque un pico de "error" significa que el
     endpoint dejó de responder y nadie más se va a enterar, y `origen`
     porque es lo único que dice si poner el formulario en el blog sirvió. */
  function trackSubscription(resultado: string) {
    track("newsletter_suscripcion", { resultado, origen });
  }

  if (status === "ok") {
    return (
      <div role="status" className="flex items-start gap-3 border border-amarillo/40 bg-white/5 p-6">
        <CheckCircle2Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-amarillo" />
        <div>
          <p className="font-display text-2xl font-bold uppercase italic">
            ¡Ya estás en el lote!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/70">
            Pronto recibirás tu descuento de bienvenida y lo mejor del blog en
            tu correo.
          </p>
        </div>
      </div>
    );
  }

  return (
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
      <label className="sr-only" htmlFor={`${idBase}-nombre`}>
        Nombre
      </label>
      <input
        id={`${idBase}-nombre`}
        type="text"
        required
        minLength={2}
        maxLength={80}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Tu nombre"
        autoComplete="name"
        className={`${CAMPO} px-4`}
      />
      <label className="sr-only" htmlFor={`${idBase}-email`}>
        Correo electrónico
      </label>
      <div className="relative">
        <MailIcon
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45"
        />
        <input
          id={`${idBase}-email`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          className={`${CAMPO} w-full pl-11 pr-4`}
        />
      </div>

      <fieldset className="mt-1">
        <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
          Cumpleaños · opcional, para tu regalo
        </legend>
        <div className="mt-2 flex items-center gap-2">
          <input
            aria-label="Día de nacimiento"
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={nacimiento.dia}
            onChange={(e) => escribirFecha("dia", e.target.value)}
            placeholder="DD"
            autoComplete="bday-day"
            className={`${CAMPO} w-16 px-2 text-center`}
          />
          <span aria-hidden className="text-white/30">
            /
          </span>
          <input
            aria-label="Mes de nacimiento"
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={nacimiento.mes}
            onChange={(e) => escribirFecha("mes", e.target.value)}
            placeholder="MM"
            autoComplete="bday-month"
            className={`${CAMPO} w-16 px-2 text-center`}
          />
          <span aria-hidden className="text-white/30">
            /
          </span>
          <input
            aria-label="Año de nacimiento"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={nacimiento.anio}
            onChange={(e) => escribirFecha("anio", e.target.value)}
            placeholder="AAAA"
            autoComplete="bday-year"
            className={`${CAMPO} w-24 px-2 text-center`}
          />
        </div>
      </fieldset>

      <label className="mt-1 flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-white/60">
        <span className="relative mt-0.5 grid size-[18px] shrink-0 place-items-center">
          <input
            type="checkbox"
            required
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="peer size-full cursor-pointer appearance-none border border-white/35 bg-white/8 checked:border-amarillo checked:bg-amarillo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amarillo"
          />
          <CheckIcon
            aria-hidden
            className="pointer-events-none absolute size-3 stroke-[3.5] text-azul opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span>
          Acepto la{" "}
          <Link
            href="/politicas-devolucion-privacidad/#privacidad"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white/85 underline underline-offset-2 hover:text-amarillo"
          >
            política de tratamiento de datos
            <span className="sr-only"> (se abre en una pestaña nueva)</span>
          </Link>
          .
        </span>
      </label>

      {status === "error" ? (
        <p role="alert" className="text-sm font-medium text-amarillo">
          {message}
        </p>
      ) : null}
      <Button
        type="submit"
        variant="raceSun"
        disabled={status === "loading"}
        className="mt-1 h-12 w-full"
      >
        {status === "loading" ? "Enviando…" : "Quiero mi descuento"}
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
        Cero spam · Solo contenido útil · Cancelas cuando quieras
      </p>
    </form>
  );
}
