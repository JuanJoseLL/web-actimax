import { ShieldCheckIcon, TruckIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { whatsappUrl } from "@/lib/contacto";
import { TIEMPO_ENTREGA } from "@/lib/envio";
import { cn } from "@/lib/utils";

/**
 * Las tres dudas que frenan la compra justo debajo del botón: cuándo llega,
 * si es seguro pagar y a quién preguntarle. Tres líneas, sin caja, para que
 * no compitan con el botón ni con los logos de pago.
 */
export function ProductTrust({
  productTitle,
  className,
}: {
  productTitle: string;
  className?: string;
}) {
  return (
    <ul className={cn("grid gap-2 text-[13px] font-medium text-tinta/75", className)}>
      <li className="flex items-center gap-2.5">
        <TruckIcon aria-hidden className="size-4 shrink-0 text-azul" />
        {TIEMPO_ENTREGA}
      </li>
      <li className="flex items-center gap-2.5">
        <ShieldCheckIcon aria-hidden className="size-4 shrink-0 text-azul" />
        Pago seguro procesado por Wompi
      </li>
      <li className="flex items-center gap-2.5">
        <WhatsAppIcon className="size-4 shrink-0 text-[#25d366]" />
        <a
          href={whatsappUrl(`Hola Actimax, tengo una pregunta sobre ${productTitle}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-tinta/30 underline-offset-4 transition-colors hover:text-azul hover:decoration-azul"
        >
          ¿Dudas? Escríbenos por WhatsApp
        </a>
      </li>
    </ul>
  );
}
