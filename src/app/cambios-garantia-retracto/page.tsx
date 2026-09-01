import type { Metadata } from "next";
import { CuerpoDeShopify, DocumentoLegal } from "@/components/DocumentoLegal";
import { PAGINAS_LEGALES } from "@/data/politicas";
import { pageMetadata } from "@/lib/seo";

const PAGINA = PAGINAS_LEGALES.cambios;

export const metadata: Metadata = pageMetadata({
  title: PAGINA.metaTitle,
  description: PAGINA.description,
  path: PAGINA.path,
});

export default function Page() {
  return (
    <DocumentoLegal pagina={PAGINA}>
      <CuerpoDeShopify parte="cambios" slot={PAGINA.slot} />
    </DocumentoLegal>
  );
}
