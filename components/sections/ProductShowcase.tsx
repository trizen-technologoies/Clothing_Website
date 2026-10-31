"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { btnArrow } from "@/components/ui/buttons";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { Product } from "@/lib/commerce/types";
import { pad2 } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";

/** Scene 4 — editorial edit of featured pieces with staggered, parallaxed cards. */
export function ProductShowcase({ products }: { products: Product[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((card) => {
          const speed = Number(card.dataset.speed);
          gsap.fromTo(
            card,
            { y: 60 * speed },
            { y: -60 * speed, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="edit-title" className="relative overflow-hidden py-24 md:py-36">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="04">The edit</SectionLabel>
            <h2 id="edit-title" className="font-display-x mt-6 text-[clamp(3.2rem,7vw,7.5rem)]">
              Four pieces.
              <br />
              <span className="text-muted">One uniform.</span>
            </h2>
          </div>
          <div className="max-w-xs">
            <p className="text-sm leading-relaxed text-muted">
              The core of the season — technical outerwear, heavyweight fleece and utility bottoms, cut to layer together.
            </p>
            <Link href="/shop" className="group/btn eyebrow mt-5 inline-flex items-center gap-2 text-fg">
              Shop all <ArrowRight className={btnArrow} />
            </Link>
          </div>
        </div>

        <ul className="-mx-4 mt-14 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:mt-20 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden">
          {products.map((p, i) => (
            <li key={p.id} data-speed={i % 2 === 0 ? 0.4 : 1} className={`w-[78%] shrink-0 snap-start sm:w-[44%] md:w-auto ${i % 2 === 1 ? "md:mt-28" : ""}`}>
              <ProductCard product={p} index={pad2(i + 1)} sizes="(min-width: 768px) 25vw, 78vw" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
