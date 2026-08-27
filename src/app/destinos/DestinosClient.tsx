"use client";

import Image from "next/image";
import {
  BedDoubleIcon,
  Globe2Icon,
  MailIcon,
  PlaneIcon,
  TicketCheckIcon,
  UsersRoundIcon,
} from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/BrandIcons";
import { FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { FAQS, TOURS, type Tour } from "./data";
import styles from "./destinos.module.css";

const WHATSAPP_URL =
  "https://wa.me/34660257833?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20los%20Destinos%20Actimax%20%C3%97%20WOPU%20Travel";

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div className={styles.imagePlaceholder} aria-label={`Placeholder: ${label}`}>
      <span>IMAGEN</span>
      <small>{label}</small>
    </div>
  );
}

function TourImage({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  if (!src) return <ImagePlaceholder label="REEMPLAZAR DESPUÉS" />;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={styles.coverImage}
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
  tour: Tour;
  onOpen: (tour: Tour, trigger: HTMLButtonElement) => void;
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
}: {
  tour: Tour | null;
  onClose: () => void;
  onSelect: (tour: Tour) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tour) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeButton = dialogRef.current?.querySelector<HTMLButtonElement>(
      "[data-modal-close]",
    );
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
          />
          <div className={styles.modalShade} />
          <div className={styles.modalHeroText}>
            <span
              className={`${styles.chip} ${
                tour.type === "maraton" ? styles.chipMaraton : styles.chipCiclismo
              }`}
            >
              {tour.tag}
            </span>
            {tour.soldOut && <span className={styles.soldOutModal}>AGOTADO</span>}
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
              href={WHATSAPP_URL}
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
}: {
  selectedExperience: string;
  onExperienceChange: (value: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    setStartedAt(Date.now());
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
      startedAt,
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
        throw new Error(result.message || "No fue posible enviar el formulario.");
      }

      setStatus("success");
      setMessage(
        "Gracias. Recibimos tu preinscripción y el equipo de WOPU Travel te contactará.",
      );
      form.reset();
      onExperienceChange("");
      setStartedAt(Date.now());
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No fue posible enviar el formulario. Inténtalo de nuevo.",
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
            {TOURS.map((tour) => (
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
          Acepto que WOPU Travel use estos datos para responder a mi solicitud
          sobre Destinos Actimax × WOPU Travel.
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
        {status === "sending" ? "Enviando..." : "Quiero más información"}
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

export function DestinosClient() {
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [selectedExperience, setSelectedExperience] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    document.body.classList.add("destinos-route");
    return () => document.body.classList.remove("destinos-route");
  }, []);

  function openTour(tour: Tour, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setActiveTour(tour);
  }

  function closeTour() {
    setActiveTour(null);
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  }

  function selectTour(tour: Tour) {
    setSelectedExperience(tour.title);
    setActiveTour(null);
    window.setTimeout(() => {
      document
        .getElementById("registro")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
  }

  return (
    <div className={styles.page} data-destinos-page>
      <section className={styles.hero}>
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
            Destinos Actimax × WOPU Travel · Europa 2027
          </p>
          <h1>
            Límites por <span>descubrir</span>
          </h1>
          <p className={styles.heroLead}>
            Descubre Europa a través del deporte. Viajes organizados alrededor
            de grandes eventos y rutas inolvidables, para que tú solo tengas que
            concentrarte en superar tu próxima meta.
          </p>

          <div className={styles.heroActionCluster}>
            <div className={styles.heroCta}>
              <a href="#experiencias" className={styles.primaryButton}>
                Ver experiencias
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.ghostButton}
              >
                <WhatsAppIcon className={styles.inlineIcon} />
                Escríbenos por WhatsApp
              </a>
            </div>

            <div className={styles.lockup} aria-label="Actimax y WOPU Travel">
              <Image
                src="/destinos/brands/actimax-white.svg"
                alt="Actimax"
                width={829}
                height={188}
                className={styles.brandActimax}
              />
              <span className={styles.brandTimes} aria-hidden>
                ×
              </span>
              <Image
                src="/destinos/brands/wopu-white.svg"
                alt="WOPU Travel"
                width={800}
                height={800}
                className={styles.brandWopu}
              />
              <small>
                RENDIMIENTO
                <br />+ OPERACIÓN
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.intro}`}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>La colaboración</p>
          <h2>El deporte como una nueva forma de descubrir Europa.</h2>
          <p className={styles.lede}>
            Destinos Actimax × WOPU Travel une la experiencia de Actimax
            acompañando el rendimiento y la preparación de los deportistas con
            la experiencia de WOPU Travel diseñando y operando viajes
            personalizados en destinos europeos. Cada experiencia se organiza
            alrededor de un gran reto deportivo —correr una maratón
            internacional o recorrer nuevos territorios en bicicleta— y va
            mucho más allá de la competencia, conociendo la cultura de cada
            destino.
          </p>

          <div className={styles.roles}>
            <article className={styles.role}>
              <p className={styles.roleTag}>Actimax · Rendimiento</p>
              <h3>Acompaña al deportista a descubrir sus límites</h3>
              <p>
                Nutrición deportiva especializada y una comunidad que entiende
                el deporte como parte de su estilo de vida y de sus metas
                personales.
              </p>
            </article>

            <article className={`${styles.role} ${styles.roleWopu}`}>
              <p className={styles.roleTag}>WOPU Travel · Operación</p>
              <h3>Coordina toda la logística del viaje</h3>
              <p>
                Diseño y operación de cada recorrido a partir de un conocimiento
                directo de los destinos, sus culturas, alojamientos y
                proveedores.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.includes}`} id="incluye">
        <div className={styles.wrap}>
          <p className={`${styles.eyebrow} ${styles.lightEyebrow}`}>
            Qué incluye cada viaje
          </p>
          <h2>Tú te concentras en la meta. Nosotros, en todo lo demás.</h2>

          <div className={styles.includesGrid}>
            {[
              {
                number: "01",
                title: "Vuelos desde Colombia",
                copy: "Tiquetes aéreos de ida y regreso entre Colombia y Europa, según las condiciones de cada destino.",
                Icon: PlaneIcon,
              },
              {
                number: "02",
                title: "Alojamiento central",
                copy: "Hoteles bien ubicados y cercanos a las actividades durante todo el tour.",
                Icon: BedDoubleIcon,
              },
              {
                number: "03",
                title: "Inscripción al evento",
                copy: "Gestión e inclusión de la inscripción oficial a la maratón o actividad deportiva correspondiente.",
                Icon: TicketCheckIcon,
              },
              {
                number: "04",
                title: "Acompañamiento WOPU Travel",
                copy: "Guías de WOPU Travel acompañan al grupo en cada destino para coordinar la experiencia y la logística.",
                Icon: UsersRoundIcon,
              },
            ].map(({ number, title, copy, Icon }) => (
              <article key={number} className={styles.includeItem}>
                <span>{number}</span>
                <div className={styles.includeIcon} aria-hidden>
                  <Icon />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.experiences}`} id="experiencias">
        <div className={styles.wrap}>
          <div className={styles.expHead}>
            <div className={styles.expHeadingCopy}>
              <p className={styles.eyebrow}>Destinos · Temporada 2027</p>
              <h2>Elige tu próximo destino</h2>
              <p className={styles.expIntro}>
                Toca cada experiencia para ver el itinerario completo, las fechas
                y todo lo que incluye.
              </p>
            </div>
            <ExchangeRateCard />
          </div>

          <div className={styles.cardGrid}>
            {TOURS.map((tour) => (
              <TourCard key={tour.id} tour={tour} onOpen={openTour} />
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.why}`}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>Por qué viajar con nosotros</p>
          <h2>Una experiencia diseñada alrededor del deportista</h2>

          <div className={styles.whyGrid}>
            {[
              ["01", "Preparación con visión deportiva", "Actimax acompaña a una comunidad que entiende el deporte como parte de su estilo de vida y de sus metas personales."],
              ["02", "Diseñado por quienes conocen Europa", "WOPU Travel organiza cada recorrido a partir de su conocimiento directo de los destinos, sus culturas, alojamientos y proveedores."],
              ["03", "Acompañamiento de principio a fin", "Desde la planificación hasta el regreso, el grupo cuenta con acompañamiento local y experimentado en cada destino."],
              ["04", "Más que participar en un evento", "Cada tour combina el reto deportivo con el descubrimiento de nuevos lugares, culturas y personas."],
            ].map(([number, title, copy]) => (
              <article key={number} className={styles.whyItem}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.about}`}>
        <div className={`${styles.wrap} ${styles.aboutGrid}`}>
          <div>
            <p className={`${styles.eyebrow} ${styles.lightEyebrow}`}>Operado por</p>
            <div className={styles.wopuWordmark}>
              <Image
                src="/destinos/brands/wopu-white.svg"
                alt="WOPU Travel"
                width={800}
                height={800}
                className={styles.wopuSectionLogo}
              />
            </div>
            <p className={styles.aboutCopy}>
              WOPU Travel nace para invitar a descubrir los caminos auténticos
              de Colombia y, ahora, del mundo: conectando a las personas con la
              naturaleza, la comunidad y el espíritu de aventura. No es solo un
              servicio de tours, sino una experiencia de transformación. En
              esta alianza, WOPU Travel se encarga de diseñar y operar cada
              viaje de principio a fin.
            </p>

            <div className={styles.contactRows}>
              <a href="https://woputravel.com/es/" target="_blank" rel="noopener noreferrer">
                <Globe2Icon className={styles.contactIcon} aria-hidden />
                <span>woputravel.com</span>
              </a>
              <a href="https://www.instagram.com/wopu.travel" target="_blank" rel="noopener noreferrer">
                <InstagramIcon className={styles.contactIcon} />
                <span>@wopu.travel</span>
              </a>
              <a href="mailto:info@woputravel.com">
                <MailIcon className={styles.contactIcon} aria-hidden />
                <span>info@woputravel.com</span>
              </a>
            </div>
          </div>

          <div className={styles.aboutPanel}>
            <span className={styles.eyebrow}>ACTIMAX × WOPU TRAVEL</span>
            <h3>Rendimiento y viaje, conectados en una misma experiencia.</h3>
            <p>
              Actimax acompaña la comunidad deportiva. WOPU Travel diseña y
              opera el recorrido.
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.reviews}`}>
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>Viajeros WOPU</p>
          <h2>Experiencias contadas por quienes ya viajaron.</h2>
          <p className={styles.reviewsIntro}>
            Este bloque queda preparado para conectar las reseñas reales de
            Google de WOPU Travel sin modificar el diseño de la página.
          </p>

          <div className={styles.reviewsGrid}>
            {[1, 2, 3].map((item) => (
              <article key={item} className={styles.reviewPlaceholder}>
                <div className={styles.stars}>★★★★★</div>
                <p>RESEÑA DE GOOGLE</p>
                <span>Conexión pendiente en fase de integración</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.faq}`} id="faq">
        <div className={styles.wrap}>
          <p className={styles.eyebrow}>Preguntas frecuentes</p>
          <h2>Lo esencial antes de elegir tu próximo reto.</h2>

          <div className={styles.faqList}>
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <article key={faq.q} className={styles.faqItem}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${index}`}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <span aria-hidden>{isOpen ? "−" : "+"}</span>
                    </button>
                  </h3>
                  <div
                    id={`faq-${index}`}
                    className={`${styles.faqAnswer} ${isOpen ? styles.faqAnswerOpen : ""}`}
                  >
                    <p>{faq.a}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.signup}`} id="registro">
        <div className={`${styles.wrap} ${styles.signupGrid}`}>
          <div>
            <p className={styles.eyebrow}>Preinscripción</p>
            <h2>¿Te animas a viajar con nosotros?</h2>
            <p className={styles.signupCopy}>
              Déjanos tus datos y el equipo de WOPU Travel te contactará con
              toda la información de la experiencia que elijas.
            </p>

            <div className={styles.seal} aria-label="Temporada exclusiva Europa 2027">
              <span className={styles.sealTop}>TEMPORADA EXCLUSIVA</span>
              <strong>2027</strong>
              <span className={styles.sealAdventure}>EUROPA · AVENTURA</span>
              <small>ACTIMAX × WOPU TRAVEL</small>
            </div>
          </div>

          <InterestForm
            selectedExperience={selectedExperience}
            onExperienceChange={setSelectedExperience}
          />
        </div>
      </section>

      <footer className={styles.destinosFooter}>
        <div className={styles.wrap}>
          <div className={styles.footerGrid}>
            <div>
              <strong>DESTINOS ACTIMAX × WOPU TRAVEL</strong>
              <p>Europa 2027 · Límites por descubrir</p>
            </div>
            <div>
              <span>Contacto</span>
              <a href="https://wa.me/34660257833">WhatsApp +34 660 257 833</a>
              <a href="https://wa.me/48780768442">WhatsApp +48 780 768 442</a>
              <a href="mailto:info@woputravel.com">info@woputravel.com</a>
            </div>
            <div>
              <span>Síguenos</span>
              <a href="https://www.instagram.com/actimax/" target="_blank" rel="noopener noreferrer">@actimax</a>
              <a href="https://www.instagram.com/wopu.travel" target="_blank" rel="noopener noreferrer">@wopu.travel</a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© 2027 Destinos Actimax × WOPU Travel</span>
            <span>Operado por WOPU Travel · woputravel.com</span>
          </div>
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappFloat}
        aria-label="WhatsApp de Destinos Actimax × WOPU Travel"
      >
        <WhatsAppIcon className={styles.whatsappIcon} />
      </a>

      <TourModal tour={activeTour} onClose={closeTour} onSelect={selectTour} />
    </div>
  );
}
