"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useId, useMemo, useState, type ReactNode } from "react";

import { btnArrow } from "@/components/ui/buttons";
import { Sheet } from "@/components/ui/Sheet";
import { CATEGORY_LABELS, type Product } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { ProductMedia } from "./ProductMedia";
import { PurchasePanel } from "./PurchasePanel";

type QuickViewContextValue = { openQuickView: (product: Product, colorId?: string) => void };

// Inert default for rendering outside the provider (see CartProvider).
const QuickViewContext = createContext<QuickViewContextValue>({ openQuickView: () => {} });

/** One shared Quick View dialog for every product card on the page. */
export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [colorId, setColorId] = useState("");
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"front" | "back">("front");
  const titleId = useId();

  const openQuickView = useCallback((p: Product, c?: string) => {
    setProduct(p);
    setColorId(c ?? p.colors[0].id);
    setView("front");
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openQuickView }), [openQuickView]);
  const color = product?.colors.find((c) => c.id === colorId) ?? product?.colors[0];

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <Sheet open={open} onClose={() => setOpen(false)} side="center" labelledBy={titleId} className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto border border-line bg-ink-2">
        {product && color && (
          <div className="grid md:grid-cols-2">
            <div className="relative aspect-[4/5] bg-card md:aspect-auto">
              <ProductMedia key={`${product.id}-${color.id}-${view}`} product={product} colorHex={color.hex} colorName={color.name} view={view} className="absolute inset-0 size-full" sizes="(min-width: 768px) 448px, 100vw" />
              <div className="absolute bottom-4 left-4 flex gap-1">
                {(["front", "back"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className="eyebrow h-8 border border-line bg-ink/60 px-3 text-muted backdrop-blur aria-pressed:border-fg aria-pressed:text-fg"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow text-muted">{CATEGORY_LABELS[product.category]}</p>
                  <h2 id={titleId} className="font-display-x mt-3 text-4xl sm:text-5xl">
                    {product.name}
                  </h2>
                  <p className="mt-3 font-mono text-sm">{formatPrice(product.price, product.currency)}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close quick view" className="-mr-2 -mt-2 inline-flex size-10 shrink-0 items-center justify-center text-muted hover:text-fg">
                  <X className="size-5" />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{product.summary}</p>
              <div className="mt-8">
                <PurchasePanel key={product.id} product={product} colorId={color.id} onColorChange={setColorId} idPrefix="qv" />
              </div>
              <Link
                href={`/products/${product.slug}`}
                onClick={() => setOpen(false)}
                className="group/btn eyebrow mt-8 inline-flex items-center gap-2 self-start text-fg underline-offset-4 hover:underline"
              >
                Full details <ArrowRight className={btnArrow} />
              </Link>
            </div>
          </div>
        )}
      </Sheet>
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  return useContext(QuickViewContext);
}
