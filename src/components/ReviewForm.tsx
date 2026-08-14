"use client";

import { track } from "@vercel/analytics";
import { CheckCircle2Icon, StarIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "loading" | "ok" | "error";

export function ReviewForm({
  productHandle,
  productTitle,
}: {
  productHandle: string;
  productTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  function openForm() {
    setRating(0);
    setStatus("idle");
    setMessage("");
    setOpen(true);
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/resenas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: productHandle,
          nombre: formData.get("nombre"),
          email: formData.get("email"),
          rating: Number(formData.get("rating")),
          texto: formData.get("texto"),
          sitioWeb: formData.get("sitioWeb"),
        }),
      });
      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || data.ok !== true) {
        setStatus("error");
        setMessage(data.error ?? "No pudimos guardar tu reseña. Inténtalo nuevamente.");
        return;
      }

      /* Judge.me modera antes de publicar, así que la tienda no sabe qué se
         envió ni con qué nota hasta que aparece días después. Esto adelanta
         la distribución real y avisa temprano si un producto empieza a
         recibir reseñas malas. */
      track("resena_enviada", {
        producto: productHandle,
        estrellas: Number(formData.get("rating")),
      });

      form.reset();
      setRating(0);
      setStatus("ok");
    } catch {
      setStatus("error");
      setMessage("No pudimos guardar tu reseña. Revisa tu conexión e inténtalo nuevamente.");
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="race" className="h-11 px-5" onClick={openForm}>
        Escribir una reseña
      </Button>
    );
  }

  return (
    <div className="w-full basis-full border border-tinta/15 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xl font-extrabold uppercase italic">Tu experiencia</p>
          <p className="mt-1 text-sm text-tinta/60">{productTitle}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar formulario"
          onClick={() => setOpen(false)}
        >
          <XIcon />
        </Button>
      </div>

      {status === "ok" ? (
        <div role="status" className="mt-5 flex items-start gap-3 border border-azul/20 bg-azul/5 p-4">
          <CheckCircle2Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-azul" />
          <div>
            <p className="font-bold">Gracias por compartir tu experiencia.</p>
            <p className="mt-1 text-sm leading-relaxed text-tinta/65">
              Recibimos tu reseña. Aparecerá aquí después de la moderación.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submitReview} className="mt-5 grid gap-4">
          <input
            type="text"
            name="sitioWeb"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <fieldset>
            <legend className="text-sm font-bold">Calificación</legend>
            <div className="mt-2 flex w-fit gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="cursor-pointer p-1">
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    required
                    className="sr-only"
                    onChange={() => setRating(star)}
                  />
                  <StarIcon
                    aria-hidden
                    className={
                      star <= rating
                        ? "size-7 fill-current text-amarillo"
                      : "size-7 text-tinta/20 transition-colors hover:text-amarillo"
                    }
                  />
                  <span className="sr-only">
                    {star} {star === 1 ? "estrella" : "estrellas"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="review-nombre" className="text-sm font-bold">
                Nombre
              </label>
              <Input
                id="review-nombre"
                name="nombre"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                className="mt-2 h-11 rounded-sm"
              />
            </div>
            <div>
              <label htmlFor="review-email" className="text-sm font-bold">
                Correo electrónico
              </label>
              <Input
                id="review-email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                className="mt-2 h-11 rounded-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="review-texto" className="text-sm font-bold">
              Reseña
            </label>
            <Textarea
              id="review-texto"
              name="texto"
              required
              minLength={5}
              maxLength={5000}
              rows={5}
              className="mt-2 min-h-28 rounded-sm"
              placeholder="¿Cómo te fue usando este producto?"
            />
          </div>

          {status === "error" ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {message}
            </p>
          ) : null}

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-tinta/50">
              Tu correo no se publica. Judge.me lo usa para administrar la reseña.
            </p>
            <Button type="submit" variant="race" className="h-11 px-5" disabled={status === "loading"}>
              {status === "loading" ? "Enviando..." : "Publicar reseña"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
