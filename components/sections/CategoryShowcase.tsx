import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ProductArt } from "@/components/products/ProductArt";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { CATEGORY_LABELS, type Category, type Product, type ProductColor } from "@/lib/commerce/types";
import { pad2 } from "@/lib/format";

/** The panel's image: a photographed colour (preferring a non-default one for variety), else a flat. */
function pickVisual(items: Product[]): { product: Product; color: ProductColor } {
  const photographed = items.flatMap((p) => p.colors.filter((c) => c.images?.length).map((c) => ({ product: p, color: c })));
  return (
    photographed.find((x) => x.color.id !== x.product.colors[0].id) ??
    photographed[0] ?? { product: items[0], color: items[0].colors[1] ?? items[0].colors[0] }
  );
}

/** Shop-by-category panels. Desktop panels widen on hover; mobile is a 2×2 grid. */
export function CategoryShowcase({ products }: { products: Product[] }) {
  const order: Category[] = ["outerwear", "hoodies", "tees", "bottoms"];
  const panels = order
    .map((category) => {
      const items = products.filter((p) => p.category === category);
      return items.length ? { category, count: items.length, ...pickVisual(items) } : null;
    })
    .filter((p) => p !== null);

  return (
    <section aria-labelledby="categories-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="06">Shop by category</SectionLabel>
            <h2 id="categories-title" className="font-display-x mt-6 text-[clamp(3.2rem,7vw,7.5rem)]">
              Find your layer.
            </h2>
          </div>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-px border border-line bg-line md:mt-16 md:flex md:h-[36rem]">
          {panels.map(({ category, count, product, color }, i) => {
            const photo = color.images?.[0];
            return (
              <li key={category} className="bg-ink transition-[flex-grow] duration-700 ease-out-expo md:flex-1 md:hover:flex-[1.7]">
                <Link href={`/shop?category=${category}`} className="group relative flex aspect-[3/4] h-full flex-col justify-between overflow-hidden p-4 sm:p-6 md:aspect-auto">
                  {photo ? (
                    <>
                      <Image
                        src={photo.src}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 30vw, 50vw"
                        className="object-cover opacity-80 brightness-[0.8] transition-[transform,opacity,filter] duration-1000 ease-out-expo group-hover:scale-[1.04] group-hover:opacity-100 group-hover:brightness-100"
                      />
                      {/* Keeps the labels legible over light photos. */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,9,11,0.6)_0%,transparent_30%,transparent_55%,rgba(4,9,11,0.85)_100%)]" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(255,255,255,0.05),transparent_70%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                      <div className="absolute inset-x-[12%] bottom-[22%] top-[16%] transition-transform duration-1000 ease-out-expo group-hover:scale-[1.04]">
                        <ProductArt garment={product.garment} graphic={product.graphic} color={color.hex} backdrop={false} label="" className="size-full" />
                      </div>
                    </>
                  )}
                  <div className="relative flex items-start justify-between">
                    <span className="eyebrow text-fg/70">{pad2(i + 1)}</span>
                    <ArrowUpRight className="size-5 text-fg/70 transition-colors duration-300 group-hover:text-cyan" />
                  </div>
                  <div className="relative">
                    <p className="font-display-x text-[clamp(2rem,4vw,3.5rem)]">{CATEGORY_LABELS[category]}</p>
                    <p className="eyebrow mt-2 text-[0.625rem] text-fg/70">
                      {pad2(count)} {count === 1 ? "style" : "styles"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
