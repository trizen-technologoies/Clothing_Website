"use client";

import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useId, useMemo } from "react";

import { CATEGORIES, CATEGORY_LABELS, totalStock, type Category, type Product } from "@/lib/commerce/types";
import { ProductGrid } from "./ProductGrid";

const SORTS = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;
type Sort = keyof typeof SORTS;

function sortProducts(products: Product[], sort: Sort) {
  const list = [...products];
  switch (sort) {
    case "newest":
      return list.sort((a, b) => b.releasedAt.localeCompare(a.releasedAt));
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    default:
      return list.sort((a, b) => (a.featuredRank ?? 50) + (a.bestsellerRank ?? 50) - ((b.featuredRank ?? 50) + (b.bestsellerRank ?? 50)));
  }
}

/** Category filter + sort, mirrored into the URL so results are shareable. */
export function ShopCatalogue({ products }: { products: Product[] }) {
  const params = useSearchParams();
  const sortId = useId();

  const categoryParam = params.get("category");
  const category: Category | "all" = CATEGORIES.includes(categoryParam as Category) ? (categoryParam as Category) : "all";
  const sortParam = params.get("sort");
  const sort: Sort = sortParam && sortParam in SORTS ? (sortParam as Sort) : "featured";
  const inStock = params.get("stock") === "1";

  const results = useMemo(() => {
    const filtered = products.filter(
      (p) => (category === "all" || p.category === category) && (!inStock || p.colors.some((c) => totalStock(c) > 0)),
    );
    return sortProducts(filtered, sort);
  }, [products, category, sort, inStock]);

  // Shallow URL update: Next keeps useSearchParams in sync without a server round trip.
  function update(next: Record<string, string | null>) {
    // Read the live URL: `params` can lag behind consecutive quick updates.
    const sp = new URLSearchParams(window.location.search);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [products]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 pb-24 sm:px-6 lg:px-10">
      <div className="sticky top-16 z-20 -mx-4 mb-10 border-y border-line bg-ink/85 px-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Filter by category" className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(["all", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => update({ category: c === "all" ? null : c })}
                className="eyebrow h-9 shrink-0 border border-transparent px-3.5 text-muted transition-colors hover:text-fg aria-pressed:border-line-strong aria-pressed:text-fg"
              >
                {c === "all" ? "All" : CATEGORY_LABELS[c]}
                <span className="ml-1.5 text-muted/60">{counts[c] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-5">
            <label className="eyebrow flex cursor-pointer items-center gap-2 whitespace-nowrap text-muted">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => update({ stock: e.target.checked ? "1" : null })}
                className="size-3.5 accent-cyan"
              />
              In stock
            </label>
            <div className="relative flex items-center gap-2">
              {/* Visible from 400px; always available to screen readers. */}
              <label htmlFor={sortId} className="eyebrow sr-only text-muted min-[400px]:not-sr-only">
                Sort
              </label>
              <select
                id={sortId}
                value={sort}
                onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
                className="eyebrow h-9 appearance-none border border-line bg-ink-2 pl-3 pr-8 text-fg focus:border-fg focus:outline-none"
              >
                {Object.entries(SORTS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden className="pointer-events-none absolute right-2.5 size-3.5 text-muted" />
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="eyebrow mb-6 text-muted">
        Showing {results.length} of {products.length} pieces
      </p>
      {results.length > 0 ? (
        <ProductGrid products={results} />
      ) : (
        <div className="border border-line px-6 py-20 text-center">
          <p className="font-display-x text-4xl">Nothing here — yet.</p>
          <p className="mt-3 text-sm text-muted">Try another category or include sold-out pieces.</p>
          <button type="button" onClick={() => update({ category: null, stock: null })} className="eyebrow mt-6 text-fg underline underline-offset-4">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
