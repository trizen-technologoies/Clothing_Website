"use client";

import Link from "next/link";

import { ProductGrid } from "@/components/products/ProductGrid";
import { btn } from "@/components/ui/buttons";
import type { Product } from "@/lib/commerce/types";
import { useHydrated } from "@/lib/local-store";
import { useWishlist } from "./WishlistProvider";

export function WishlistGrid({ products }: { products: Product[] }) {
  const { slugs } = useWishlist();
  const hydrated = useHydrated();
  const saved = products.filter((p) => slugs.includes(p.slug));

  if (!hydrated) return <div className="h-40 animate-pulse bg-card" aria-hidden />;

  if (saved.length === 0) {
    return (
      <div className="border border-line px-6 py-16 text-center">
        <p className="font-display-x text-4xl">No saved pieces</p>
        <p className="mt-3 text-sm text-muted">Tap the heart on any product to keep it here.</p>
        <Link href="/shop" className={`${btn.secondary} mt-8`}>
          Browse the shop
        </Link>
      </div>
    );
  }

  return <ProductGrid products={saved} numbered={false} />;
}
