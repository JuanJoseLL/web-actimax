/**
 * Umbral de envío gratis en COP. Política comercial vigente: envío gratis
 * por compras iguales o superiores a $120.000 (igual que en las políticas
 * de la tienda y la barra de anuncio del header).
 */
export const ENVIO_GRATIS_UMBRAL = 120_000;

/**
 * Tiempos que publica la política de envíos de la tienda (Shopify →
 * Configuración → Políticas): despacho dentro de los 2 días hábiles
 * siguientes a la compra y entrega estimada de 3 a 5 días hábiles según la
 * ciudad. Si Operaciones confirma un tiempo menor para Medellín/área
 * metropolitana, se cambia aquí y en la política, no solo en uno de los dos.
 */
export const TIEMPO_ENTREGA = "Envío a toda Colombia · llega en 3–5 días hábiles";
