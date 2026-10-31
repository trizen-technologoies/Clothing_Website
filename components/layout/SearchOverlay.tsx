"use client";

import { ArrowUpRight, Search, X } from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useState } from "react";

import { LineThumb } from "@/components/products/LineThumb";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORY_LABELS, type Category } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import type { GarmentKind } from "@/lib/garments";

export type SearchItem = {
  slug: string;
  name: string;
  category: Category;
  price: number;
  currency: string;
  garment: GarmentKind;
  graphic?: boolean;
  colorHex: string;
  image?: string;
  colors: string[];
};

const SUGGESTIONS = ["Hoodie", "Jacket", "Cargo", "Tee", "Bone"];

export function SearchOverlay({ open, onClose, items }: { open: boolean; onClose: () => void; items: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const titleId = useId();
  const inputId = useId();

  const results = useMemo(() => {
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    return items.filter((item) => {
      const haystack = [item.name, CATEGORY_LABELS[item.category], item.category, ...item.colors].join(" ").toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [items, query]);

  return (
    <Sheet open={open} onClose={onClose} side="top" labelledBy={titleId} className="w-full border-b border-line bg-ink-2">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="eyebrow text-muted">
            Search
          </h2>
          <button type="button" onClick={onClose} aria-label="Close search" className="-mr-2 inline-flex size-10 items-center justify-center text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-4 flex items-center gap-4 border-b border-line-strong pb-4 focus-within:border-fg">
          <Search className="size-6 shrink-0 text-muted" strokeWidth={1.5} />
          <label htmlFor={inputId} className="sr-only">
            Search products
          </label>
          <input
            id={inputId}
            type="search"
            autoFocus
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // A search input swallows Escape to clear itself; close the overlay instead.
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Search the collection"
            className="font-display-x w-full bg-transparent text-4xl placeholder:text-muted/40 focus:outline-none sm:text-6xl"
          />
        </form>

        <div className="mt-8" aria-live="polite">
          {!query.trim() ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow mr-2 text-muted">Popular</span>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setQuery(s)} className="eyebrow h-9 border border-line px-4 text-muted transition-colors hover:border-fg hover:text-fg">
                  {s}
                </button>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted">No pieces match “{query}”. Try a category like hoodie or cargo.</p>
          ) : (
            <>
              <p className="eyebrow mb-4 text-muted">
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/products/${item.slug}`} onClick={onClose} className="group flex items-center gap-4 border border-line p-2 pr-4 transition-colors hover:border-line-strong hover:bg-card">
                      <span className="block h-20 w-16 shrink-0 overflow-hidden bg-card">
                        <LineThumb image={item.image} garment={item.garment} graphic={item.graphic} colorHex={item.colorHex} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.name}</span>
                        <span className="eyebrow mt-1 block text-[0.625rem] text-muted">{CATEGORY_LABELS[item.category]}</span>
                      </span>
                      <span className="font-mono text-xs">{formatPrice(item.price, item.currency)}</span>
                      <ArrowUpRight className="size-4 text-muted transition-colors group-hover:text-cyan" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}
