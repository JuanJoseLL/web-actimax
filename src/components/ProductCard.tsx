import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { typeLabel, type Product } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group h-full">
      <Card className="h-full gap-0 bg-card py-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
        <Link
          href={`/productos/${product.handle}`}
          className="relative block aspect-square overflow-hidden bg-muted"
        >
          {product.images[0] !== undefined ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-contain p-6 mix-blend-multiply transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : null}
          {product.onSale ? (
            <Badge className="absolute left-3 top-3 rounded-sm bg-accent font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              Oferta
            </Badge>
          ) : null}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100"
          />
        </Link>
        <CardContent className="flex flex-1 flex-col px-3 pb-0 pt-3 sm:px-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {typeLabel(product.type)}
          </p>
          <Link href={`/productos/${product.handle}`} className="mt-1 hover:underline">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
              {product.title}
            </h3>
          </Link>
        </CardContent>
        <CardFooter className="mt-3 justify-between gap-2 bg-transparent px-3 py-3 sm:px-4">
          <div>
            {product.onSale ? (
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground line-through">
                {formatCOP(product.regularPrice)}
              </p>
            ) : null}
            <p className="font-mono text-lg font-bold tabular-nums leading-none">
              {formatCOP(product.price)}
            </p>
          </div>
          <AddToCartButton
            product={{
              handle: product.handle,
              title: product.title,
              price: product.price,
              image: product.images[0] ?? null,
            }}
            disabled={!product.inStock}
          />
        </CardFooter>
      </Card>
    </article>
  );
}
