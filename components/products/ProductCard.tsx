"use client";

import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { CATEGORY_LABELS, productPhotos, type Product } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { ColorSwatches } from "./ColorSwatches";
import { ProductMedia } from "./ProductMedia";
import { useQuickView } from "./QuickView";
import { WishlistButton } from "./WishlistButton";

type Props = {
  product: Product;
  /** Editorial index label, e.g. "01". */
  index?: string;
  sizes?: string;
  priority?: boolean;
};

export function ProductCard({ product, index, sizes, priority }: Props) {
  const [colorId, setColorId] = useState(product.colors[0].id);
  const { addItem } = useCart();
  const { openQuickView } = useQuickView();
  const uid = useId();
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const photoCount = productPhotos(product, color).length;
  const href = `/products/${product.slug}`;

  return (
    <article className="group/card relative">
      <div className="relative aspect-[4/5] overflow-hidden bg-card">
        {/* Image link is a duplicate of the title link, so it's skipped by keyboard and screen readers. */}
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0 block">
          <ProductMedia
            product={product}
            colorHex={color.hex}
            colorName={color.name}
            sizes={sizes}
            priority={priority}
            className="absolute inset-0 size-full transition-transform duration-[1400ms] ease-out-expo group-hover/card:scale-[1.04]"
          />
          {/* Hover swap: second photo, or the back flat — never photo → drawing. */}
          {photoCount !== 1 && (
            <ProductMedia
              product={product}
              colorHex={color.hex}
              colorName={color.name}
              view="back"
              sizes={sizes}
              className="absolute inset-0 size-full opacity-0 transition-opacity duration-700 ease-out-expo group-hover/card:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-0 top-0 flex items-center gap-3 p-3">
          {/* Translucent backings keep labels legible on light photos. */}
          {index && <span className="eyebrow hidden bg-ink/55 px-1.5 py-1 text-fg/75 backdrop-blur-sm sm:inline">{index}</span>}
          {product.badge && (
            <span className={`eyebrow px-2 py-1 text-[0.625rem] ${product.badge === "NEW" ? "bg-fg text-ink" : "bg-ink/70 text-fg backdrop-blur-sm"}`}>
              {product.badge}
            </span>
          )}
        </div>

        <WishlistButton slug={product.slug} name={product.name} className="absolute right-2 top-2 bg-ink/45 backdrop-blur-sm" />

        {/* Quick add — revealed on hover/focus for fine pointers. */}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 opacity-0 transition-[opacity,transform] duration-500 ease-out-expo group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 pointer-fine:block">
          <div className="border border-line bg-ink/80 p-2 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="eyebrow text-[0.625rem] text-muted">Quick add — {color.name}</span>
              <button
                type="button"
                onClick={() => openQuickView(product, color.id)}
                className="eyebrow inline-flex items-center gap-1.5 text-[0.625rem] text-muted hover:text-fg"
              >
                <Eye className="size-3" /> View
              </button>
            </div>
            <div className="flex gap-1">
              {product.sizes.map((s) => {
                const soldOut = (color.stock[s] ?? 0) <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={soldOut}
                    onClick={() => addItem(product, color, s)}
                    aria-label={`Add ${product.name}, ${color.name}, size ${s} to cart${soldOut ? " (sold out)" : ""}`}
                    className="h-8 flex-1 border border-line font-mono text-[0.6875rem] transition-colors hover:border-fg hover:bg-fg hover:text-ink disabled:text-muted/40 disabled:line-through disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-muted/40"
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Touch: a single button opens Quick View for size selection. */}
        <button
          type="button"
          onClick={() => openQuickView(product, color.id)}
          aria-label={`Quick view ${product.name}`}
          className="absolute bottom-2 left-2 inline-flex size-10 items-center justify-center bg-fg text-ink pointer-fine:hidden"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-[0.625rem] text-muted">{CATEGORY_LABELS[product.category]}</p>
          <h3 className="mt-1.5 text-sm font-medium leading-snug sm:text-[0.9375rem]">
            <Link href={href} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-out-expo hover:bg-[length:100%_1px]">
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="shrink-0 font-mono text-sm">{formatPrice(product.price, product.currency)}</p>
      </div>
      <div className="mt-3">
        <ColorSwatches name={`${uid}-color`} colors={product.colors} value={color.id} onChange={setColorId} size="sm" legend={`${product.name} color`} />
      </div>
    </article>
  );
}
