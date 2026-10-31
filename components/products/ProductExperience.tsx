"use client";

import { Plus, RotateCcw, Truck } from "lucide-react";
import { useState, type ReactNode } from "react";

import { brand } from "@/lib/brand";
import { CATEGORY_LABELS, type Product } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { ProductGallery } from "./ProductGallery";
import { PurchasePanel } from "./PurchasePanel";

function Accordion({ title, children, defaultOpen }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="eyebrow flex cursor-pointer list-none items-center justify-between py-5 text-fg">
        {title}
        <Plus aria-hidden className="size-4 text-muted transition-transform duration-300 group-open:rotate-45" />
      </summary>
      <div className="pb-6 text-sm leading-relaxed text-fg/70">{children}</div>
    </details>
  );
}

/** Two-column product layout; the selected color drives both gallery and purchase panel. */
export function ProductExperience({ product }: { product: Product }) {
  const [colorId, setColorId] = useState(product.colors[0].id);
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* min-w-0: the thumbnail strip scrolls instead of widening the grid column. */}
      <div className="min-w-0 lg:col-span-7">
        <div className="lg:sticky lg:top-24">
          <ProductGallery product={product} colorHex={color.hex} colorName={color.name} />
        </div>
      </div>

      <div className="min-w-0 lg:col-span-5">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow text-muted">{CATEGORY_LABELS[product.category]}</p>
          {product.badge && <span className="eyebrow bg-fg px-2 py-1 text-[0.625rem] text-ink">{product.badge}</span>}
          {product.isDemo && <span className="eyebrow border border-line-strong px-2 py-1 text-[0.625rem] text-muted">Demo product</span>}
        </div>
        <h1 className="font-display-x mt-5 text-[clamp(3rem,6vw,5.5rem)]">{product.name}</h1>
        <p className="mt-4 font-mono text-lg">{formatPrice(product.price, product.currency)}</p>
        <p className="mt-5 max-w-md leading-relaxed text-fg/75">{product.summary}</p>

        <div className="mt-10">
          <PurchasePanel product={product} colorId={color.id} onColorChange={setColorId} idPrefix="pdp" />
        </div>

        <ul className="mt-8 grid gap-3 border-y border-line py-5 text-sm text-fg/75 sm:grid-cols-2">
          <li className="flex items-start gap-3">
            <Truck className="mt-0.5 size-4 shrink-0 text-cyan" strokeWidth={1.5} />
            Free standard delivery over {formatPrice(brand.freeShippingThreshold)}
          </li>
          <li className="flex items-start gap-3">
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-cyan" strokeWidth={1.5} />
            30-day returns on unworn pieces
          </li>
        </ul>

        <div className="mt-4">
          <Accordion title="Description" defaultOpen>
            <p>{product.description}</p>
          </Accordion>
          {product.details.length > 0 && (
            <Accordion title="Details & fit">
              <ul className="list-inside list-['—_'] space-y-1.5">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
              {product.fit && <p className="mt-4">{product.fit}</p>}
            </Accordion>
          )}
          {product.material && (
            <Accordion title="Materials & care">
              <p>{product.material}</p>
              <ul className="mt-3 list-inside list-['—_'] space-y-1.5">
                {product.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Accordion>
          )}
          <Accordion title="Delivery & returns">
            <p>
              Standard delivery in 3–5 business days, free over {formatPrice(brand.freeShippingThreshold)}. Express delivery in 1–2
              business days. Unworn pieces can be returned within 30 days of delivery.
            </p>
            {product.isDemo && <p className="mt-3 text-muted">Demo store — these policies are placeholders and no orders are shipped.</p>}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
