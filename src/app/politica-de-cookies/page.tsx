import type { Metadata } from "next";
import { DocumentoLegal } from "@/components/DocumentoLegal";
import { PAGINAS_LEGALES } from "@/data/politicas";
import { pageMetadata } from "@/lib/seo";

const PAGINA = PAGINAS_LEGALES.cookies;

export const metadata: Metadata = pageMetadata({
  title: PAGINA.metaTitle,
  description: PAGINA.description,
  path: PAGINA.path,
});

/**
 * Única política que no viene de Shopify: no hay ranura para cookies y, sobre
 * todo, el inventario de abajo describe scripts concretos de este repo
 * (GA4, pixel de Meta, Web Analytics, el carrito en localStorage). Vive junto
 * al código que la vuelve cierta: si algún día se quita o se agrega un
 * script, esta página se actualiza en el mismo commit.
 */
export default function Page() {
  return (
    <DocumentoLegal pagina={PAGINA}>
      <p>
        Última actualización: 28 de agosto de 2026.
      </p>
      <p>
        En actimax.com.co usamos cookies y tecnologías equivalentes —como el almacenamiento
        local del navegador— para que la tienda funcione, para entender cómo se usa y para
        medir nuestra publicidad. Aquí te contamos exactamente cuáles son, para qué sirven,
        cuánto duran y cómo desactivarlas.
      </p>

      <h2>Qué son</h2>
      <p>
        Una cookie es un archivo pequeño que un sitio guarda en tu navegador para recordar
        algo entre una página y otra. El almacenamiento local cumple la misma función, pero
        el dato no viaja en cada petición: se queda en tu equipo hasta que lo borras.
      </p>

      <h2>1. Necesarias para que la tienda funcione</h2>
      <p>
        Sin ellas no se puede armar un carrito ni completar una compra, así que no se pueden
        desactivar desde el sitio. No identifican a la persona ni se comparten con terceros.
      </p>
      <ul>
        <li>
          <b>actimax-cart-v3</b> (almacenamiento local): guarda los productos de tu carrito
          para que sigan ahí si cierras la pestaña y vuelves.
        </li>
        <li>
          <b>actimax-checkout-pendiente</b> y <b>actimax-comprar-ahora-pendiente</b>
          {" "}(almacenamiento local): recuerdan que saliste a pagar, para vaciar el carrito
          al volver si el pedido se completó y dejarlo intacto si no.
        </li>
      </ul>

      <h2>2. Del proceso de pago</h2>
      <p>
        El pago ocurre en el checkout de Shopify, bajo pagos.actimax.com.co. Shopify instala
        allí sus propias cookies de sesión, carrito y seguridad, necesarias para procesar el
        pedido y prevenir fraude. Actimax no crea ni lee esas cookies, y en ningún momento
        recibe ni almacena los datos de tu tarjeta: los procesa directamente la pasarela de
        pagos.
      </p>

      <h2>3. Analíticas</h2>
      <p>
        Nos dicen qué páginas se visitan y por dónde se abandona la compra. Las usamos de
        forma agregada: no nos sirven para saber quién eres, sino cuántos son.
      </p>
      <ul>
        <li>
          <b>Google Analytics 4</b> (cookies <b>_ga</b> y <b>_ga_*</b>, hasta 2 años):
          medición de audiencia y de embudo de compra. Proveedor: Google LLC.
        </li>
        <li>
          <b>Vercel Web Analytics</b>: mide visitas <b>sin usar cookies</b> y sin construir
          un perfil de la persona. Proveedor: Vercel Inc.
        </li>
      </ul>

      <h2>4. Publicitarias</h2>
      <ul>
        <li>
          <b>Pixel de Meta</b> (cookies <b>_fbp</b> y <b>_fbc</b>, hasta 90 días): nos
          permite medir los resultados de la pauta en Facebook e Instagram y mostrar anuncios
          a quien ya visitó la tienda. Proveedor: Meta Platforms, Inc.
        </li>
      </ul>

      <h2>Transferencia internacional</h2>
      <p>
        Google, Meta y Vercel procesan esta información en servidores fuera de Colombia,
        principalmente en Estados Unidos. Al aceptar el uso de estas tecnologías autorizas
        esa transferencia, en los términos de la Ley 1581 de 2012 y de nuestra{" "}
        <a href={PAGINAS_LEGALES.datos.path} className="text-azul underline">
          Política de tratamiento de datos personales
        </a>
        .
      </p>

      <h2>Cómo desactivarlas</h2>
      <ul>
        <li>
          <b>Desde tu navegador:</b> Chrome, Safari, Firefox y Edge permiten bloquear o
          borrar cookies por sitio desde su configuración de privacidad. Si bloqueas las
          necesarias, el carrito puede dejar de recordarse.
        </li>
        <li>
          <b>Google Analytics:</b> puedes instalar el complemento de inhabilitación que
          publica Google en tools.google.com/dlpage/gaoptout.
        </li>
        <li>
          <b>Meta:</b> desde la configuración de anuncios de tu cuenta de Facebook o
          Instagram puedes limitar el uso de tu actividad fuera de esas plataformas.
        </li>
      </ul>

      <h2>Cambios y contacto</h2>
      <p>
        Si cambiamos las herramientas que usamos, actualizaremos esta página y su fecha de
        última actualización. Para cualquier consulta sobre esta política escríbenos a{" "}
        <a href="mailto:ventas@actimax.com.co" className="text-azul underline">
          ventas@actimax.com.co
        </a>
        .
      </p>
    </DocumentoLegal>
  );
}
