import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  SparklesIcon,
  UsersRoundIcon,
} from "lucide-react";
import { FuelFinder } from "@/components/FuelFinder";
import { ProductCard } from "@/components/ProductCard";
import { Ticker } from "@/components/Ticker";
import { Button } from "@/components/ui/button";
import { formatPostDate, getAllBlogPosts } from "@/lib/blog";
import { getAllProducts, getProducts } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";

export default async function Home() {
  "use cache";
  cacheTag("blog", "catalog");
  cacheLife({ stale: 60, revalidate: 60, expire: 86400 });

  const posts = (await getAllBlogPosts()).slice(0, 3);
  return (
    <>
      <Hero />
      <Ticker />
      <ChallengeSection />
      <StorySection />
      <RitualSection />
      <BestSellersSection />
      <ClubSection />
      <JournalSection posts={posts} />
      <TeamSection />
    </>
  );
}

function Hero() {
  return (
    <section className="hero-evolved overflow-hidden text-white">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100svh-67px)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 flex flex-col justify-center px-4 py-12 sm:px-8 md:py-20 lg:px-14 xl:px-20">
          <div className="fade-up flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amarillo">
            <span className="h-px w-8 bg-amarillo" />
            El combustible de tu próxima historia
          </div>

          <h1
            className="fade-up mt-6 max-w-4xl font-display text-[16vw] font-extrabold uppercase italic leading-[0.78] tracking-[-0.045em] sm:text-[6.5rem] lg:text-[7.8rem] xl:text-[9rem]"
            style={{ animationDelay: "0.08s" }}
          >
            Tu meta
            <span className="block text-amarillo">no se</span>
            improvisa.
          </h1>

          <p
            className="fade-up mt-7 max-w-xl text-base font-medium leading-relaxed text-white/72 sm:text-lg"
            style={{ animationDelay: "0.16s" }}
          >
            Entrenas para una versión de ti que todavía no conoces. Nosotros
            diseñamos la nutrición para que la encuentres, kilómetro a kilómetro.
          </p>

          <div
            className="fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            style={{ animationDelay: "0.24s" }}
          >
            <Button asChild variant="raceSun" size="lg" className="h-auto px-8 py-4 text-lg">
              <Link href="/productos">
                Comprar productos
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <FuelFinder />
          </div>

          <div
            className="fade-up mt-10 grid max-w-2xl grid-cols-3 border-y border-white/15 py-4"
            style={{ animationDelay: "0.32s" }}
          >
            {[
              ["20+", "años en competencia"],
              ["100%", "marca colombiana"],
              ["3", "momentos clave"],
            ].map(([value, label], index) => (
              <div
                key={value}
                className={`px-3 first:pl-0 ${index > 0 ? "border-l border-white/15" : ""}`}
              >
                <p className="font-display text-3xl font-extrabold italic text-white sm:text-4xl">
                  {value}
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase leading-tight tracking-[0.08em] text-white/65 sm:tracking-[0.12em]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[400px] overflow-hidden border-t border-white/10 sm:min-h-[520px] lg:min-h-full lg:border-l lg:border-t-0">
          <Image
            src="/products/energy-pack-media-maraton-21k-1.jpg"
            alt="Atleta Actimax preparándose con un gel energético en la pista"
            fill
            priority
            sizes="(min-width: 1440px) 684px, (min-width: 1024px) 48vw, 100vw"
            className="hero-athlete object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,20,60,0.05)_35%,rgba(0,20,60,0.92)_100%)]" />
          <div className="absolute inset-y-0 left-0 hidden w-28 bg-[linear-gradient(90deg,#002f87,transparent)] lg:block" />

          <p className="absolute right-4 top-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65 [writing-mode:vertical-rl] sm:right-7 sm:top-8">
            Medellín · Colombia · Desde hace más de 20 años
          </p>

          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 sm:p-8">
            <div className="max-w-xs">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amarillo">
                Historia real · Producto real
              </p>
              <p className="mt-2 font-display text-3xl font-bold uppercase italic leading-none sm:text-4xl">
                Probado donde cuenta: en movimiento.
              </p>
            </div>
            <Link
              href="/productos/energy-pack-media-maraton-21k"
              className="group hidden shrink-0 items-center gap-3 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-semibold backdrop-blur-md transition hover:border-amarillo hover:text-amarillo sm:flex"
            >
              Ver pack 21K
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const CHALLENGES = [
  {
    handle: "energy-pack-de-10k",
    distance: "10K",
    eyebrow: "Primera línea de salida",
    promise: "Corre tu primera gran historia",
  },
  {
    handle: "energy-pack-media-maraton-21k",
    distance: "21K",
    eyebrow: "El salto de nivel",
    promise: "Sostén el ritmo hasta la meta",
  },
  {
    handle: "energy-pack-maraton-42k",
    distance: "42K",
    eyebrow: "La historia que no se olvida",
    promise: "Convierte meses en un solo día",
  },
  {
    handle: "energy-pack-gran-fondo",
    distance: "GF",
    eyebrow: "Muchas horas. Una misión.",
    promise: "Conquista la próxima subida",
  },
] as const;

async function ChallengeSection() {
  const products = await getProducts(CHALLENGES.map((challenge) => challenge.handle));
  const byHandle = new Map(products.map((product) => [product.handle, product]));

  return (
    <section id="retos" className="scroll-mt-24 bg-[#f4f2ec]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 lg:px-8">
        <div className="reveal grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="section-kicker">01 · Elige tu próxima meta</p>
            <h2 className="mt-4 max-w-3xl font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-7xl lg:text-8xl">
              ¿Qué historia vas a contar?
            </h2>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-lg font-medium leading-relaxed text-tinta/68">
              No compras un kit. Te comprometes con una meta. Cada Energy Pack
              reúne lo necesario para llegar preparado antes, responder durante
              y recuperar después.
            </p>
            <div className="mt-6">
              <FuelFinder tone="light" />
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CHALLENGES.map((challenge, index) => {
            const product = byHandle.get(challenge.handle);
            if (product === undefined) return null;

            return (
              <article
                key={challenge.handle}
                className="challenge-card reveal group relative overflow-hidden bg-white"
              >
                <Link href={`/productos/${challenge.handle}`} className="block h-full">
                  <div className="flex items-center justify-between border-b border-tinta/10 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-tinta/45">
                    <span>Reto {String(index + 1).padStart(2, "0")}</span>
                    <span className="text-azul">Energy Pack</span>
                  </div>
                  <div className="relative aspect-[1.08] overflow-hidden bg-[#e8ebf0]">
                    <span className="absolute -left-2 top-1 z-0 font-display text-[8rem] font-extrabold italic leading-none text-white sm:text-[9rem]">
                      {challenge.distance}
                    </span>
                    {product.images[0] !== undefined ? (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1280px) 292px, (min-width: 768px) 50vw, 100vw"
                        className="relative z-10 object-contain p-7 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1"
                      />
                    ) : null}
                    {product.onSale ? (
                      <span className="absolute right-3 top-3 z-20 rounded-full bg-amarillo px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-tinta">
                        Precio pack
                      </span>
                    ) : null}
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-azul">
                      {challenge.eyebrow}
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-bold uppercase italic leading-none">
                      {challenge.promise}
                    </h3>
                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-tinta/10 pt-4">
                      <div>
                        {product.onSale ? (
                          <span className="block font-mono text-[10px] text-tinta/40 line-through">
                            {formatCOP(product.regularPrice)}
                          </span>
                        ) : null}
                        <span className="font-mono text-lg font-bold tabular-nums">
                          {formatCOP(product.price)}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-azul">
                        Ver mi kit <ChevronRightIcon className="size-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  return (
    <section id="historia" className="scroll-mt-24 overflow-hidden bg-azul text-white">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-2">
        <div className="relative grid min-h-[480px] grid-cols-5 grid-rows-6 gap-3 p-4 sm:min-h-[620px] sm:p-7 lg:min-h-[820px] lg:p-10">
          <div className="relative col-span-5 row-span-4 overflow-hidden">
            <Image
              src="/products/energy-pack-gran-fondo-1.webp"
              alt="Ciclista Actimax alimentándose durante una ruta"
              fill
              sizes="(min-width: 1440px) 640px, (min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="relative col-span-3 row-span-2 overflow-hidden bg-amarillo">
            <Image
              src="/products/energy-pack-gran-fondo-0.webp"
              alt="Productos incluidos en el Energy Pack Gran Fondo"
              fill
              sizes="(min-width: 1440px) 379px, (min-width: 1024px) 30vw, 60vw"
              className="object-contain p-5"
            />
          </div>
          <div className="col-span-2 row-span-2 flex flex-col justify-between bg-tinta p-3 sm:p-7">
            <SparklesIcon className="size-6 text-amarillo" />
            <p className="font-display text-2xl font-extrabold uppercase italic leading-none sm:text-4xl">
              Hecho para nuestro terreno.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-16 sm:px-8 md:py-20 lg:px-16 xl:px-20">
          <p className="section-kicker section-kicker-dark">02 · Nuestra historia</p>
          <h2 className="mt-5 max-w-xl font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-7xl lg:text-8xl">
            De una fórmula a miles de metas.
          </h2>
          <p className="mt-7 max-w-xl text-lg font-medium leading-relaxed text-white/70">
            Durante más de 20 años hemos aprendido algo simple: el rendimiento
            no nace de promesas. Nace de lo que repites cuando nadie está mirando,
            de conocer tu cuerpo y de tener un plan cuando llega el momento difícil.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55">
            Por eso desarrollamos nutrición deportiva especializada en Colombia,
            pensada para el calor, la montaña, el asfalto y las metas reales de
            atletas reales.
          </p>

          <div className="mt-10 divide-y divide-white/15 border-y border-white/15">
            {[
              ["01", "Ciencia que puedes usar", "Fórmulas claras para energía, hidratación y recuperación."],
              ["02", "Probado en movimiento", "Productos pensados para acompañarte, no para distraerte."],
              ["03", "Una comunidad que avanza", "Running, ciclismo y triatlón unidos por la próxima meta."],
            ].map(([number, title, copy]) => (
              <div key={number} className="grid grid-cols-[auto_1fr] gap-5 py-5">
                <span className="font-mono text-xs font-bold text-amarillo">{number}</span>
                <div>
                  <h3 className="font-display text-2xl font-bold uppercase italic">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const RITUALS = [
  {
    step: "01",
    moment: "Antes",
    headline: "Carga la intención",
    copy: "Prepara tus reservas para que el cuerpo responda desde el primer esfuerzo.",
    handle: "pre-race-en-tarro-400gr",
    href: "/productos?momento=antes",
    timing: "15–20 min antes",
  },
  {
    step: "02",
    moment: "Durante",
    headline: "Protege tu ritmo",
    copy: "Repón energía y electrolitos antes de sentir que ya es demasiado tarde.",
    handle: "gl-energetico-actimax-sachets-x24-con-cafeina",
    href: "/productos?momento=durante",
    timing: "Cada 30–45 min",
  },
  {
    step: "03",
    moment: "Después",
    headline: "Honra el esfuerzo",
    copy: "Recupera lo que diste hoy para que mañana puedas volver a construir.",
    handle: "recovery-pro-tarro-400gr",
    href: "/productos?momento=despues",
    timing: "Primeros 30 min",
  },
] as const;

async function RitualSection() {
  const products = await getProducts(RITUALS.map((ritual) => ritual.handle));
  const byHandle = new Map(products.map((product) => [product.handle, product]));

  return (
    <section id="metodo" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 lg:px-8">
        <div className="reveal max-w-4xl">
          <p className="section-kicker">03 · El método Actimax</p>
          <h2 className="mt-4 font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-7xl lg:text-8xl">
            Todo atleta tiene un ritual.
          </h2>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-tinta/65">
            El nuestro ordena la nutrición en tres momentos fáciles de recordar.
            Menos improvisación. Más confianza para concentrarte en competir.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-tinta/10 bg-tinta/10 lg:grid-cols-3">
          {RITUALS.map((ritual) => {
            const product = byHandle.get(ritual.handle);
            return (
              <article key={ritual.step} className="ritual-card reveal group bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                  <span className="text-azul">Momento {ritual.step}</span>
                  <span className="rounded-full border border-tinta/15 px-3 py-1 text-tinta/50">
                    {ritual.timing}
                  </span>
                </div>
                <div className="relative mt-8 aspect-[1.2] overflow-hidden rounded-full bg-niebla transition-colors duration-300 group-hover:bg-amarillo">
                  {product?.images[0] !== undefined ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      sizes="(min-width: 1280px) 341px, (min-width: 1024px) 33vw, 100vw"
                      className="object-contain p-8 mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <p className="mt-8 font-display text-5xl font-extrabold uppercase italic leading-none text-azul">
                  {ritual.moment}
                </p>
                <h3 className="mt-2 text-xl font-bold">{ritual.headline}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tinta/60">{ritual.copy}</p>
                <Link
                  href={ritual.href}
                  className="mt-6 flex items-center justify-between border-t border-tinta/10 pt-4 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-azul"
                >
                  Comprar para {ritual.moment.toLowerCase()}
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const BEST_SELLERS = [
  "gel-energetico-actimax-caja-x8-con-cafeina",
  "bebida-deportiva-elite-con-cafeina-tarro-de-500gr",
  "protein-bar-caja-x18",
  "recovery-pro-tarro-400gr",
];

async function BestSellersSection() {
  const [featured, all] = await Promise.all([
    getProducts(BEST_SELLERS),
    getAllProducts(),
  ]);

  return (
    <section className="bg-[#f4f2ec]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 lg:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="section-kicker">04 · Los favoritos del club</p>
            <h2 className="mt-4 font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-7xl">
              Los que siempre vuelven.
            </h2>
          </div>
          <Button asChild variant="race" className="h-auto px-6 py-3">
            <Link href="/productos">
              Ver los {all.length} productos
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
          {featured.map((product) => (
            <div key={product.handle} className="reveal">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClubSection() {
  return (
    <section id="club" className="club-section scroll-mt-24 overflow-hidden text-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8">
        <div className="reveal">
          <div className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-amarillo">
            <UsersRoundIcon className="size-5" />
            Actimax Club · La meta nos reúne
          </div>
          <h2 className="mt-6 max-w-4xl font-display text-6xl font-extrabold uppercase italic leading-[0.82] tracking-tight sm:text-8xl lg:text-[7.6rem]">
            El club no se compra.
            <span className="block text-amarillo">Se entrena.</span>
          </h2>
          <p className="mt-7 max-w-2xl text-lg font-medium leading-relaxed text-white/68">
            Pertenecer empieza cuando eliges una meta y sales a buscarla. Aquí
            encuentras estrategia, historias honestas y el combustible para no
            detenerte cuando el camino se pone interesante.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="raceSun" size="lg" className="h-auto px-8 py-4 text-lg">
              <Link href="/productos">
                Entrar al club
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild variant="raceOutline" size="lg" className="h-auto px-8 py-4 text-lg">
              <Link href="/blog">Leer historias</Link>
            </Button>
          </div>
        </div>

        <div className="member-card reveal relative mx-auto w-full max-w-lg overflow-hidden border border-white/20 p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-4xl font-extrabold uppercase italic leading-none">
                Actimax<span className="text-amarillo">.</span>
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                Member of the movement
              </p>
            </div>
            <span className="grid size-12 place-items-center rounded-full border border-amarillo/50 font-mono text-[10px] font-bold text-amarillo">
              20+
            </span>
          </div>
          <p className="mt-24 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
            Próxima meta
          </p>
          <p className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-6xl">
            La que te reta.
          </p>
          <div className="mt-8 grid gap-3 border-t border-white/15 pt-6 sm:grid-cols-2">
            {["Planes para cada distancia", "Consejos que sí puedes usar", "Productos hechos para competir", "Una comunidad que no para"].map(
              (benefit) => (
                <p key={benefit} className="flex items-start gap-2 text-xs leading-relaxed text-white/65">
                  <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-amarillo" />
                  {benefit}
                </p>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function JournalSection({ posts }: { posts: Awaited<ReturnType<typeof getAllBlogPosts>> }) {
  return (
    <section id="historias" className="scroll-mt-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-28 lg:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="section-kicker">05 · Historias y estrategia</p>
            <h2 className="mt-4 font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-7xl">
              Lo que aprendemos en ruta.
            </h2>
          </div>
          <Link
            href="/blog"
            className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-azul"
          >
            Ver todas las historias <ArrowRightIcon className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-tinta/10 bg-tinta/10 md:grid-cols-3">
          {posts.map((post, index) => (
            <article key={post.slug} className="reveal group bg-white">
              <Link href={post.path} className="flex min-h-[360px] flex-col p-6 sm:p-8">
                <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.17em]">
                  <span className="text-azul">{post.category}</span>
                  <span className="text-tinta/30">N.{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-10 font-display text-4xl font-bold uppercase italic leading-[0.98] transition-colors group-hover:text-azul">
                  {post.title}
                </h3>
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-tinta/58">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-end justify-between gap-4 border-t border-tinta/10 pt-5 font-mono text-[10px] text-tinta/40">
                  <span>{formatPostDate(post.date)} · {post.minutes} min</span>
                  <span className="grid size-9 place-items-center rounded-full border border-tinta/15 text-azul transition group-hover:border-azul group-hover:bg-azul group-hover:text-white">
                    <ArrowRightIcon className="size-4" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamSection() {
  return (
    <section id="mayoristas" className="scroll-mt-24 bg-amarillo text-tinta">
      <div aria-hidden className="finish-line" />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-tinta/55">
            Equipos · Tiendas · Eventos
          </p>
          <h2 className="mt-3 font-display text-5xl font-extrabold uppercase italic leading-none sm:text-6xl">
            Las grandes metas también se corren juntos.
          </h2>
        </div>
        <Button asChild variant="raceInk" size="lg" className="h-auto shrink-0 px-8 py-4 text-lg">
          <Link href="/productos">
            Explorar el catálogo
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
