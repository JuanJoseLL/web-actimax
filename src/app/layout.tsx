import type { Metadata } from "next";
import { Archivo, Barlow_Condensed, Chivo_Mono } from "next/font/google";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { MetaPixel } from "@/components/MetaPixel";
import { WebAnalytics } from "@/components/WebAnalytics";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CommandPalette, type PaletteProduct } from "@/components/CommandPalette";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SECUENCIA_TEXTO } from "@/components/SecuenciaNumerica";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Toaster } from "@/components/ui/sonner";
import { getAllProducts, type Product } from "@/lib/catalog";
import type { UpsellProduct } from "@/lib/envio-gratis";
import { initialProductVariant, selectableProductOptions } from "@/lib/product-variants";
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
  verification: {
    google: "Kt-XITSujRq2joodF8lqkL8eSg4VbbyZM77ehWmAC1g",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const productsPromise = getAllProducts();

  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", archivo.variable, barlowCondensed.variable, chivoMono.variable, "font-sans")}
    >
      <body className="flex min-h-full flex-col" data-secuencia={SECUENCIA_TEXTO}>
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
          <CartDrawer productsPromise={productsPromise.then(cartUpsellProducts)} />
          <Suspense fallback={null}>
            <StoreCommandPalette productsPromise={productsPromise} />
          </Suspense>
          <Toaster position="top-right" offset={{ top: 108 }} mobileOffset={{ top: 108 }} />
        </CartProvider>
        <WebAnalytics />
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

/**
 * Catálogo que puede aparecer como sugerencia para completar el envío gratis.
 *
 * Antes exigía una sola variante, y eso dejaba fuera a todas las bebidas y
 * los geles —cada uno tiene sabores—, así que lo único proponible eran
 * Energy Packs: a quien ya llevaba un pack se le ofrecía otro pack. Ahora
 * entran los multivariante con solo sus sabores disponibles, y el sabor se
 * elige dentro del carrito.
 */
function cartUpsellProducts(products: Product[]): UpsellProduct[] {
  return products.flatMap((product) => {
    if (!product.inStock) return [];
    const variants = product.variants.filter(
      (variant) => variant.inStock && variant.price > 0,
    );
    const variant = initialProductVariant(variants);
    if (variant === undefined) return [];

    return [{
      variantId: variant.id ?? product.variantId,
      handle: product.handle,
      title: product.title,
      type: product.type,
      /* La brecha se mide contra el sabor más barato: hoy todos cuestan
         igual, pero si un día no, la sugerencia no debe prometer de más. */
      price: Math.min(...variants.map((available) => available.price)),
      image: variant.image ?? product.images[0] ?? null,
      /* Las opciones se rearman desde las variantes disponibles para que el
         selector no ofrezca un sabor agotado. */
      options: selectableProductOptions([], variants),
      variants,
    }];
  });
}

async function StoreCommandPalette({
  productsPromise,
}: {
  productsPromise: Promise<Product[]>;
}) {
  const paletteProducts: PaletteProduct[] = (await productsPromise).map((p) => {
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
