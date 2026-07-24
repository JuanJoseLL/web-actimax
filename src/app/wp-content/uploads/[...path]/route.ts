import { NextResponse } from "next/server";
import redirects from "@/data/legacy-image-redirects.json";

const imageRedirects = redirects as Record<string, string>;

export function GET(request: Request) {
  const sourcePath = new URL(request.url).pathname;
  const destination = imageRedirects[sourcePath];
  if (destination === undefined) {
    return new NextResponse("Imagen no encontrada", { status: 404 });
  }
  return NextResponse.redirect(destination, 308);
}

export const HEAD = GET;
