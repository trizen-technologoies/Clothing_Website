import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { btn, btnArrow } from "@/components/ui/buttons";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Product } from "@/lib/commerce/types";
import { formatPrice, pad2 } from "@/lib/format";

type Props = { title: string; tagline: string; description: string; slug: string; products: Product[] };

/** Scene 3 — copy sits opposite the garment, which turns to face the viewer. */
export function FeaturedCollection({ title, tagline, description, slug, products }: Props) {
  return (
    <section id="featured" aria-labelledby="featured-title" className="relative flex min-h-[130svh] items-center py-24">
      <div className="mx-auto grid w-full max-w-[1600px] px-4 sm:px-6 md:grid-cols-12 lg:px-10">
        <div className="pt-[42svh] md:col-span-6 md:col-start-7 md:pt-0 lg:col-span-5 lg:col-start-8">
          <Reveal>
            <SectionLabel index="03">Featured collection</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h2 id="featured-title" className="font-display-x mt-6 text-[clamp(3.8rem,8.5vw,9rem)]">
              {title}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="font-display-wide mt-5 text-xs tracking-[0.32em] text-cyan sm:text-sm">{tagline}</p>
            <p className="mt-6 max-w-md leading-relaxed text-fg/70">{description}</p>
          </Reveal>

          <Reveal delay={220}>
            <ul className="mt-10 border-t border-line">
              {products.map((p, i) => (
                <li key={p.id} className="border-b border-line">
                  <Link href={`/products/${p.slug}`} className="group flex items-center gap-4 py-4 transition-colors hover:bg-white/[0.02]">
                    <span className="eyebrow w-6 text-muted">{pad2(i + 1)}</span>
                    <span className="flex-1 text-sm transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5 sm:text-base">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-muted">{formatPrice(p.price, p.currency)}</span>
                    <ArrowUpRight className="size-4 text-muted transition-colors group-hover:text-cyan" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={280} className="mt-10">
            <Magnetic>
              <Link href={`/collections/${slug}`} className={btn.primary}>
                Shop {title} <ArrowRight className={btnArrow} />
              </Link>
            </Magnetic>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
