"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";

import { lineKey, productPhotos, type CartLine, type Product, type ProductColor } from "@/lib/commerce/types";
import { createLocalStore, useHydrated } from "@/lib/local-store";

const MAX_PER_LINE = 10;
const EMPTY: CartLine[] = [];

const cartStore = createLocalStore<CartLine[]>("vanta.cart.v1", EMPTY, (raw) =>
  Array.isArray(raw)
    ? raw.filter((l): l is CartLine => typeof l?.key === "string" && typeof l?.quantity === "number" && l.quantity > 0)
    : EMPTY,
);

function clampQuantity(line: CartLine, quantity: number) {
  return Math.max(0, Math.min(quantity, line.maxQuantity, MAX_PER_LINE));
}

type CartContextValue = {
  lines: CartLine[];
  /** False until the persisted cart has been read on the client. */
  hydrated: boolean;
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, color: ProductColor, size: string, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const noop = () => {};

// Default used outside the provider (e.g. when Next validates a page segment
// in isolation): an empty, inert cart rather than a crash.
const CartContext = createContext<CartContextValue>({
  lines: EMPTY,
  hydrated: false,
  count: 0,
  subtotal: 0,
  isOpen: false,
  openCart: noop,
  closeCart: noop,
  addItem: noop,
  setQuantity: noop,
  removeItem: noop,
  clear: noop,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
  const hydrated = useHydrated();
  const [isOpen, setOpen] = useState(false);

  const addItem = useCallback((product: Product, color: ProductColor, size: string, quantity = 1) => {
    const incoming: CartLine = {
      key: lineKey(product.id, color.id, size),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      currency: product.currency,
      colorId: color.id,
      colorName: color.name,
      colorHex: color.hex,
      size,
      quantity,
      garment: product.garment,
      graphic: product.graphic,
      image: productPhotos(product, color)[0]?.src,
      variantId: color.variantIds?.[size],
      maxQuantity: color.stock[size] ?? 0,
    };

    cartStore.set((prev) => {
      const existing = prev.find((l) => l.key === incoming.key);
      if (!existing) return [...prev, { ...incoming, quantity: clampQuantity(incoming, quantity) }];
      return prev.map((l) =>
        l.key === incoming.key ? { ...incoming, quantity: clampQuantity(incoming, l.quantity + quantity) } : l,
      );
    });
    setOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      hydrated,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.quantity, 0),
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      addItem,
      setQuantity: (key, quantity) =>
        cartStore.set((prev) =>
          prev.map((l) => (l.key === key ? { ...l, quantity: clampQuantity(l, quantity) } : l)).filter((l) => l.quantity > 0),
        ),
      removeItem: (key) => cartStore.set((prev) => prev.filter((l) => l.key !== key)),
      clear: () => cartStore.set(() => EMPTY),
    }),
    [lines, hydrated, isOpen, addItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}

export const CART_MAX_PER_LINE = MAX_PER_LINE;
