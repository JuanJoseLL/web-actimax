"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const main = images[active] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted ring-1 ring-border">
        {main !== undefined ? (
          <Image
            src={main}
            alt={alt}
            fill
            priority
            sizes="(min-width: 1280px) 580px, (min-width: 1024px) 50vw, 100vw"
            className="object-contain p-8 mix-blend-multiply"
          />
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <Button
              type="button"
              key={src}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1} de ${images.length}`}
              aria-pressed={i === active}
              variant="outline"
              size="icon"
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted p-0 transition-all ${
                i === active ? "border-primary ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-1.5 mix-blend-multiply"
              />
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
