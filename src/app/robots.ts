import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Rastreadores de los asistentes de IA. La regla "*" ya los permite; se
 * nombran explícitamente para que un bloqueo futuro de "*" no los tumbe
 * sin querer y para dejar claro que la tienda quiere aparecer en ChatGPT,
 * Claude, Gemini y Perplexity.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "meta-externalagent",
  "Amazonbot",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: ["/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
