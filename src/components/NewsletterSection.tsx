import { NewsletterForm } from "@/components/NewsletterForm";

/**
 * Suscripción al boletín casi al final del home: datos de contacto a cambio
 * del descuento de bienvenida, para nutrir la base de datos de Actimax.
 */
export function NewsletterSection() {
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
          <NewsletterForm origen="home" />
        </div>
      </div>
    </section>
  );
}
