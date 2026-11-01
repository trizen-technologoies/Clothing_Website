"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { btn, btnArrow } from "@/components/ui/buttons";
import { Magnetic } from "@/components/ui/Magnetic";
import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

type Props = { spotlight: { name: string; slug: string; price: number; currency: string } };

export function HeroSection({ spotlight }: Props) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      el.classList.add("intro-started");
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Scene fades in first (canvas), then type: eyebrow → headline mask → copy → CTAs.
        gsap
          .timeline({ delay: 0.7, defaults: { ease: "expo.out" } })
          .fromTo("[data-intro='eyebrow']", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1.1 })
          // y: 0 clears the CSS translateY(105%) that GSAP would otherwise parse into a pixel offset.
          .fromTo("[data-intro-line]", { y: 0, yPercent: 105 }, { y: 0, yPercent: 0, duration: 1.5, stagger: 0.13 }, "-=0.8")
          .fromTo("[data-intro='sub']", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1 }, "-=1")
          .fromTo("[data-intro='cta']", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.09 }, "-=0.95")
          .fromTo("[data-intro='meta']", { opacity: 0 }, { opacity: 1, duration: 1.4, stagger: 0.12 }, "-=0.7");

        // Copy drifts up and out as the story begins.
        gsap.to("[data-hero-content], [data-hero-aside]", {
          y: -90,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom 15%", scrub: true },
        });
      });
      // Reduced motion needs no JS: the CSS media query reveals intro elements.
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative flex h-svh min-h-[620px] flex-col justify-end md:justify-start">
      <div data-hero-content className="mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6 md:pb-0 md:pt-[16svh] lg:px-10">
        <p data-intro="eyebrow" className="eyebrow flex items-center gap-3 text-fg/80">
          <span className="size-1.5 bg-cyan" />
          Independent fashion / Future culture
        </p>

        <h1 id="hero-title" className="font-display-x mt-5 text-[clamp(4.6rem,13vw,13.5rem)] leading-[0.88] italic md:mt-[10svh] md:text-[clamp(4.6rem,9.8vw,10.5rem)]">
          <span className="block overflow-hidden pb-[0.05em] pr-[0.1em]">
            <span data-intro-line>Built</span>
          </span>
          <span className="block overflow-hidden pb-[0.05em] pr-[0.1em]">
            <span data-intro-line>Different.</span>
          </span>
        </h1>

        <p data-intro="sub" className="mt-6 max-w-xs text-base leading-relaxed text-fg/75 sm:max-w-sm sm:text-lg md:mt-8 md:max-w-md md:text-fg/85">
          Streetwear for those who refuse to blend in.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row md:mt-11">
          <Magnetic>
            <Link data-intro="cta" href="/shop" className={`${btn.primary} w-full sm:w-auto`}>
              Explore collection <ArrowRight className={btnArrow} />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link data-intro="cta" href="/world" className={`${btn.secondary} w-full backdrop-blur-sm sm:w-auto`}>
              Discover the world
            </Link>
          </Magnetic>
        </div>
      </div>

      <Link
        data-intro="meta"
        data-hero-aside
        href={`/products/${spotlight.slug}`}
        className="group absolute bottom-[10svh] right-10 hidden max-w-xs border-l border-line-strong pl-5 lg:block"
      >
        <span className="eyebrow block text-muted">Fig. 001 — In focus</span>
        <span className="mt-2 flex items-center gap-3 text-sm">
          {spotlight.name}
          <span className="font-mono text-muted">{formatPrice(spotlight.price, spotlight.currency)}</span>
          <ArrowRight className="size-4 text-cyan transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>

      <p data-intro="meta" aria-hidden className="eyebrow absolute right-6 top-1/2 hidden origin-right -translate-y-1/2 rotate-90 text-[0.625rem] text-muted lg:block">
        {brand.season} / N°001 — Collection 001
      </p>
    </section>
  );
}
