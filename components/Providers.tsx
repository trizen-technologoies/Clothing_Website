"use client";

import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/CartProvider";
import { WishlistProvider } from "@/components/cart/WishlistProvider";
import { QuickViewProvider } from "@/components/products/QuickView";
import { SmoothScroll } from "@/components/SmoothScroll";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <QuickViewProvider>
          <SmoothScroll />
          {children}
        </QuickViewProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
