import type { Metadata } from "next";
import { CuerpoDeShopify, DocumentoLegal } from "@/components/DocumentoLegal";
import { PAGINAS_LEGALES } from "@/data/politicas";
import { pageMetadata } from "@/lib/seo";

const PAGINA = PAGINAS_LEGALES.envios;

export const metadata: Metadata = pageMetadata({
  title: PAGINA.metaTitle,
  description: PAGINA.description,
  path: PAGINA.path,
});

export default function Page() {
  return (
    <DocumentoLegal pagina={PAGINA}>
      <CuerpoDeShopify parte="envios" slot={PAGINA.slot} />
    </DocumentoLegal>
  );
}
