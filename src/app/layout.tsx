import type { Metadata } from "next";
import { Archivo, Barlow_Condensed, Chivo_Mono } from "next/font/google";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { MetaPixel } from "@/components/MetaPixel";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CommandPalette, type PaletteProduct } from "@/components/CommandPalette";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/sonner";
import { getAllProducts } from "@/lib/catalog";
import { initialProductVariant } from "@/lib/product-variants";
import { DEFAULT_OG_IMAGE, SITE_URL, jsonLd, organizationJsonLd, webSiteJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const chivoMono = Chivo_Mono({
  variable: "--font-chivo-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Actimax — Geles energéticos y nutrición deportiva de Colombia",
  description:
    "El combustible de tu próxima meta: geles energéticos con y sin cafeína, bebidas deportivas, barras de proteína y Energy Packs por distancia. Nutrición deportiva hecha en Colombia, con envíos a todo el país.",
  keywords: [
    "geles deportivos",
    "geles energéticos",
    "gel energético Colombia",
    "nutrición deportiva",
    "bebidas deportivas",
    "Energy Pack",
    "running",
    "ciclismo",
    "maratón",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Actimax",
    url: "/",
    title: "Actimax — Geles energéticos y nutrición deportiva de Colombia",
    description:
      "Geles energéticos, bebidas deportivas, barras de proteína y Energy Packs por distancia. Hecho en Colombia, con envíos a todo el país.",
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", archivo.variable, barlowCondensed.variable, chivoMono.variable, "font-sans")}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(webSiteJsonLd()) }}
        />
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppButton />
          <CartDrawer />
          <Suspense fallback={null}>
            <StoreCommandPalette />
          </Suspense>
          <Toaster position="top-right" offset={{ top: 108 }} mobileOffset={{ top: 108 }} />
        </CartProvider>
        <Analytics />
        {process.env.NEXT_PUBLIC_META_PIXEL_ID ? (
          <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
        ) : null}
      </body>
      {process.env.NEXT_PUBLIC_GA_ID ? (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
      ) : null}
    </html>
  );
}

async function StoreCommandPalette() {
  const paletteProducts: PaletteProduct[] = (await getAllProducts()).map((p) => {
    const variant = initialProductVariant(p.variants);
    return {
      variantId: p.variantId,
      variantTitle: variant?.title,
      hasMultipleVariants: p.variants.length > 1,
      handle: p.handle,
      title: p.title,
      type: p.type,
      momentos: p.momentos,
      deportes: p.deportes,
      price: p.price,
      image: variant?.image ?? p.images[0] ?? null,
      inStock: variant?.inStock ?? p.inStock,
    };
  });

  return <CommandPalette products={paletteProducts} />;
}
