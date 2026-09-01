import Link from "next/link";
import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import {
  INDICE_LEGAL_PATH,
  PAGINAS_LEGALES_ORDENADAS,
  type PaginaLegal,
} from "@/data/politicas";
import { getStorePolicies, type PolicySlot } from "@/lib/policies";
import { cuerpoLegal, type ParteLegal } from "@/lib/politicas-secciones";
import { SITE_URL, breadcrumbJsonLd, jsonLd } from "@/lib/seo";

/**
 * Marco común de las cinco páginas legales: miga de pan, encabezado, cuerpo y
 * los enlaces al resto de políticas. Las páginas legales se leen de a saltos
 * —quien busca el retracto no quiere leer envíos—, así que cada una termina
 * ofreciendo las otras cuatro en vez de dejar al lector en un callejón.
 */
export function DocumentoLegal({
  pagina,
  children,
}: {
  pagina: PaginaLegal;
  children: ReactNode;
}) {
  const otras = PAGINAS_LEGALES_ORDENADAS.filter((otra) => otra.path !== pagina.path);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbJsonLd([
              { name: "Inicio", url: `${SITE_URL}/` },
              { name: "Políticas", url: `${SITE_URL}${INDICE_LEGAL_PATH}` },
              { name: pagina.navLabel, url: `${SITE_URL}${pagina.path}` },
            ]),
          ),
        }}
      />

      <nav aria-label="Ruta" className="mb-6 font-mono text-[11px] text-tinta/50">
        <Link href="/" className="hover:text-azul hover:underline">
          Inicio
        </Link>
        {" / "}
        <Link href={INDICE_LEGAL_PATH} className="hover:text-azul hover:underline">
          Políticas
        </Link>
        {" / "}
        <span className="text-tinta/80">{pagina.navLabel}</span>
      </nav>

      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azul">
        Compra con confianza
      </p>
      <h1 className="mt-2 font-display text-5xl font-extrabold uppercase italic leading-[0.95] sm:text-6xl">
        {pagina.titulo}
      </h1>

      <div className="prose-actimax mt-8 text-[15px] text-foreground/85">{children}</div>

      <Separator className="mt-14" />
      <nav aria-label="Otras políticas" className="mt-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-tinta/45">
          Otras políticas
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {otras.map((otra) => (
            <li key={otra.path}>
              <Link
                href={otra.path}
                className="text-sm font-medium text-azul hover:underline"
              >
                {otra.navLabel}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Cuerpo administrado desde Shopify.
 *
 * Cada página toma su sección del documento consolidado si sigue viniendo
 * entero, y su ranura propia si ya se repartió (ver lib/politicas-secciones).
 * Si no hay ninguna de las dos la página no se queda muda: una política
 * inalcanzable es peor que una desactualizada, así que se ofrece el contacto.
 */
export async function CuerpoDeShopify({
  parte,
  slot,
}: {
  parte: ParteLegal;
  slot: PolicySlot;
}) {
  const policies = await getStorePolicies();
  const html = cuerpoLegal({
    parte,
    documento: policies.termsOfService?.bodyHtml,
    propio: policies[slot]?.bodyHtml,
  });

  if (html === undefined) {
    return (
      <p>
        No pudimos cargar esta política en este momento. Escríbenos a{" "}
        <a href="mailto:ventas@actimax.com.co" className="text-azul underline">
          ventas@actimax.com.co
        </a>{" "}
        y con gusto te la hacemos llegar.
      </p>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
