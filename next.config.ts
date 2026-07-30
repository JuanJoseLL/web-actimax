import type { NextConfig } from "next";
import legacyUrlRedirects from "./src/data/legacy-url-redirects.json";
import {
  legacyProductRewrites,
  productAliasRedirects,
  wordpressIdRedirects,
} from "./src/lib/product-paths";

const nextConfig: NextConfig = {
  // WordPress publicaba todas las URL con slash final; conservarlo evita
  // redirecciones innecesarias al mover el dominio.
  trailingSlash: true,
  // Cache Components (PPR): shell estático instantáneo + datos cacheados
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Fotos de producto servidas por Shopify
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nada de esta tienda se muestra dentro de iframes de terceros:
          // bloquearlos impide superponer controles ajenos sobre el botón
          // de pago (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
  async redirects() {
    return [...legacyUrlRedirects, ...productAliasRedirects, ...wordpressIdRedirects];
  },
  async rewrites() {
    return legacyProductRewrites;
  },
};

export default nextConfig;
