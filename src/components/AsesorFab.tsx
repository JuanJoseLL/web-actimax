"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { track } from "@/lib/track";

/**
 * Perfil de ruta con un mojón encima: la misma figura de la portada, al
 * tamaño de un icono. El tramo punteado es lo que falta por resolver, que
 * es justamente lo que el asesor responde.
 */
function RutaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path
        d="M1.75 19 6.5 16.25 10 17.25 13.25 11.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.75 8.75 22.25 5.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeDasharray="0.01 4.5"
      />
      <circle cx="16" cy="10" r="3.25" fill="none" stroke="#ffd23c" strokeWidth="2.25" />
    </svg>
  );
}

/**
 * Invitación flotante al asesor. Vive enfrente del botón de WhatsApp —a la
 * izquierda— porque son dos caminos distintos para la misma duda, y no
 * aparece en Mi Plan, donde el asesor ya está abierto.
 */
export function AsesorFab() {
  const pathname = usePathname();
  if (pathname === "/mi-plan" || pathname.startsWith("/mi-plan/")) return null;

  return (
    <Link
      href="/mi-plan/"
      onClick={() => track("clic_asesor", { origen: pathname })}
      aria-label="Habla con el asesor Actimax y descubre qué productos te convienen"
      className="asesor-fab fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 z-30 flex items-center gap-2.5 rounded-full bg-azul py-2.5 pl-3.5 pr-4 text-left text-white shadow-[0_6px_20px_rgba(10,17,40,0.28)] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:left-6"
    >
      <RutaIcon className="size-6 shrink-0" />
      <span>
        <span className="block font-mono text-[9px] font-bold uppercase leading-none tracking-[0.16em] text-amarillo">
          Asesor Actimax
        </span>
        <span className="mt-1 block font-display text-[0.95rem] font-bold uppercase leading-none">
          ¿Qué me conviene?
        </span>
      </span>
    </Link>
  );
}
