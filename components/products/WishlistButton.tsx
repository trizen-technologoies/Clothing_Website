"use client";

import { Heart } from "lucide-react";

import { useWishlist } from "@/components/cart/WishlistProvider";

export function WishlistButton({ slug, name, className = "" }: { slug: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(slug);
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`inline-flex size-10 items-center justify-center text-fg transition-colors hover:text-cyan ${className}`}
    >
      <Heart className={`size-4 transition-transform duration-300 ${saved ? "scale-110 fill-cyan text-cyan" : ""}`} strokeWidth={1.5} />
    </button>
  );
}
