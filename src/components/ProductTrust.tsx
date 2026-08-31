import { ShieldCheckIcon, TruckIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/BrandIcons";
import { whatsappUrl } from "@/lib/contacto";
import { DESPACHO_MISMO_DIA, TIEMPO_ENTREGA } from "@/lib/envio";
import { cn } from "@/lib/utils";

/**
 * Las tres dudas que frenan la compra justo debajo del botón: cuándo llega,
 * si es seguro pagar y a quién preguntarle. Tres puntos, sin caja, para que
 * no compitan con el botón ni con los logos de pago. El primero lleva el
 * despacho del mismo día en una segunda línea atenuada: sostiene la promesa
 * de entrega sin robarle el ojo al resto.
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
      <li className="flex gap-2.5">
        <TruckIcon aria-hidden className="mt-px size-4 shrink-0 text-azul" />
        <span>
          {TIEMPO_ENTREGA}
          <span className="block text-tinta/55">{DESPACHO_MISMO_DIA}</span>
        </span>
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
