import type { Metadata } from "next";
import Link from "next/link";

import { DemoCheckout } from "@/components/cart/DemoCheckout";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCommerceMode } from "@/lib/commerce";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  const mode = getCommerceMode();

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, { label: "Checkout" }]}
        eyebrow={mode === "demo" ? "Demo mode — no payment is taken" : "Checkout"}
        title="Checkout"
      />
      <div className="mx-auto max-w-[1600px] px-4 pb-28 sm:px-6 lg:px-10">
        {mode === "demo" ? (
          <DemoCheckout />
        ) : (
          <p className="max-w-xl text-fg/75">
            Checkout is handled by Shopify. Open your cart and choose Checkout to continue securely, or{" "}
            <Link href="/shop" className="underline underline-offset-4">
              keep shopping
            </Link>
            .
          </p>
        )}
      </div>
    </>
  );
}
