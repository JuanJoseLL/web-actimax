"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ANCLAS_LEGADAS } from "@/data/politicas";

/**
 * WordPress publicaba las tres políticas en una sola página y las enlazaba por
 * ancla (#devolucion, #privacidad, #envios). Esos enlaces siguen vivos en
 * correos y en sitios de terceros, y un ancla nunca llega al servidor, así que
 * el salto a la página nueva solo se puede hacer acá.
 *
 * Va con `replace` para no dejar el índice en el historial: quien vuelva atrás
 * regresa de donde vino, no a un rebote.
 */
export function RedirigirAnclaLegada() {
  const router = useRouter();

  useEffect(() => {
    const destino = ANCLAS_LEGADAS[window.location.hash.slice(1)];
    if (destino !== undefined) router.replace(destino);
  }, [router]);

  return null;
}
