import { Info } from "lucide-react";
import type { Metadata } from "next";

import { WishlistGrid } from "@/components/cart/WishlistGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { getCommerceMode, getProducts } from "@/lib/commerce";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const products = await getProducts();
  const mode = getCommerceMode();

  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: "Account" }]} eyebrow="Your space" title="Account" />
      <div className="mx-auto max-w-[1600px] space-y-20 px-4 pb-28 sm:px-6 lg:px-10">
        <div className="flex max-w-2xl gap-4 border border-line p-6">
          <Info className="mt-0.5 size-5 shrink-0 text-cyan" strokeWidth={1.5} />
          <div className="text-sm leading-relaxed text-fg/75">
            <p className="font-medium text-fg">Customer accounts aren&apos;t connected{mode === "demo" ? " in this demo store" : " yet"}.</p>
            <p className="mt-2">
              Sign-in, order history and saved addresses are provided by Shopify Customer Accounts once the store is connected
              (see the README). Your wishlist below is saved in this browser only.
            </p>
          </div>
        </div>

        <section aria-labelledby="wishlist-title">
          <SectionLabel index="01">Saved</SectionLabel>
          <h2 id="wishlist-title" className="font-display-x mb-10 mt-6 text-6xl">
            Wishlist
          </h2>
          <WishlistGrid products={products} />
        </section>
      </div>
    </>
  );
}
