/** Coincidencia y orden de los resultados de la Torre de Control. */

/** Sin tildes ni mayúsculas: "cafeina" debe encontrar "cafeína". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Puntaje para el `filter` de cmdk: 0 descarta el item y cmdk ordena de mayor
 * a menor. Todas las palabras deben aparecer en el valor o en las keywords;
 * el nombre visible desempata para que "gel" no liste primero un kit que lo
 * menciona de pasada.
 */
export function scoreMatch(
  value: string,
  search: string,
  keywords?: string[],
): number {
  const term = normalize(search).trim();
  const tokens = term.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 1;

  const haystack = normalize([value, ...(keywords ?? [])].join(" "));
  if (!tokens.every((token) => haystack.includes(token))) return 0;

  /* El value de un producto es su handle: ordenar por él subiría
     coincidencias que el usuario no ve en pantalla. */
  const label = normalize(keywords?.[0] ?? value);
  const at = label.indexOf(term);
  if (at === 0) return 4;
  if (at > 0) return label[at - 1] === " " ? 3 : 2;
  return 1;
}
