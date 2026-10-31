"use client";

import { ArrowRight, Loader2, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { LineThumb } from "@/components/products/LineThumb";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { btn, btnArrow } from "@/components/ui/buttons";
import { Sheet } from "@/components/ui/Sheet";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { CART_MAX_PER_LINE, useCart } from "./CartProvider";

type CheckoutResponse = { mode: "shopify" | "demo"; url: string } | { error: string };

export function CartDrawer({ mode }: { mode: "demo" | "shopify" }) {
  const { lines, isOpen, closeCart, count, subtotal, setQuantity, removeItem } = useCart();
  const router = useRouter();
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = brand.freeShippingThreshold - subtotal;
  const progress = Math.min(1, subtotal / brand.freeShippingThreshold);

  async function checkout() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ productId: l.productId, colorId: l.colorId, size: l.size, quantity: l.quantity })),
        }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (!res.ok || "error" in data) throw new Error("error" in data ? data.error : "Checkout is unavailable");
      if (data.mode === "shopify") {
        window.location.assign(data.url);
        return;
      }
      closeCart();
      router.push(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout is unavailable right now");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={isOpen} onClose={closeCart} side="right" labelledBy={titleId} className="flex h-dvh w-full max-w-md flex-col border-l border-line bg-ink-2">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-6">
        <h2 id={titleId} className="eyebrow">
          Cart <span className="text-muted">({count})</span>
        </h2>
        <button type="button" onClick={closeCart} aria-label="Close cart" className="-mr-2 inline-flex size-10 items-center justify-center text-muted transition-colors hover:text-fg">
          <X className="size-5" />
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
          <ShoppingBag className="size-8 text-muted" strokeWidth={1} />
          <div>
            <p className="font-display-x text-4xl">Your cart is empty</p>
            <p className="mt-3 text-sm text-muted">Nothing here yet. Start with the pieces from Collection 001.</p>
          </div>
          <Link href="/shop" onClick={closeCart} className={btn.primary}>
            Shop all <ArrowRight className={btnArrow} />
          </Link>
          <Link href="/collections/001" onClick={closeCart} className="eyebrow text-muted underline-offset-4 hover:text-fg hover:underline">
            Collection 001
          </Link>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-line px-5 py-4 sm:px-6">
            <p className="text-xs text-muted">
              {remaining > 0 ? (
                <>
                  You&apos;re <span className="text-fg">{formatPrice(remaining)}</span> away from free shipping
                </>
              ) : (
                <span className="text-fg">You&apos;ve unlocked free standard shipping</span>
              )}
            </p>
            <div className="mt-2.5 h-px w-full bg-line">
              <div className="h-px origin-left bg-cyan transition-transform duration-700 ease-out-expo" style={{ transform: `scaleX(${progress})` }} />
            </div>
          </div>

          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5 sm:px-6">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-4 py-5">
                <Link href={`/products/${line.slug}`} onClick={closeCart} tabIndex={-1} aria-hidden className="block h-[6.25rem] w-20 shrink-0 overflow-hidden bg-card">
                  <LineThumb image={line.image} garment={line.garment} graphic={line.graphic} colorHex={line.colorHex} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/products/${line.slug}`} onClick={closeCart} className="text-sm font-medium leading-snug hover:underline">
                      {line.name}
                    </Link>
                    <p className="shrink-0 font-mono text-sm">{formatPrice(line.price * line.quantity, line.currency)}</p>
                  </div>
                  <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted">
                    {line.colorName} / {line.size}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantityStepper
                      size="sm"
                      value={line.quantity}
                      min={1}
                      max={Math.min(line.maxQuantity, CART_MAX_PER_LINE)}
                      onChange={(q) => setQuantity(line.key, q)}
                      label={`Quantity of ${line.name}`}
                    />
                    <button type="button" onClick={() => removeItem(line.key)} className="eyebrow text-[0.625rem] text-muted underline-offset-4 hover:text-fg hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="shrink-0 border-t border-line px-5 pb-6 pt-5 sm:px-6">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow text-muted">Subtotal</p>
              <p className="font-mono text-base">{formatPrice(subtotal)}</p>
            </div>
            <p className="mt-1.5 text-xs text-muted">Shipping and taxes calculated at checkout.</p>
            {error && (
              <p role="alert" className="mt-3 text-xs text-danger">
                {error}
              </p>
            )}
            <button type="button" onClick={checkout} disabled={pending} className={`${btn.primary} mt-5 w-full`}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <>Checkout <ArrowRight className={btnArrow} /></>}
            </button>
            <p className="mt-3 text-center text-[0.6875rem] leading-relaxed text-muted">
              {mode === "demo"
                ? "Demo store — checkout is simulated and no payment is taken."
                : "You'll complete payment securely on Shopify Checkout."}
            </p>
          </div>
        </>
      )}
    </Sheet>
  );
}
