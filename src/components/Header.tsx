"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MenuIcon, SearchIcon, ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import { useIsMac } from "@/lib/useIsMac";
import { useCart } from "@/components/cart/CartProvider";
import { openCommandPalette } from "@/components/CommandPalette";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV = [
  { label: "Comprar", href: "/productos" },
  { label: "Por reto", href: "/#retos" },
  { label: "El método", href: "/#metodo" },
  { label: "Historias", href: "/#historias" },
  { label: "Blog", href: "/blog" },
  { label: "Club", href: "/#club" },
];

export function Header() {
  const { count, open } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMac = useIsMac();

  return (
    <header className="sticky top-0 z-40 bg-background/92 shadow-[0_1px_0_rgba(10,17,40,0.08)] backdrop-blur-xl">
      <div
        aria-hidden
        className="h-[3px] bg-[linear-gradient(90deg,#002f87_0%,#0a50d0_62%,#ffd23c_100%)]"
      />
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Actimax — inicio">
          <Image
            src="/actimax-logo.svg"
            alt="Actimax"
            width={150}
            height={34}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-6 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative font-display text-base font-bold uppercase tracking-wide text-foreground transition-colors hover:text-primary lg:text-lg"
            >
              {item.label}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100"
              />
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            className="xl:hidden"
            aria-label="Buscar en la tienda"
          >
            <SearchIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openCommandPalette}
            className="hidden h-9 gap-2 rounded-full border-border pl-3 pr-1.5 font-normal text-muted-foreground hover:text-foreground xl:flex"
            aria-label="Buscar en la tienda"
          >
            <SearchIcon className="size-4" />
            <span className="text-sm">Buscar</span>
            <Kbd className="ml-2 font-mono">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
          </Button>
          <Button
            asChild
            variant="raceSun"
            className="hidden h-9 px-4 lg:inline-flex"
          >
            <Link href="/#retos">
              Mi próximo reto
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={open}
            className="relative"
            aria-label={`Abrir carrito${count > 0 ? `, ${count} productos` : ""}`}
          >
            <ShoppingCartIcon />
            {count > 0 ? (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-accent px-1 font-mono text-[11px] font-bold tabular-nums text-accent-foreground">
                {count}
              </Badge>
            ) : null}
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="top"
              className="gap-0 border-0 bg-foreground p-0 text-background md:hidden"
            >
              <SheetHeader className="border-b border-background/15 px-6 py-5">
                <SheetTitle className="font-display text-2xl font-bold uppercase italic tracking-wide text-background">
                  Menú
                </SheetTitle>
              </SheetHeader>
              <nav className="px-6 py-3" aria-label="Principal móvil">
                <ul className="flex flex-col">
                  {NAV.map((item, index) => (
                    <li key={item.label} className={index > 0 ? "border-t border-background/15" : ""}>
                      <SheetClose asChild>
                        <Link href={item.href} className="flex items-baseline gap-4 py-4">
                          <span aria-hidden className="font-mono text-[11px] text-accent">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-display text-3xl font-bold uppercase italic tracking-wide">
                            {item.label}
                          </span>
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
