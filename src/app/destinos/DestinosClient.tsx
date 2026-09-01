"use client";

import styles from "./destinos.module.css";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, MouseEvent, SVGProps } from "react";
import type { Tour } from "./data";
import type {
  StudioData,
  StudioEntry,
  StudioValues,
} from "./types";
import type { GoogleReviewsState } from "./types";


const DEFAULT_WHATSAPP_URL =
  "https://wa.me/34660257833?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20Destinos%20Actimax%20%C3%97%20WOPU%20Travel";

type PreviewTour = Tour & {
  featured: boolean;
  cardFocalX: number;
  cardFocalY: number;
  modalFocalX: number;
  modalFocalY: number;
};

function LineIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: "plane" | "bed" | "ticket" | "people" | "globe" | "mail";
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {name === "plane" ? (
        <>
          <path d="M22 2 9 15" />
          <path d="m22 2-7 20-4-9-9-4Z" />
        </>
      ) : null}
      {name === "bed" ? (
        <>
          <path d="M2 20v-8h20v8" />
          <path d="M4 12V6h7a3 3 0 0 1 3 3v3" />
          <path d="M2 17h20" />
        </>
      ) : null}
      {name === "ticket" ? (
        <>
          <path d="M2 9a3 3 0 0 0 0 6v4h20v-4a3 3 0 0 0 0-6V5H2Z" />
          <path d="M13 5v2M13 11v2M13 17v2" />
        </>
      ) : null}
      {name === "people" ? (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ) : null}
      {name === "globe" ? (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
        </>
      ) : null}
      {name === "mail" ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      ) : null}
    </svg>
  );
}

const PlaneIcon = (props: SVGProps<SVGSVGElement>) => (
  <LineIcon {...props} name="plane" />
);
const BedDoubleIcon = (props: SVGProps<SVGSVGElement>) => (
  <LineIcon {...props} name="bed" />
);
const TicketCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <LineIcon {...props} name="ticket" />
);
const UsersRoundIcon = (props: SVGProps<SVGSVGElement>) => (
  <LineIcon {...props} name="people" />
);
const Globe2Icon = (props: SVGProps<SVGSVGElement>) => (
  <LineIcon {...props} name="globe" />
);
const MailIcon = (props: SVGProps<SVGSVGElement>) => (
  <LineIcon {...props} name="mail" />
);

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.45L3.5 20.5l1.4-4.25A8.5 8.5 0 1 1 20.5 11.7Z" />
      <path d="M8.3 7.7c.25-.5.5-.5.8-.5h.5l1 2.2c.1.3 0 .55-.2.8l-.65.75c.8 1.55 1.75 2.5 3.35 3.3l.75-.7c.25-.2.5-.25.8-.1l2.1 1c.3.15.35.4.3.7-.2 1.2-1.2 1.85-2.4 1.85-3.4 0-7.8-4.15-7.8-7.65 0-.65.35-1.25.95-1.65Z" />
    </svg>
  );
}

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className={styles.imagePlaceholder}
      aria-label={`Placeholder: ${label}`}
    >
      <span>IMAGEN</span>
      <small>{label}</small>
    </div>
  );
}

function TourImage({
  src,
  alt,
  sizes,
  focalX = 50,
  focalY = 50,
}: {
  src: string;
  alt: string;
  sizes: string;
  focalX?: number;
  focalY?: number;
}) {
  if (!src) return <ImagePlaceholder label="REEMPLAZAR DESPUÉS" />;

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={styles.coverImage}
      style={{ objectPosition: `${focalX}% ${focalY}%` }}
    />
  );
}

type ExchangeRateState =
  | { status: "loading" }
  | {
      status: "ready";
      eurCop: number;
      ecbDate: string;
      trmDate: string;
    }
  | { status: "error" };

function ExchangeRateCard() {
  const [rate, setRate] = useState<ExchangeRateState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadRate() {
      try {
        const response = await fetch("/api/destinos/exchange-rate", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Exchange rate unavailable");

        const data = (await response.json()) as {
          ok?: boolean;
          eurCop?: number;
          ecbDate?: string;
          trmDate?: string;
        };

        if (!data.ok || !data.eurCop || !data.ecbDate || !data.trmDate) {
          throw new Error("Invalid exchange-rate response");
        }

        if (active) {
          setRate({
            status: "ready",
            eurCop: data.eurCop,
            ecbDate: data.ecbDate,
            trmDate: data.trmDate,
          });
        }
      } catch {
        if (active) setRate({ status: "error" });
      }
    }

    loadRate();
    return () => {
      active = false;
    };
  }, []);

  return (
    <aside className={styles.exchangeCard} aria-live="polite">
      <p className={styles.exchangeLabel}>EUR → COP · REFERENCIA</p>

      {rate.status === "loading" && (
        <>
          <strong className={styles.exchangeValue}>Actualizando…</strong>
          <span className={styles.exchangeMeta}>Fuentes oficiales</span>
        </>
      )}

      {rate.status === "error" && (
        <>
          <strong className={styles.exchangeValue}>No disponible</strong>
          <span className={styles.exchangeMeta}>
            Vuelve a consultar en unos minutos
          </span>
        </>
      )}

      {rate.status === "ready" && (
        <>
          <strong className={styles.exchangeValue}>
            1 EUR ≈{" "}
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(rate.eurCop)}
          </strong>
          <span className={styles.exchangeMeta}>
            BCE {rate.ecbDate} · TRM {rate.trmDate}
          </span>
        </>
      )}

      <div className={styles.exchangeSources}>
        <a
          href="https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          BCE
        </a>
        <span>+</span>
        <a
          href="https://www.datos.gov.co/Econom-a-y-Finanzas/Tasa-de-Cambio-Representativa-del-Mercado-Historic/mcec-87by"
          target="_blank"
          rel="noopener noreferrer"
        >
          TRM Colombia
        </a>
      </div>

      <small>
        Referencia informativa. No corresponde a una tasa garantizada de compra
        o venta.
      </small>
    </aside>
  );
}

function TourCard({
  tour,
  onOpen,
}: {
  tour: PreviewTour;
  onOpen: (tour: PreviewTour, trigger: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${tour.soldOut ? styles.soldOutCard : ""}`}
      onClick={(event) => onOpen(tour, event.currentTarget)}
      aria-label={`Ver detalles de ${tour.title}`}
    >
      <div className={styles.cardImage}>
        <TourImage
          src={tour.cardImage}
          alt={tour.imageAlt}
          sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
          focalX={tour.cardFocalX}
          focalY={tour.cardFocalY}
        />
        <div className={styles.imageShade} />
        <span
          className={`${styles.chip} ${
            tour.type === "maraton" ? styles.chipMaraton : styles.chipCiclismo
          }`}
        >
          {tour.tag}
        </span>
        {tour.soldOut && <span className={styles.soldOut}>AGOTADO</span>}
        {tour.featured && <span className={styles.featured}>DESTACADA</span>}
        <div className={styles.cardMetric}>
          <strong>{tour.metric}</strong>
          <span>{tour.metricLabel}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3>{tour.title}</h3>
        <p className={styles.region}>{tour.region}</p>
        <div className={styles.cardMeta}>
          <span>
            <b>{tour.dates}</b>
            <small>{tour.days}</small>
          </span>
          <span className={styles.price}>
            <small>PRECIO ESTIMADO</small>
            <b>€ {tour.price}</b>
          </span>
        </div>
        <div className={styles.cardOpen}>
          Ver experiencia <span aria-hidden>→</span>
        </div>
      </div>
    </button>
  );
}

function TourModal({
  tour,
  onClose,
  onSelect,
  whatsappUrl,
}: {
  tour: PreviewTour | null;
  onClose: () => void;
  onSelect: (tour: PreviewTour) => void;
  whatsappUrl: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tour) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeButton =
      dialogRef.current?.querySelector<HTMLButtonElement>("[data-modal-close]");
    closeButton?.focus();

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [tour, onClose]);

  if (!tour) return null;

  return (
    <div
      className={styles.modalBack}
      role="presentation"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="destinos-modal-title"
      >
        <button
          data-modal-close
          type="button"
          className={styles.modalClose}
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          ×
        </button>

        <div className={styles.modalHero}>
          <TourImage
            src={tour.modalImage || tour.cardImage}
            alt={tour.imageAlt}
            sizes="(max-width: 760px) 100vw, 900px"
            focalX={tour.modalFocalX}
            focalY={tour.modalFocalY}
          />
          <div className={styles.modalShade} />
          <div className={styles.modalHeroText}>
            <span
              className={`${styles.chip} ${
                tour.type === "maraton"
                  ? styles.chipMaraton
                  : styles.chipCiclismo
              }`}
            >
              {tour.tag}
            </span>
            {tour.soldOut && (
              <span className={styles.soldOutModal}>AGOTADO</span>
            )}
            <h2 id="destinos-modal-title">{tour.title}</h2>
            <p>{tour.sub}</p>
          </div>
        </div>

        <div className={styles.modalContent}>
          {tour.route && (
            <div className={styles.route}>
              <span>RUTA</span>
              <p>{tour.route}</p>
            </div>
          )}

          <p className={styles.modalDescription}>{tour.desc}</p>

          <div className={styles.modalFacts}>
            <div>
              <span>FECHAS</span>
              <b>{tour.dates}</b>
            </div>
            <div>
              <span>DURACIÓN</span>
              <b>{tour.days}</b>
            </div>
            <div>
              <span>ALOJAMIENTO</span>
              <b>{tour.nights}</b>
            </div>
            <div>
              <span>CUPO</span>
              <b>{tour.cupo}</b>
            </div>
            <div>
              <span>RESERVA HASTA</span>
              <b>{tour.deadline}</b>
            </div>
            <div>
              <span>DESDE</span>
              <b>€ {tour.price}</b>
            </div>
          </div>

          <div className={styles.highlights}>
            <p className={styles.eyebrow}>Lo más destacado</p>
            <ul>
              {tour.highlights.map((highlight) => (
                <li key={highlight}>
                  <span aria-hidden>✓</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={tour.soldOut}
              onClick={() => onSelect(tour)}
            >
              {tour.soldOut ? "Experiencia agotada" : "Quiero más información"}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryDarkButton}
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function InterestForm({
  selectedExperience,
  onExperienceChange,
  tours,
  values,
}: {
  selectedExperience: string;
  onExperienceChange: (value: string) => void;
  tours: PreviewTour[];
  values: StudioValues;
}) {
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      experience: String(data.get("experience") || "").trim(),
      consent: data.get("consent") === "on",
      website: String(data.get("website") || "").trim(),
      startedAt: startedAtRef.current,
    };

    try {
      const response = await fetch("/api/destinos/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message || "No fue posible enviar el formulario.",
        );
      }

      setStatus("success");
      setMessage(
        String(
          values.success_message ??
            "Gracias. Recibimos tu preinscripción y el equipo de WOPU Travel te contactará.",
        ),
      );
      form.reset();
      onExperienceChange("");
      startedAtRef.current = Date.now();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : String(
              values.error_message ??
                "No fue posible enviar el formulario. Inténtalo de nuevo.",
            ),
      );
    }
  }

  return (
    <form className={styles.formBox} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label>
          <span>Nombre completo</span>
          <input name="name" type="text" placeholder="Tu nombre" required />
        </label>

        <label>
          <span>Correo electrónico</span>
          <input
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            required
          />
        </label>

        <label>
          <span>Teléfono / WhatsApp</span>
          <input
            name="phone"
            type="tel"
            placeholder="+57..."
            autoComplete="tel"
            required
          />
        </label>

        <label>
          <span>Experiencia de interés</span>
          <select
            name="experience"
            required
            value={selectedExperience}
            onChange={(event) => onExperienceChange(event.target.value)}
          >
            <option value="">Selecciona una experiencia</option>
            {tours.map((tour) => (
              <option key={tour.id} value={tour.title} disabled={tour.soldOut}>
                {tour.title}
                {tour.soldOut ? " — AGOTADO" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={styles.consent}>
        <input name="consent" type="checkbox" required />
        <span>
          {String(
            values.consent_text ??
              "Acepto que WOPU Travel use estos datos para responder a mi solicitud sobre Destinos Actimax × WOPU Travel.",
          )}
        </span>
      </label>

      <label className={styles.honeypot} aria-hidden="true">
        Sitio web
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <button
        type="submit"
        className={styles.primaryButton}
        disabled={status === "sending"}
      >
        {status === "sending"
          ? "Enviando..."
          : String(values.cta_label ?? "Quiero más información")}
      </button>

      {message && (
        <p
          className={`${styles.formMessage} ${
            status === "success" ? styles.formSuccess : styles.formError
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}

function asConfig(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function itemList(value: unknown) {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
    : [];
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function previewTour(entry: StudioEntry): PreviewTour {
  const value = entry.values;
  return {
    id: entry.handle,
    type: value.activity_type === "ciclismo" ? "ciclismo" : "maraton",
    tag: String(value.tag ?? "EXPERIENCIA"),
    metric: String(value.metric ?? ""),
    metricLabel: String(value.metric_label ?? ""),
    cardImage: entry.media.card_image ?? "",
    modalImage: entry.media.modal_image ?? "",
    imageAlt: String(
      value.card_image_alt ?? value.modal_image_alt ?? value.title ?? "",
    ),
    title: String(value.title ?? ""),
    region: String(value.region ?? ""),
    sub: String(value.subtitle ?? value.region ?? ""),
    route: String(value.route ?? "") || undefined,
    dates: String(value.dates ?? ""),
    days: String(value.days ?? ""),
    deadline: String(value.deadline ?? ""),
    cupo: String(value.capacity ?? ""),
    nights: String(value.nights ?? ""),
    price: new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(
      Number(value.estimated_price ?? 0),
    ),
    desc: String(value.modal_description ?? value.card_summary ?? ""),
    highlights: stringList(value.highlights),
    soldOut: value.sold_out === true,
    featured: value.featured === true,
    cardFocalX: Number(value.card_focal_x ?? 50),
    cardFocalY: Number(value.card_focal_y ?? 50),
    modalFocalX: Number(value.modal_focal_x ?? 50),
    modalFocalY: Number(value.modal_focal_y ?? 50),
  };
}

function ReviewStars({ rating }: { rating: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={styles.stars} aria-label={`${rating} de 5 estrellas`}>
      <span aria-hidden="true">
        {"★".repeat(rounded)}
        {"☆".repeat(5 - rounded)}
      </span>
    </span>
  );
}

function TrustindexReviewsBlock({
  widgetId,
  profileUrl,
}: {
  widgetId: string;
  profileUrl: string;
}) {
  const widgetHostRef = useRef<HTMLDivElement | null>(null);
  const normalizedWidgetId = widgetId.trim();

  useEffect(() => {
    const widgetHost = widgetHostRef.current;
    if (!widgetHost || !normalizedWidgetId) return;

    const script = document.createElement("script");
    script.src = `https://cdn.trustindex.io/loader.js?${encodeURIComponent(normalizedWidgetId)}`;
    script.async = true;
    script.defer = true;
    widgetHost.replaceChildren(script);

    return () => widgetHost.replaceChildren();
  }, [normalizedWidgetId]);

  if (!normalizedWidgetId) {
    return (
      <div className={styles.reviewsUnavailable} role="status">
        <p>Falta guardar el Widget ID generado por Trustindex.</p>
        {profileUrl ? (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">
            Ver opiniones en Google Maps
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.trustindexWidget}>
      <div ref={widgetHostRef} aria-live="polite">
        <p className={styles.trustindexLoading}>Cargando opiniones reales…</p>
      </div>
      <noscript>
        {profileUrl ? (
          <a href={profileUrl}>Ver opiniones en Google Maps</a>
        ) : (
          "Active JavaScript para consultar las opiniones."
        )}
      </noscript>
    </div>
  );
}

function GoogleReviewsBlock({
  state,
  profileUrl,
  layout,
}: {
  state: GoogleReviewsState | null;
  profileUrl: string;
  layout: string;
}) {
  if (!state || state.status === "unavailable") {
    const publicUrl =
      state?.status === "unavailable" ? state.profileUrl : profileUrl;
    return (
      <div className={styles.reviewsUnavailable} role="status">
        <p>Las reseñas de Google no están disponibles temporalmente.</p>
        {publicUrl ? (
          <a href={publicUrl} target="_blank" rel="noopener noreferrer">
            Ver opiniones en Google Maps
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.reviewsContent} data-layout={layout}>
      <div className={styles.reviewsSummary}>
        <div>
          <strong>
            {state.rating.toLocaleString("es-ES", {
              maximumFractionDigits: 1,
            })}
          </strong>
          <ReviewStars rating={state.rating} />
          <span>{state.userRatingCount} opiniones</span>
        </div>
        <a
          href={state.googleMapsUri || profileUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver perfil en <b>Google Maps</b>
        </a>
      </div>

      {state.reviews.length ? (
        <div className={styles.reviewsGrid}>
          {state.reviews.map((review) => (
            <article key={review.id} className={styles.reviewCard}>
              <header className={styles.reviewAuthor}>
                {review.authorPhotoUri ? (
                  <img
                    src={review.authorPhotoUri}
                    alt=""
                    width={44}
                    height={44}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className={styles.reviewAvatar} aria-hidden="true">
                    {review.authorName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  {review.authorUri ? (
                    <a
                      href={review.authorUri}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {review.authorName}
                    </a>
                  ) : (
                    <strong>{review.authorName}</strong>
                  )}
                  <span>{review.relativePublishTime || review.visitDate}</span>
                </div>
              </header>
              <ReviewStars rating={review.rating} />
              <blockquote>{review.text}</blockquote>
              <footer className={styles.reviewFooter}>
                {review.translated ? (
                  <span>Traducida por Google</span>
                ) : (
                  <span />
                )}
                {review.googleMapsUri ? (
                  <a
                    href={review.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver reseña
                  </a>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.reviewsEmpty}>
          No hay reseñas con texto que cumplan el filtro seleccionado.
        </p>
      )}

      <p className={styles.reviewsDisclosure}>
        Reseñas de Google Maps ordenadas por relevancia. Se muestran reseñas con
        texto y {state.minimumRating} estrellas o más. Consulte las{" "}
        <a
          href="https://support.google.com/contributionpolicy/answer/7400114"
          target="_blank"
          rel="noopener noreferrer"
        >
          políticas de contenido de Google
        </a>
        .
      </p>
    </div>
  );
}

export function DestinosPreview({
  data,
  googleReviews = null,
}: {
  data: StudioData;
  googleReviews?: GoogleReviewsState | null;
}) {
  const [activeTour, setActiveTour] = useState<PreviewTour | null>(null);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const settings = data.settings.values;
  const hero = data.hero.values;
  const reviewsProvider = String(
    data.reviews.values.provider ?? "disabled",
  );
  const sections = new Map(
    data.sections.map((entry) => [String(entry.values.section_type), entry]),
  );
  const section = (type: string) => sections.get(type);
  const visible = (type: string) => section(type)?.values.enabled !== false;
  const order = (type: string) => Number(section(type)?.values.sort_order ?? 0);
  const config = (type: string) =>
    asConfig(section(type)?.values.content_config);
  const tours = [...data.experiences]
    .sort(
      (a, b) =>
        Number(a.values.sort_order ?? 0) - Number(b.values.sort_order ?? 0),
    )
    .map(previewTour);
  const faqs = [...data.faqs]
    .filter((entry) => entry.values.enabled !== false)
    .sort(
      (a, b) =>
        Number(a.values.sort_order ?? 0) - Number(b.values.sort_order ?? 0),
    );
  const whatsappUrl = String(
    settings.whatsapp_url ?? hero.secondary_cta_url ?? DEFAULT_WHATSAPP_URL,
  );
  const actimaxLogo =
    data.settings.media.actimax_logo_light ||
    "/destinos/brands/actimax-white.svg";
  const wopuLogo =
    data.settings.media.wopu_logo_light || "/destinos/brands/wopu-white.svg";
  const collaboration = config("collaboration");
  const collaborationRoles = itemList(collaboration.roles);
  const includesItems = itemList(config("includes").items);
  const whyItems = itemList(config("why").items);
  const wopu = config("wopu");
  const footer = config("footer");
  const sectionStyle = (type: string): CSSProperties => {
    const entry = section(type);
    const values = entry?.values;
    const result: CSSProperties = { order: order(type) };
    if (values?.background_mode === "solid" && values.background_color) {
      result.background = String(values.background_color);
    }
    if (values?.background_mode === "image" && entry?.media.background_image) {
      result.backgroundImage = `url(${entry.media.background_image})`;
      result.backgroundPosition = "center";
      result.backgroundSize = "cover";
    }
    return result;
  };


  function openTour(tour: PreviewTour, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setActiveTour(tour);
  }

  function closeTour() {
    setActiveTour(null);
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  }

  function selectTour(tour: PreviewTour) {
    setSelectedExperience(tour.title);
    setActiveTour(null);
    window.setTimeout(() => {
      document
        .getElementById("registro")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
  }

  return (
    <>
      <div
        className={styles.page}
        data-destinos-page
        style={
          {
            "--navy": String(settings.primary_color ?? "#1e3c7b"),
            "--sol": String(settings.accent_color ?? "#f5b700"),
            "--rio": String(settings.river_color ?? "#2f5d94"),
            "--paper": String(settings.surface_color ?? "#fbfaf6"),
          } as CSSProperties
        }
      >
        {visible("hero") && hero.enabled !== false ? (
          <section
            className={styles.hero}
            style={{
              order: order("hero"),
              ...(data.hero.media.background_image
                ? {
                    backgroundImage: `linear-gradient(rgba(22,48,95,${Number(hero.overlay_opacity ?? 0.2)}), rgba(22,48,95,${Number(hero.overlay_opacity ?? 0.2)})), url(${data.hero.media.background_image})`,
                    backgroundPosition: `${Number(hero.focal_x ?? 50)}% ${Number(hero.focal_y ?? 50)}%`,
                    backgroundSize: "cover",
                  }
                : {}),
            }}
          >
            <div className={styles.heroGlow} aria-hidden />
            <svg
              className={styles.contour}
              viewBox="0 0 1400 700"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M0,520 C220,470 360,600 560,540 C760,480 900,600 1120,540 C1260,505 1340,560 1400,540" />
              <path d="M0,440 C240,400 380,510 580,450 C800,390 940,500 1160,450 C1290,420 1360,460 1400,450" />
              <path d="M0,360 C260,330 400,420 600,370 C820,315 960,410 1180,360 C1300,335 1360,370 1400,362" />
            </svg>

            <div className={styles.wrap}>
              <p className={`${styles.eyebrow} ${styles.heroEyebrow}`}>
                {String(
                  hero.eyebrow ??
                    "Destinos Actimax × WOPU Travel · Europa 2027",
                )}
              </p>
              <h1>
                {String(hero.title_primary ?? "Límites por")}{" "}
                <span>{String(hero.title_accent ?? "descubrir")}</span>
              </h1>
              <p className={styles.heroLead}>
                {String(hero.description ?? "")}
              </p>

              <div className={styles.heroActionCluster}>
                <div className={styles.heroCta}>
                  <a
                    href={String(hero.primary_cta_target ?? "#experiencias")}
                    className={styles.primaryButton}
                  >
                    {String(hero.primary_cta_label ?? "Ver experiencias")}
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ghostButton}
                  >
                    <WhatsAppIcon className={styles.inlineIcon} />
                    {String(
                      hero.secondary_cta_label ?? "Escríbenos por WhatsApp",
                    )}
                  </a>
                </div>

                {hero.brand_lockup_enabled !== false ? (
                  <div
                    className={styles.lockup}
                    aria-label="Actimax y WOPU Travel"
                  >
                    <img
                      src={actimaxLogo}
                      alt="Actimax"
                      width={829}
                      height={188}
                      className={styles.brandActimax}
                    />
                    <span className={styles.brandTimes} aria-hidden>
                      ×
                    </span>
                    <img
                      src={wopuLogo}
                      alt="WOPU Travel"
                      width={800}
                      height={800}
                      className={styles.brandWopu}
                    />
                    <small>
                      {String(
                        hero.brand_lockup_caption ?? "RENDIMIENTO\n+ OPERACIÓN",
                      )
                        .split("\n")
                        .map((line, index) => (
                          <span key={line}>
                            {index ? <br /> : null}
                            {line}
                          </span>
                        ))}
                    </small>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {visible("collaboration") ? (
          <section
            className={`${styles.section} ${styles.intro}`}
            style={sectionStyle("collaboration")}
          >
            <div className={styles.wrap}>
              <p className={styles.eyebrow}>
                {String(
                  section("collaboration")?.values.eyebrow ?? "La colaboración",
                )}
              </p>
              <h2>{String(section("collaboration")?.values.heading ?? "")}</h2>
              <p className={styles.lede}>
                {String(
                  collaboration.body ??
                    section("collaboration")?.values.intro ??
                    "",
                )}
              </p>

              <div className={styles.roles}>
                {collaborationRoles.map((role, index) => (
                  <article
                    key={String(role.title ?? index)}
                    className={`${styles.role} ${index === 1 ? styles.roleWopu : ""}`}
                  >
                    <p className={styles.roleTag}>{String(role.tag ?? "")}</p>
                    <h3>{String(role.title ?? "")}</h3>
                    <p>{String(role.copy ?? "")}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {visible("includes") ? (
          <section
            className={`${styles.section} ${styles.includes}`}
            id="incluye"
            style={sectionStyle("includes")}
          >
            <div className={styles.wrap}>
              <p className={`${styles.eyebrow} ${styles.lightEyebrow}`}>
                {String(
                  section("includes")?.values.eyebrow ??
                    "Qué incluye cada viaje",
                )}
              </p>
              <h2>{String(section("includes")?.values.heading ?? "")}</h2>

              <div className={styles.includesGrid}>
                {includesItems.map((item, index) => {
                  const Icon =
                    [PlaneIcon, BedDoubleIcon, TicketCheckIcon, UsersRoundIcon][
                      index
                    ] ?? UsersRoundIcon;
                  return (
                    <article
                      key={String(item.title ?? index)}
                      className={styles.includeItem}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div className={styles.includeIcon} aria-hidden>
                        <Icon />
                      </div>
                      <h3>{String(item.title ?? "")}</h3>
                      <p>{String(item.copy ?? "")}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {visible("experiences") ? (
          <section
            className={`${styles.section} ${styles.experiences}`}
            id="experiencias"
            style={sectionStyle("experiences")}
          >
            <div className={styles.wrap}>
              <div className={styles.expHead}>
                <div className={styles.expHeadingCopy}>
                  <p className={styles.eyebrow}>
                    {String(
                      section("experiences")?.values.eyebrow ??
                        "Destinos · Temporada 2027",
                    )}
                  </p>
                  <h2>
                    {String(
                      section("experiences")?.values.heading ??
                        "Elige tu próximo destino",
                    )}
                  </h2>
                  <p className={styles.expIntro}>
                    {String(config("experiences").helper ?? "")}
                  </p>
                </div>
                {settings.exchange_rate_enabled !== false ? (
                  <ExchangeRateCard />
                ) : null}
              </div>

              <div className={styles.cardGrid}>
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} onOpen={openTour} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {visible("why") ? (
          <section
            className={`${styles.section} ${styles.why}`}
            style={sectionStyle("why")}
          >
            <div className={styles.wrap}>
              <p className={styles.eyebrow}>
                {String(
                  section("why")?.values.eyebrow ??
                    "Por qué viajar con nosotros",
                )}
              </p>
              <h2>{String(section("why")?.values.heading ?? "")}</h2>

              <div className={styles.whyGrid}>
                {whyItems.map((item, index) => (
                  <article
                    key={String(item.title ?? index)}
                    className={styles.whyItem}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <h3>{String(item.title ?? "")}</h3>
                    <p>{String(item.copy ?? "")}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {visible("wopu") ? (
          <section
            className={`${styles.section} ${styles.about}`}
            style={sectionStyle("wopu")}
          >
            <div className={`${styles.wrap} ${styles.aboutGrid}`}>
              <div>
                <p className={`${styles.eyebrow} ${styles.lightEyebrow}`}>
                  {String(section("wopu")?.values.eyebrow ?? "Operado por")}
                </p>
                <div className={styles.wopuWordmark}>
                  <img
                    src={wopuLogo}
                    alt="WOPU Travel"
                    width={800}
                    height={800}
                    className={styles.wopuSectionLogo}
                  />
                </div>
                <p className={styles.aboutCopy}>{String(wopu.body ?? "")}</p>

                <div className={styles.contactRows}>
                  <a
                    href={String(
                      settings.wopu_url ?? "https://woputravel.com/es/",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe2Icon className={styles.contactIcon} aria-hidden />
                    <span>woputravel.com</span>
                  </a>
                  <a
                    href={String(
                      settings.wopu_instagram_url ??
                        "https://www.instagram.com/wopu.travel",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <InstagramIcon className={styles.contactIcon} />
                    <span>@wopu.travel</span>
                  </a>
                  <a
                    href={`mailto:${String(settings.wopu_email ?? "info@woputravel.com")}`}
                  >
                    <MailIcon className={styles.contactIcon} aria-hidden />
                    <span>
                      {String(settings.wopu_email ?? "info@woputravel.com")}
                    </span>
                  </a>
                </div>
              </div>

              <div className={styles.aboutPanel}>
                <span className={styles.eyebrow}>
                  {String(wopu.panel_eyebrow ?? "ACTIMAX × WOPU TRAVEL")}
                </span>
                <h3>{String(wopu.panel_title ?? "")}</h3>
                <p>{String(wopu.panel_copy ?? "")}</p>
              </div>
            </div>
          </section>
        ) : null}

        {visible("reviews") && data.reviews.values.enabled === true ? (
          <section
            className={`${styles.section} ${styles.reviews}`}
            style={sectionStyle("reviews")}
          >
            <div className={styles.wrap}>
              <p className={styles.eyebrow}>
                {String(section("reviews")?.values.eyebrow ?? "Viajeros WOPU")}
              </p>
              <h2>
                {String(
                  data.reviews.values.heading ??
                    section("reviews")?.values.heading ??
                    "",
                )}
              </h2>
              <p className={styles.reviewsIntro}>
                {String(
                  data.reviews.values.intro ??
                    section("reviews")?.values.intro ??
                    "",
                )}
              </p>

              {reviewsProvider === "trustindex" ? (
                <TrustindexReviewsBlock
                  widgetId={String(
                    data.reviews.values.trustindex_widget_id ?? "",
                  )}
                  profileUrl={String(data.reviews.values.profile_url ?? "")}
                />
              ) : (
                <GoogleReviewsBlock
                  state={googleReviews}
                  profileUrl={String(data.reviews.values.profile_url ?? "")}
                  layout={String(data.reviews.values.layout ?? "cards")}
                />
              )}
            </div>
          </section>
        ) : null}

        {visible("faq") ? (
          <section
            className={`${styles.section} ${styles.faq}`}
            id="faq"
            style={sectionStyle("faq")}
          >
            <div className={styles.wrap}>
              <p className={styles.eyebrow}>
                {String(
                  section("faq")?.values.eyebrow ?? "Preguntas frecuentes",
                )}
              </p>
              <h2>{String(section("faq")?.values.heading ?? "")}</h2>

              <div className={styles.faqList}>
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <article key={faq.handle} className={styles.faqItem}>
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`faq-${index}`}
                          onClick={() => setOpenFaq(isOpen ? null : index)}
                        >
                          <span>{String(faq.values.question ?? "")}</span>
                          <span aria-hidden>{isOpen ? "−" : "+"}</span>
                        </button>
                      </h3>
                      <div
                        id={`faq-${index}`}
                        className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ""}`}
                      >
                        <p>{String(faq.values.answer ?? "")}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {visible("form") && data.form.values.enabled !== false ? (
          <section
            className={`${styles.section} ${styles.signup}`}
            id="registro"
            style={sectionStyle("form")}
          >
            <div className={`${styles.wrap} ${styles.signupGrid}`}>
              <div>
                <p className={styles.eyebrow}>
                  {String(data.form.values.eyebrow ?? "Preinscripción")}
                </p>
                <h2>
                  {String(
                    data.form.values.heading ??
                      section("form")?.values.heading ??
                      "",
                  )}
                </h2>
                <p className={styles.signupCopy}>
                  {String(data.form.values.intro ?? "")}
                </p>

                {settings.seal_enabled !== false ? (
                  data.settings.media.seal_image ? (
                    <img
                      className={styles.sealImage}
                      src={data.settings.media.seal_image}
                      alt={String(settings.seal_alt ?? "Temporada 2027")}
                    />
                  ) : (
                    <div
                      className={styles.seal}
                      aria-label={String(
                        settings.seal_alt ?? "Temporada exclusiva Europa 2027",
                      )}
                    >
                      <span className={styles.sealTop}>
                        TEMPORADA EXCLUSIVA
                      </span>
                      <strong>{String(settings.season ?? "2027")}</strong>
                      <span className={styles.sealAdventure}>
                        EUROPA · AVENTURA
                      </span>
                      <small>ACTIMAX × WOPU TRAVEL</small>
                    </div>
                  )
                ) : null}
              </div>

              <InterestForm
                selectedExperience={selectedExperience}
                onExperienceChange={setSelectedExperience}
                tours={tours}
                values={data.form.values}
              />
            </div>
          </section>
        ) : null}

        {visible("footer") ? (
          <footer
            className={styles.destinosFooter}
            style={sectionStyle("footer")}
          >
            <div className={styles.wrap}>
              <div className={styles.footerGrid}>
                <div>
                  <strong>DESTINOS ACTIMAX × WOPU TRAVEL</strong>
                  <p>
                    {String(
                      footer.tagline ??
                        `Europa ${String(settings.season ?? "2027")} · Límites por descubrir`,
                    )}
                  </p>
                </div>
                <div>
                  <span>Contacto</span>
                  <a href="https://wa.me/34660257833">
                    WhatsApp +34 660 257 833
                  </a>
                  <a href="https://wa.me/48780768442">
                    WhatsApp +48 780 768 442
                  </a>
                  <a
                    href={`mailto:${String(settings.wopu_email ?? "info@woputravel.com")}`}
                  >
                    {String(settings.wopu_email ?? "info@woputravel.com")}
                  </a>
                </div>
                <div>
                  <span>Síguenos</span>
                  <a
                    href="https://www.instagram.com/actimax/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @actimax
                  </a>
                  <a
                    href={String(
                      settings.wopu_instagram_url ??
                        "https://www.instagram.com/wopu.travel",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @wopu.travel
                  </a>
                </div>
              </div>

              <div className={styles.footerBottom}>
                <span>
                  © {String(settings.season ?? "2027")} Destinos Actimax × WOPU
                  Travel
                </span>
                <span>Operado por WOPU Travel · woputravel.com</span>
              </div>
            </div>
          </footer>
        ) : null}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappFloat}
          aria-label="WhatsApp de Destinos Actimax × WOPU Travel"
        >
          <WhatsAppIcon className={styles.whatsappIcon} />
        </a>

        <TourModal
          tour={activeTour}
          onClose={closeTour}
          onSelect={selectTour}
          whatsappUrl={whatsappUrl}
        />
      </div>
    </>
  );
}
