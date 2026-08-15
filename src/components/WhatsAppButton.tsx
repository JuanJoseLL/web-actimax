import { WhatsAppIcon } from "@/components/BrandIcons";
import { whatsappUrl } from "@/lib/contacto";

/**
 * Botón flotante de WhatsApp, visible en todo el sitio: cualquier duda en
 * cualquier punto de la compra se resuelve por chat. Queda debajo de los
 * overlays (carrito, paleta) para no tapar sus acciones.
 */
export function WhatsAppButton() {
  return (
    <a
      href={whatsappUrl("Hola Actimax, tengo una pregunta.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="whatsapp-button fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-30 grid size-13 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_6px_20px_rgba(10,17,40,0.28)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:right-6"
    >
      <WhatsAppIcon className="size-6.5" />
    </a>
  );
}
