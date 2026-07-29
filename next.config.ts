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
  async redirects() {
    return [...legacyUrlRedirects, ...productAliasRedirects, ...wordpressIdRedirects];
  },
  async rewrites() {
    return legacyProductRewrites;
  },
};

export default nextConfig;
