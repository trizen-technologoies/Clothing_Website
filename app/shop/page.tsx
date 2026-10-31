import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ShopCatalogue } from "@/components/products/ShopCatalogue";
import { getProducts } from "@/lib/commerce";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Technical outerwear, heavyweight fleece, utility bottoms and tees.",
};

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Shop" }]}
        eyebrow={`${products.length} pieces — SS—26`}
        title="Shop all"
        description="Technical outerwear, heavyweight fleece, utility bottoms and tees. Every piece is cut to layer with the rest."
      />
      {/* Filters read the URL, which isn't known at prerender — the full grid is the fallback. */}
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1600px] px-4 pb-24 pt-24 sm:px-6 lg:px-10">
            <ProductGrid products={products} />
          </div>
        }
      >
        <ShopCatalogue products={products} />
      </Suspense>
    </>
  );
}
