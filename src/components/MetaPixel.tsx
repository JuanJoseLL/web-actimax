"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useRef } from "react";

/**
 * Pixel de Meta (Facebook/Instagram). El snippet dispara el PageView de la
 * carga inicial; el efecto cubre las navegaciones internas del App Router,
 * que cambian de página sin recargar y el pixel no ve solo.
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const initialPath = useRef<string | null>(null);

  useEffect(() => {
    if (initialPath.current === null) {
      initialPath.current = pathname;
      return;
    }
    if (pathname === initialPath.current) return;
    initialPath.current = pathname;
    window.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
