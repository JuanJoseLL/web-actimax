"use client";

import { usePathname } from "next/navigation";

export function HideOnDestinos({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDestinos = pathname === "/destinos" || pathname.startsWith("/destinos/");

  return isDestinos ? null : children;
}
