"use client";

import { useEffect } from "react";

import { recordarAtribucion } from "@/lib/atribucion";

/**
 * Guarda de dónde llegó la visita en cuanto carga la página.
 *
 * Solo corre al montar, que es cuando la URL todavía tiene los UTM: el App
 * Router los deja atrás en la primera navegación interna y este componente
 * vive en el layout, así que no se vuelve a montar mientras el visitante
 * recorre la tienda. Un clic nuevo en un anuncio sí es carga completa y vuelve
 * a pasar por acá, que es justo lo que queremos —gana el último clic—.
 *
 * Lee `window.location.search` en un efecto y no `useSearchParams` a
 * propósito: el hook volvería dinámico el layout entero y con
 * `cacheComponents` eso le cuesta el shell estático a todas las páginas.
 */
export function Atribucion() {
  useEffect(() => {
    recordarAtribucion(window.location.search);
  }, []);
  return null;
}
