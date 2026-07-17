import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components (PPR): shell estático instantáneo + datos cacheados
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Fotos de producto servidas por Shopify
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
};

export default nextConfig;
