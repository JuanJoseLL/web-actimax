import type { Metadata } from "next";
import { Lato, Rubik, Space_Mono } from "next/font/google";
import { DestinosPreview } from "./DestinosClient";
import { getDestinosData } from "./shopify-data";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-destinos-rubik",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-destinos-lato",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-destinos-mono",
  display: "swap",
});

const isPublic = process.env.DESTINOS_PUBLIC === "true";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getDestinosData();
  const values = seo.values;
  const title = String(
    values.meta_title ?? "Destinos y Retos Deportivos | Actimax × WOPU",
  );
  const description = String(
    values.meta_description ??
      "Experiencias deportivas por Europa diseñadas alrededor de grandes retos, operadas por WOPU Travel junto a Actimax.",
  );
  const canonical = String(
    values.canonical_url ?? "https://actimax.com.co/destinos/",
  );
  const ogImage = seo.media.og_image;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: String(values.og_title ?? title),
      description: String(values.og_description ?? description),
      url: canonical,
      siteName: "Actimax",
      locale: String(values.language ?? "es_CO").replace("-", "_"),
      type: "website",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: isPublic
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true },
  };
}

export default async function DestinosPage() {
  const data = await getDestinosData();
  const seo = data.seo.values;
  const canonical = String(
    seo.canonical_url ?? "https://actimax.com.co/destinos/",
  );
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: String(seo.schema_name ?? "Destinos Actimax × WOPU Travel"),
    url: canonical,
    inLanguage: String(seo.language ?? "es-CO"),
    description: String(
      seo.schema_description ??
        "Experiencias deportivas por Europa diseñadas alrededor de maratones y rutas ciclistas.",
    ),
    isPartOf: {
      "@type": "WebSite",
      name: "Actimax",
      url: "https://actimax.com.co/",
    },
    provider: {
      "@type": "Organization",
      name: "WOPU Travel",
      url: "https://www.woputravel.com/",
    },
  };

  return (
    <div className={`${rubik.variable} ${lato.variable} ${mono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <DestinosPreview data={data} />
    </div>
  );
}
