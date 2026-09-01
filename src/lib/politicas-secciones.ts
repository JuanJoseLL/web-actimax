/**
 * El documento legal revisado en agosto de 2026 llegó a Shopify entero dentro
 * de una sola ranura —Términos del servicio— con sus tres secciones adentro,
 * mientras las ranuras de devoluciones, privacidad y envíos seguían con el
 * texto anterior. Y los dos textos se contradicen: el viejo dice que no se
 * hacen reembolsos donde el nuevo reconoce el derecho de retracto.
 *
 * Publicar cada sección desde el documento consolidado saca esa contradicción
 * del sitio sin esperar a que alguien reparta el texto en el panel. La espera
 * además se resuelve sola: el día que el documento deje de traer las secciones
 * adentro —porque se repartieron— no habrá nada que extraer y cada página caerá
 * en su ranura propia. No hay bandera que acordarse de bajar.
 */

export type SeccionLegal = "cambios" | "datos" | "envios";

/** El preámbulo es todo lo que va antes de la primera sección. */
export type ParteLegal = SeccionLegal | "preambulo";

/**
 * Los encabezados de sección son un <b> en mayúsculas que ocupa su párrafo
 * entero. Los subtítulos numerados ("1. Cambios voluntarios") van en minúscula
 * y las cifras en negrita ("$120.000 COP") no llegan a ocho letras, así que
 * ninguno de los dos se cuela como corte.
 */
const ENCABEZADO = /<p[^>]*>\s*<b>\s*([^<]+?)\s*<\/b>\s*<\/p>/g;

const PALABRA_CLAVE: Record<SeccionLegal, RegExp> = {
  cambios: /DEVOLUCIONES/,
  datos: /PRIVACIDAD/,
  envios: /ENV[ÍI]OS/,
};

interface Corte {
  seccion: SeccionLegal;
  /** Dónde empieza el encabezado: hasta acá llega la parte anterior. */
  desdeEncabezado: number;
  /** Dónde termina el encabezado: desde acá empieza el cuerpo de la sección. */
  hastaCuerpo: number;
}

function cortes(documento: string): Corte[] {
  const encontrados: Corte[] = [];

  for (const match of documento.matchAll(ENCABEZADO)) {
    const titulo = match[1];
    if ((titulo.match(/\p{L}/gu)?.length ?? 0) < 8) continue;
    if (titulo !== titulo.toLocaleUpperCase("es")) continue;

    const seccion = (Object.keys(PALABRA_CLAVE) as SeccionLegal[]).find(
      (candidata) =>
        PALABRA_CLAVE[candidata].test(titulo) &&
        !encontrados.some((corte) => corte.seccion === candidata),
    );
    if (seccion === undefined) continue;

    encontrados.push({
      seccion,
      desdeEncabezado: match.index,
      hastaCuerpo: match.index + match[0].length,
    });
  }

  return encontrados.sort((a, b) => a.desdeEncabezado - b.desdeEncabezado);
}

/**
 * Cuerpo que le corresponde a una página legal.
 *
 * @param documento Ranura de Términos del servicio, que hoy trae todo.
 * @param propio    Ranura dedicada de la página (devoluciones, privacidad…).
 */
export function cuerpoLegal({
  parte,
  documento,
  propio,
}: {
  parte: ParteLegal;
  documento?: string;
  propio?: string;
}): string | undefined {
  const partes = documento === undefined ? [] : cortes(documento);

  if (parte === "preambulo") {
    if (documento === undefined) return undefined;
    /* Sin secciones adentro, el documento entero es el preámbulo: es el caso
       del día en que Términos del servicio quede solo con los términos. */
    const hasta = partes[0]?.desdeEncabezado ?? documento.length;
    return vacio(documento.slice(0, hasta)) ? undefined : documento.slice(0, hasta);
  }

  const indice = partes.findIndex((corte) => corte.seccion === parte);
  if (indice === -1) return vacio(propio) ? undefined : propio;

  const desde = partes[indice].hastaCuerpo;
  const hasta = partes[indice + 1]?.desdeEncabezado ?? documento!.length;
  const seccion = documento!.slice(desde, hasta);
  return vacio(seccion) ? (vacio(propio) ? undefined : propio) : seccion;
}

/** Un cuerpo de solo marcas (<p><br></p>) no es contenido publicable. */
function vacio(html: string | undefined): boolean {
  return html === undefined || html.replace(/<[^>]*>/g, "").trim() === "";
}
