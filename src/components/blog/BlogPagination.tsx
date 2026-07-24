import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function pageHref(page: number): string {
  return page === 1 ? "/blog/" : `/blog/pagina/${page}/`;
}

// Primera, última y vecinas de la actual; el resto se colapsa en "…".
function pageItems(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const visible = [...new Set([1, 2, current - 1, current, current + 1, total - 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);

  const items: Array<number | "gap"> = [];
  let previous = 0;
  for (const page of visible) {
    if (page - previous > 1) items.push("gap");
    items.push(page);
    previous = page;
  }
  return items;
}

const itemClass =
  "flex h-10 min-w-10 items-center justify-center rounded-md border border-border px-2 font-mono text-sm tabular-nums transition-colors";

export function BlogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación del blog" className="mt-14 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} rel="prev" aria-label="Página anterior" className={cn(itemClass, "hover:border-primary hover:text-primary")}>
          <ChevronLeftIcon className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(itemClass, "border-transparent text-muted-foreground/40")}>
          <ChevronLeftIcon className="size-4" />
        </span>
      )}

      {pageItems(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 font-mono text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={pageHref(item)}
            aria-label={`Página ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              itemClass,
              item === page
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:border-primary hover:text-primary",
            )}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={pageHref(page + 1)} rel="next" aria-label="Página siguiente" className={cn(itemClass, "hover:border-primary hover:text-primary")}>
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(itemClass, "border-transparent text-muted-foreground/40")}>
          <ChevronRightIcon className="size-4" />
        </span>
      )}
    </nav>
  );
}
