import type { Metadata } from "next";
import { Lato, Rubik, Space_Mono } from "next/font/google";
import { DestinosClient } from "./DestinosClient";

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

export const metadata: Metadata = {
  title: "Destinos y Retos Deportivos | Actimax × WOPU",
  description:
    "Experiencias deportivas por Europa diseñadas alrededor de grandes retos, operadas por WOPU Travel junto a Actimax.",
  alternates: {
    canonical: "https://actimax.com.co/destinos",
  },
  openGraph: {
    title: "Destinos y Retos Deportivos | Actimax × WOPU",
    description:
      "Viajes deportivos por Europa alrededor de maratones y rutas ciclistas, con operación de WOPU Travel y la comunidad Actimax.",
    url: "https://actimax.com.co/destinos",
    siteName: "Actimax",
    locale: "es_CO",
    type: "website",
  },
  robots: isPublic
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Destinos Actimax × WOPU Travel",
  url: "https://actimax.com.co/destinos",
  inLanguage: "es-CO",
  description:
    "Experiencias deportivas por Europa diseñadas alrededor de maratones y rutas ciclistas.",
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

export default function DestinosPage() {
  return (
    <div className={`${rubik.variable} ${lato.variable} ${mono.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <DestinosClient />
    </div>
  );
}
