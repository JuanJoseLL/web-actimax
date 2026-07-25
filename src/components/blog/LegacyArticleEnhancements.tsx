"use client";

import { useEffect } from "react";

const PACK_LINKS: Record<string, { href: string; label: string }> = {
  "10k": { href: "/productos/energy-pack-de-10k/", label: "Ver Energy Pack 10K" },
  "15k": { href: "/productos/energy-pack-15k/", label: "Ver Energy Pack 15K" },
  "21k": { href: "/productos/energy-pack-media-maraton-21k/", label: "Ver Energy Pack 21K" },
  "42k": { href: "/productos/energy-pack-maraton-42k/", label: "Ver Energy Pack Maratón" },
  otro: { href: "/productos/?tipo=geles", label: "Explorar geles energéticos" },
};

/** Devuelve true si el script ya estaba cargado de un artículo anterior. */
function ensureScript(id: string, src: string): boolean {
  if (document.getElementById(id) !== null) return true;
  const script = document.createElement("script");
  script.id = id;
  script.src = src;
  script.async = true;
  document.body.append(script);
  return false;
}

interface InstagramEmbedApi {
  Embeds?: { process?: () => void };
}

export function LegacyArticleEnhancements() {
  useEffect(() => {
    if (document.querySelector(".instagram-media") !== null) {
      const alreadyLoaded = ensureScript(
        "actimax-instagram-embed",
        "https://www.instagram.com/embed.js",
      );
      /* El script solo recorre el DOM al cargarse: si venimos de otro
         artículo hay que pedirle que vuelva a mirar. */
      if (alreadyLoaded) {
        (window as { instgrm?: InstagramEmbedApi }).instgrm?.Embeds?.process?.();
      }
    }
    if (document.querySelector(".exco") !== null) {
      ensureScript("actimax-exco-embed", "https://embed.ex.co/sdk.js");
    }

    const distance = document.querySelector<HTMLSelectElement>("#distancia-carrera");
    const duration = document.querySelector<HTMLSelectElement>("#tiempo-actividad-select");
    const button = document.querySelector<HTMLButtonElement>("#btn-calcular-geles");
    const results = document.querySelector<HTMLElement>("#calculadora-resultados");
    const timing = document.querySelector<HTMLElement>("#resultado-timing");
    const link = document.querySelector<HTMLElement>("#resultado-link");
    if (distance === null || duration === null || button === null || results === null || timing === null || link === null) {
      return;
    }

    const hideResults = () => {
      results.style.display = "none";
    };
    const calculate = () => {
      const minutes = Number.parseInt(duration.value, 10);
      if (distance.value === "" || !Number.isFinite(minutes) || minutes <= 0) {
        timing.textContent = "Selecciona una distancia y un tiempo estimado para calcular tu plan.";
        link.replaceChildren();
        results.style.display = "block";
        return;
      }

      const gelCount = minutes < 40 ? 0 : minutes < 60 ? 1 : 1 + Math.floor((minutes - 45) / 40);
      timing.textContent =
        gelCount === 0
          ? "Para esta duración normalmente no necesitas geles si comienzas bien alimentado."
          : `Lleva ${gelCount} gel${gelCount === 1 ? "" : "es"}. Toma el primero cerca del minuto 45 y los siguientes cada 40 a 45 minutos, siempre con agua.`;

      const pack = PACK_LINKS[distance.value] ?? PACK_LINKS.otro;
      const anchor = document.createElement("a");
      anchor.href = pack.href;
      anchor.textContent = pack.label;
      link.replaceChildren(anchor);
      results.style.display = "block";
    };

    button.addEventListener("click", calculate);
    distance.addEventListener("change", hideResults);
    duration.addEventListener("change", hideResults);
    return () => {
      button.removeEventListener("click", calculate);
      distance.removeEventListener("change", hideResults);
      duration.removeEventListener("change", hideResults);
    };
  }, []);

  return null;
}
