import { NextResponse } from "next/server";
import redirects from "@/data/legacy-image-redirects.json";

const imageRedirects = redirects as Record<string, string>;

export function GET(request: Request) {
  const sourcePath = new URL(request.url).pathname;
  const destination = imageRedirects[sourcePath];
  if (destination === undefined) {
    // Piezas del sitio viejo sin equivalente (banners de campañas, página de
    // deportistas): mejor llevar al inicio que dejar un 404 tras la migración.
    return NextResponse.redirect(new URL("/", request.url), 308);
  }
  return NextResponse.redirect(destination, 308);
}

export const HEAD = GET;
