/**
 * Datos del aliado de Addi, compartidos entre el widget de la ficha y las
 * tarjetas del catálogo.
 *
 * El mínimo sale de la configuración pública del aliado
 * (`channels-public-api.addi.com/allies/{slug}/config`): por debajo de ese
 * monto Addi no financia, así que anunciar cuotas en un gel de $8.000 sería
 * mentira. El máximo de esa misma configuración está en $3.000.000, muy por
 * encima del producto más caro del catálogo, por eso no se valida acá.
 */
export const ADDI_ALLY_SLUG = "activasportsas-ecommerce";

export const ADDI_MONTO_MINIMO = 50000;

export function financiableConAddi(precio: number): boolean {
  return precio >= ADDI_MONTO_MINIMO;
}
