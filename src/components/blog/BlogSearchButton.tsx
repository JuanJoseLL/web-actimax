"use client";

import { SearchIcon } from "lucide-react";
import { openCommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";

export function BlogSearchButton() {
  return <Button type="button" variant="outline" onClick={openCommandPalette} className="mt-6 h-auto min-h-12 w-full max-w-xl justify-start whitespace-normal text-left text-muted-foreground">
    <SearchIcon aria-hidden className="shrink-0" />
    Buscar en el blog
  </Button>;
}
