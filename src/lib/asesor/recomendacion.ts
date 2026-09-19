import type { ProductoAsesor, VarianteAsesor } from "./catalogo";
import type { PerfilAsesor, RespuestaAsesor, ResultadoAsesor } from "./contrato";

export function varianteCompatible(variante: VarianteAsesor, perfil: PerfilAsesor): boolean {
  const cafeina = variante.nutricion.nutrientes.cafeinaMg;
  if (perfil.cafeina === "sin" && cafeina !== 0) return false;
  if (perfil.cafeina === "sin_confirmar" && cafeina !== null && cafeina > 0) return false;
  return perfil.restricciones.every((restriction) => {
    // No hay una declaración «sin soya» en la referencia proporcionada.
    if (restriction === "sinSoya") return false;
    return variante.nutricion.atributos[restriction] === true;
  });
}

export function validarRecomendacion(respuesta: RespuestaAsesor, catalogo: readonly ProductoAsesor[]): ResultadoAsesor {
  if (respuesta.recomendaciones.length && (!respuesta.perfil.deporte || respuesta.perfil.duracionMinutos === null)) {
    throw new Error("Falta deporte o duración para recomendar.");
  }
  const usados = new Set<string>();
  const recomendaciones = respuesta.recomendaciones.map((item) => {
    const producto = catalogo.find((product) => product.handle === item.handle);
    const variante = producto?.variantes.find((variant) => variant.id === item.variantId);
    if (!producto || !variante || usados.has(item.handle)) throw new Error("Producto o variante no elegible.");
    usados.add(item.handle);
    if (!varianteCompatible(variante, respuesta.perfil) || !variante.nutricion.momentos.includes(item.momento)) {
      throw new Error("La variante no corresponde al perfil o momento.");
    }
    // Se calcula la masa total: los restos de dos tarros del mismo sabor se
    // pueden combinar. Redondear cada tarro primero sobredimensionaría compras.
    const cantidad = item.porcionesNecesarias === null ? 1 : Math.ceil(item.porcionesNecesarias * variante.nutricion.gramos / producto.gramosEnvase);
    if (cantidad < 1 || cantidad > 12 || !Number.isFinite(cantidad)) throw new Error("Cantidad fuera de rango.");
    return {
      producto: {
        handle: producto.handle, title: producto.title, path: producto.path, image: producto.image,
        envase: producto.envase, gramosEnvase: producto.gramosEnvase, porcionesCompletas: producto.porcionesCompletas,
      }, variante, motivo: item.motivo, momento: item.momento,
      cantidad, porcionesNecesarias: item.porcionesNecesarias, subtotal: variante.price * cantidad,
    };
  });
  const total = recomendaciones.reduce((sum, item) => sum + item.subtotal, 0);
  if (respuesta.perfil.presupuestoCOP !== null && total > respuesta.perfil.presupuestoCOP) {
    throw new Error("La selección supera el presupuesto.");
  }
  return { recomendaciones, total };
}
