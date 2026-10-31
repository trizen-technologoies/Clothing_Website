import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProductGrid } from "@/components/products/ProductGrid";
import { btn, btnArrow } from "@/components/ui/buttons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Product } from "@/lib/commerce/types";

/** Scene 6 — a conventional, purchase-first grid. */
export function BestSellers({ products }: { products: Product[] }) {
  return (
    <section aria-labelledby="bestsellers-title" className="border-t border-line py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <Reveal className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="07">Best sellers</SectionLabel>
            <h2 id="bestsellers-title" className="font-display-x mt-6 text-[clamp(3.2rem,7vw,7.5rem)]">
              Most worn.
            </h2>
          </div>
          <Link href="/shop" className={btn.secondary}>
            Shop all <ArrowRight className={btnArrow} />
          </Link>
        </Reveal>
        <ProductGrid products={products} />
      </div>
    </section>
  );
}
