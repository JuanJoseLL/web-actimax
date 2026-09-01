import { NewsletterForm } from "@/components/NewsletterForm";

/**
 * Cierre de cada artículo. Quien acaba de leer una guía de nutrición es
 * justo quien quiere la siguiente, y hasta ahora el único formulario del
 * sitio estaba al final del home, donde un lector del blog no llega nunca.
 *
 * Va a sangre y con la misma caja (max-w-7xl) que NewsletterSection en el
 * home: antes vivía dentro de la columna del artículo y el azul se cortaba a
 * media página, que era lo que se veía raro.
 */
export function BlogNewsletter() {
  return (
    <section aria-labelledby="boletin-articulo" className="bg-azul text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <div className="reveal">
          <p className="section-kicker section-kicker-dark">Boletín Actimax</p>
          <h2
            id="boletin-articulo"
            className="mt-4 max-w-2xl font-display text-5xl font-extrabold uppercase italic leading-[0.86] tracking-tight sm:text-6xl lg:text-7xl"
          >
            ¿Te sirvió?
            <span className="block text-amarillo">El siguiente te llega al correo.</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-white/70">
            Estrategia de nutrición, planes por distancia y un descuento de
            bienvenida para tu primera compra.
          </p>
        </div>

        <div className="reveal">
          <NewsletterForm origen="blog" />
        </div>
      </div>
    </section>
  );
}
