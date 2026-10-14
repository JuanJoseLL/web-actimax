"use client";

import { useEffect, useState } from "react";
import { NewspaperIcon } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import type { BlogSearchResult } from "@/lib/blog-search";

export function BlogSearchResults({ query, onSelect }: {
  query: string;
  onSelect: (path: string) => void;
}) {
  const [result, setResult] = useState<{ query: string; posts: BlogSearchResult[]; error: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/blog/buscar/?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("No se pudo buscar");
        const posts: BlogSearchResult[] = await response.json();
        if (!controller.signal.aborted) setResult({ query, posts, error: false });
      } catch {
        if (!controller.signal.aborted) setResult({ query, posts: [], error: true });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, attempt]);

  if (result === null || result.query !== query) {
    return <p role="status" className="p-6 text-sm text-muted-foreground">Buscando artículos…</p>;
  }
  if (result.error) {
    return <div role="status" className="p-6 text-sm text-muted-foreground">
      <p>No pudimos cargar los artículos.</p>
      <button type="button" className="mt-3 min-h-11 underline" onClick={() => { setResult(null); setAttempt((value) => value + 1); }}>Volver a intentar</button>
    </div>;
  }
  if (result.posts.length === 0) {
    return <p role="status" className="p-6 text-sm text-muted-foreground">No encontramos artículos para esta búsqueda. Prueba con otro tema, como geles, hidratación o recuperación.</p>;
  }
  return <CommandGroup heading={query.trim() ? "Artículos del blog" : "Artículos recientes"}>
    {result.posts.map((post) => <CommandItem key={post.path} value={post.path} onSelect={() => onSelect(post.path)} className="items-start py-3">
      <NewspaperIcon aria-hidden className="mt-1 shrink-0 text-azul" />
      <span className="min-w-0">
        <span className="block font-medium">{post.title}</span>
        <span className="mt-1 block line-clamp-2 text-xs text-muted-foreground">{post.excerpt}</span>
        <span className="mt-2 block font-mono text-[10px] uppercase text-muted-foreground">{post.category} · {post.minutes} min de lectura</span>
      </span>
    </CommandItem>)}
  </CommandGroup>;
}
