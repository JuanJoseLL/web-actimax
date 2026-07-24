import type { NextConfig } from "next";

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
      // Respaldo temporal mientras los artículos se copian a Shopify.
      { protocol: "https", hostname: "actimax.com.co" },
    ],
  },
};

export default nextConfig;
