import type { NextConfig } from "next";
import legacyUrlRedirects from "./src/data/legacy-url-redirects.json";
import {
  legacyProductRewrites,
  productAliasRedirects,
  retiredProductRedirects,
  wordpressIdRedirects,
} from "./src/lib/product-paths";

const nextConfig: NextConfig = {
  // WordPress publicaba todas las URL con slash final; conservarlo evita
  // redirecciones innecesarias al mover el dominio.
  trailingSlash: true,
  // Cache Components (PPR): shell estático instantáneo + datos cacheados
  cacheComponents: true,
  // Prefetchea un único App Shell por ruta en vez de repetir el payload por
  // cada enlace; los datos de params/searchParams se resuelven tras navegar.
  partialPrefetching: true,
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
    return [
      // La cuenta de clientes vive en las páginas alojadas de Shopify (login
      // sin contraseña); /account en el dominio de la tienda redirige allí con
      // locale=es. /mi-cuenta/ era la URL de WooCommerce. No es permanent por
      // si las cuentas pasan a servirse bajo un dominio propio tras el corte.
      {
        source: "/mi-cuenta/:path*",
        destination: `https://${process.env.SHOPIFY_STORE_DOMAIN ?? "actimax-hzfavz8j.myshopify.com"}/account`,
        permanent: false,
      },
      // El WordPress viejo servía el sitio en inglés bajo /en/ y Google sigue
      // mostrando esas URLs (1.964 impresiones al mes en agosto de 2026); el
      // 301 le pasa esa autoridad a la página en español equivalente. Hoy la
      // regla del firewall sobre /en reta a todo el mundo con un 429: para
      // que Googlebot y bingbot lleguen a este redirect hay que excluirlos
      // de esa regla (sigue retando al resto, que es tráfico bot).
      // `:path+` con el slash final en el destino evita la cadena
      // /en/x/ → /x → /x/ (dos saltos) que deja el 308 de trailingSlash.
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path+", destination: "/:path+/", permanent: true },
      ...legacyUrlRedirects,
      ...productAliasRedirects,
      ...retiredProductRedirects,
      ...wordpressIdRedirects,
    ];
  },
  async rewrites() {
    return legacyProductRewrites;
  },
};

export default nextConfig;
