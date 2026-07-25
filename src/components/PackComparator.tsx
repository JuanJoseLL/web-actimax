"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRightIcon } from "lucide-react";
import { useState } from "react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCOP } from "@/lib/format";

const SPORT_LABELS: Record<string, string> = {
  running: "Running",
  ciclismo: "Ciclismo",
  triatlon: "Triatlón",
  natacion: "Natación",
  futbol: "Fútbol",
  gym: "Gym",
};

export interface ComparablePack {
  variantId: string | null;
  handle: string;
  title: string;
  price: number;
  regularPrice: number;
  onSale: boolean;
  inStock: boolean;
  excerpt: string;
  image: string | null;
  deportes: string[];
}

function getChallenge(title: string) {
  if (title.includes("70.3")) return "Triatlón media distancia";
  if (title.includes("Gran Fondo")) return "Gran fondo";
  if (title.includes("Alto de Letras")) return "Alto de Letras · 3.679 msnm";
  const distance = title.match(/(10K|15K|21K|42K)/i)?.[1];
  return distance !== undefined ? distance.toUpperCase() : "Reto deportivo";
}

function PackSelect({
  value,
  onValueChange,
  packs,
  label,
}: {
  value: string;
  onValueChange: (value: string) => void;
  packs: ComparablePack[];
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger aria-label={label} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {packs.map((pack) => (
            <SelectItem key={pack.handle} value={pack.handle}>
              {pack.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PackSummary({ pack }: { pack: ComparablePack }) {
  const sports = pack.deportes.map((sport) => SPORT_LABELS[sport] ?? sport).join(" · ");
  return (
    <Card className="h-full gap-0 py-0">
      <CardHeader className="px-5 pt-5">
        <Badge variant="outline" className="w-fit rounded-sm font-mono text-[10px] font-bold uppercase tracking-wider">
          {getChallenge(pack.title)}
        </Badge>
        <CardTitle className="mt-3 font-display text-3xl font-extrabold uppercase italic leading-none">
          {pack.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 px-5 py-5">
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
          {pack.image !== null ? (
            <Image src={pack.image} alt="" fill sizes="(min-width: 1152px) 496px, (min-width: 768px) 45vw, 100vw" className="object-contain p-4 mix-blend-multiply" />
          ) : null}
        </div>
        <dl className="grid gap-4 text-sm">
          <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Enfoque</dt>
            <dd className="mt-1 leading-relaxed">{pack.excerpt}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Deporte</dt>
            <dd className="mt-1">{sports === "" ? "Running y retos de resistencia" : sports}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estrategia</dt>
            <dd className="mt-1">Antes · Durante · Después</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="mt-auto flex-col items-stretch gap-3 bg-muted/45 px-5 py-4">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            {pack.onSale ? <p className="font-mono text-xs text-muted-foreground line-through">{formatCOP(pack.regularPrice)}</p> : null}
            <p className="font-mono text-xl font-bold tabular-nums">{formatCOP(pack.price)}</p>
          </div>
          {pack.onSale ? <Badge className="rounded-sm bg-accent text-accent-foreground">Oferta</Badge> : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/productos/${pack.handle}`}>Ver detalle</Link>
          </Button>
          <AddToCartButton
            product={{ variantId: pack.variantId, handle: pack.handle, title: pack.title, price: pack.price, image: pack.image }}
            disabled={!pack.inStock}
          />
        </div>
      </CardFooter>
    </Card>
  );
}

export function PackComparator({ packs }: { packs: ComparablePack[] }) {
  const [first, setFirst] = useState(packs[0]?.handle ?? "");
  const [second, setSecond] = useState(packs[1]?.handle ?? packs[0]?.handle ?? "");
  const firstPack = packs.find((pack) => pack.handle === first) ?? packs[0];
  const secondPack = packs.find((pack) => pack.handle === second) ?? packs[1] ?? packs[0];

  if (firstPack === undefined || secondPack === undefined) return null;

  return (
    <div>
      <Card className="gap-0 bg-muted py-0">
        <CardContent className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
          <PackSelect label="Primer Energy Pack" value={first} onValueChange={setFirst} packs={packs} />
          <PackSelect label="Segundo Energy Pack" value={second} onValueChange={setSecond} packs={packs} />
        </CardContent>
      </Card>
      {first === second ? (
        <p className="mt-3 text-sm text-muted-foreground">Elige dos packs distintos para contrastar sus estrategias.</p>
      ) : null}
      <div className="mt-8 flex items-center gap-3 text-primary">
        <ArrowLeftRightIcon className="size-4" />
        <p className="font-mono text-xs font-bold uppercase tracking-wider">Comparación lado a lado</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <PackSummary pack={firstPack} />
        <PackSummary pack={secondPack} />
      </div>
    </div>
  );
}
