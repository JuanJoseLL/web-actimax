import type { MetadataRoute } from "next";
import { CATEGORIAS } from "@/data/categorias";
import { DEPORTES } from "@/data/deportes";
import { INDICE_LEGAL_PATH, PAGINAS_LEGALES_ORDENADAS } from "@/data/politicas";
import { getAllBlogPosts, getBlogCategories } from "@/lib/blog";
import { getAllProducts } from "@/lib/catalog";
import { SITE_URL, productUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, products] = await Promise.all([getAllBlogPosts(), getAllProducts()]);

  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/mi-plan/`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/productos/`, changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIAS.map((categoria) => ({
      url: `${SITE_URL}${categoria.path}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...DEPORTES.map((deporte) => ({
      url: `${SITE_URL}${deporte.path}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/productos/comparar/`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/preguntas-frecuentes/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}${INDICE_LEGAL_PATH}`, changeFrequency: "yearly", priority: 0.3 },
    ...PAGINAS_LEGALES_ORDENADAS.map((pagina) => ({
      url: `${SITE_URL}${pagina.path}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
    ...products.map((product) => ({
      url: productUrl(product.handle),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: product.images.length > 0 ? [product.images[0]] : undefined,
    })),
    { url: `${SITE_URL}/blog/`, changeFrequency: "weekly", priority: 0.8 },
    ...getBlogCategories().map((category) => ({
      url: `${SITE_URL}${category.path}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}${post.path}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      images: post.image !== null ? [post.image.url] : undefined,
    })),
  ];
}
