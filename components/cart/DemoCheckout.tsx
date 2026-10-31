"use client";

import { ArrowRight, Check, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { LineThumb } from "@/components/products/LineThumb";
import { btn, btnArrow } from "@/components/ui/buttons";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";

const SHIPPING = [
  { id: "standard", label: "Standard", eta: "3–5 business days", price: 800 },
  { id: "express", label: "Express", eta: "1–2 business days", price: 2000 },
] as const;

/**
 * Simulated checkout for demo mode. Collects no personal or payment data and
 * creates no order — it only shows the summary a real checkout would.
 */
export function DemoCheckout() {
  const { lines, subtotal, count, clear, hydrated } = useCart();
  const [shippingId, setShippingId] = useState<(typeof SHIPPING)[number]["id"]>("standard");
  const [placed, setPlaced] = useState<{ ref: string; total: number; items: number } | null>(null);

  const option = SHIPPING.find((s) => s.id === shippingId) ?? SHIPPING[0];
  const freeStandard = subtotal >= brand.freeShippingThreshold;
  const shipping = option.id === "standard" && freeStandard ? 0 : option.price;
  const total = subtotal + shipping;

  if (!hydrated) return <div aria-hidden className="h-96 animate-pulse bg-card" />;

  if (placed) {
    return (
      <div role="status" className="mx-auto max-w-xl border border-line p-8 text-center sm:p-12">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-cyan text-cyan">
          <Check className="size-5" />
        </span>
        <p className="eyebrow mt-8 text-muted">Demo order {placed.ref}</p>
        <h2 className="font-display-x mt-4 text-5xl">Order simulated</h2>
        <p className="mt-5 text-sm leading-relaxed text-fg/75">
          {placed.items} {placed.items === 1 ? "item" : "items"} · {formatPrice(placed.total)}. This was a demo — nothing was charged,
          no payment provider was contacted and no order was created.
        </p>
        <Link href="/shop" className={`${btn.primary} mt-10`}>
          Back to the shop <ArrowRight className={btnArrow} />
        </Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border border-line px-6 py-20 text-center">
        <p className="font-display-x text-5xl">Your cart is empty</p>
        <Link href="/shop" className={`${btn.primary} mt-8`}>
          Shop all <ArrowRight className={btnArrow} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="space-y-10 lg:col-span-7">
        <fieldset>
          <legend className="eyebrow mb-4 text-muted">Delivery method</legend>
          <div className="space-y-2">
            {SHIPPING.map((s) => {
              const price = s.id === "standard" && freeStandard ? 0 : s.price;
              return (
                <label key={s.id} className="flex cursor-pointer items-center justify-between gap-4 border border-line p-4 transition-colors has-[:checked]:border-fg">
                  <span className="flex items-center gap-3">
                    <input type="radio" name="shipping" value={s.id} checked={shippingId === s.id} onChange={() => setShippingId(s.id)} className="accent-cyan" />
                    <span>
                      <span className="block text-sm">{s.label}</span>
                      <span className="block text-xs text-muted">{s.eta}</span>
                    </span>
                  </span>
                  <span className="font-mono text-sm">{price === 0 ? "Free" : formatPrice(price)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="border border-dashed border-line-strong p-6">
          <p className="eyebrow flex items-center gap-2 text-muted">
            <Lock className="size-3.5" /> Payment
          </p>
          <p className="mt-3 text-sm leading-relaxed text-fg/75">
            In production, contact details, address and payment are collected on Shopify&apos;s hosted checkout. This demo store
            doesn&apos;t ask for or store any personal or payment information.
          </p>
        </div>
      </div>

      <aside aria-labelledby="summary-title" className="h-fit border border-line bg-ink-2 p-6 lg:sticky lg:top-24 lg:col-span-5">
        <h2 id="summary-title" className="eyebrow text-muted">
          Order summary ({count})
        </h2>
        <ul className="mt-5 divide-y divide-line">
          {lines.map((l) => (
            <li key={l.key} className="flex gap-4 py-4">
              <span className="relative block h-20 w-16 shrink-0 overflow-hidden bg-card">
                <LineThumb image={l.image} garment={l.garment} graphic={l.graphic} colorHex={l.colorHex} />
                <span className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-fg font-mono text-[0.625rem] text-ink">{l.quantity}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{l.name}</span>
                <span className="mt-1 block font-mono text-xs uppercase text-muted">
                  {l.colorName} / {l.size}
                </span>
              </span>
              <span className="font-mono text-sm">{formatPrice(l.price * l.quantity, l.currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-mono">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping ({option.label})</dt>
            <dd className="font-mono">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Taxes</dt>
            <dd className="text-muted">Calculated at payment</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt>Total</dt>
            <dd className="font-mono">{formatPrice(total)}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => {
            setPlaced({ ref: `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, total, items: count });
            clear();
          }}
          className={`${btn.primary} mt-6 w-full`}
        >
          Place demo order <ArrowRight className={btnArrow} />
        </button>
        <p className="mt-3 text-center text-[0.6875rem] text-muted">No payment is taken. Nothing will be shipped.</p>
      </aside>
    </div>
  );
}
