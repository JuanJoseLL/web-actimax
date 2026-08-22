import { NewsletterForm } from "@/components/NewsletterForm";

/**
 * Cierre de cada artículo. Quien acaba de leer una guía de nutrición es
 * justo quien quiere la siguiente, y hasta ahora el único formulario del
 * sitio estaba al final del home, donde un lector del blog no llega nunca.
 */
export function BlogNewsletter() {
  return (
    <section
      aria-labelledby="boletin-articulo"
      className="mt-8 rounded-xl bg-azul px-6 py-8 text-white sm:px-8"
    >
      <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-10">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amarillo">
            Boletín Actimax
          </p>
          <h2
            id="boletin-articulo"
            className="mt-3 font-display text-3xl font-extrabold uppercase italic leading-[0.95] sm:text-4xl"
          >
            ¿Te sirvió? El siguiente te llega al correo.
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-white/70">
            Estrategia de nutrición, planes por distancia y un descuento de
            bienvenida para tu primera compra.
          </p>
        </div>
        <NewsletterForm origen="blog" />
      </div>
    </section>
  );
}
