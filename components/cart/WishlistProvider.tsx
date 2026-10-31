"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";

import { createLocalStore } from "@/lib/local-store";

const EMPTY: string[] = [];

const wishlistStore = createLocalStore<string[]>("vanta.wishlist.v1", EMPTY, (raw) =>
  Array.isArray(raw) ? raw.filter((s): s is string => typeof s === "string") : EMPTY,
);

type WishlistContextValue = {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
};

// Inert default for rendering outside the provider (see CartProvider).
const WishlistContext = createContext<WishlistContextValue>({ slugs: EMPTY, has: () => false, toggle: () => {} });

/** Saved products, kept in this browser only (no account required). */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const slugs = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot, wishlistStore.getServerSnapshot);

  const value = useMemo<WishlistContextValue>(
    () => ({
      slugs,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) =>
        wishlistStore.set((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])),
    }),
    [slugs],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}
