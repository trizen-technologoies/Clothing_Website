"use client";

import { useRef, type ReactNode } from "react";

import { heroState, resetHeroState } from "@/components/three/heroState";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { HeroStage } from "./HeroStage";

/**
 * The first three scenes (hero → statement → featured collection) share one
 * sticky 3D stage. Each scene's scroll progress drives the camera and garment
 * through heroState; the page scrolls natively — nothing is pinned.
 */
export function HomeStory({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [hero, statement, featured] = ["hero", "statement", "featured"].map((k) => q(`[data-scrim='${k}']`)[0]);

      // Contrast scrims follow the composition: left for the hero copy,
      // centre for the statement, right for the featured collection.
      const paint = () => {
        const s = heroState.statement;
        const f = heroState.featured;
        gsap.set(hero, { opacity: 1 - s });
        gsap.set(statement, { opacity: s * (1 - f) });
        gsap.set(featured, { opacity: f });
      };

      const track = (selector: string, key: "statement" | "featured") => {
        const st = ScrollTrigger.create({
          trigger: selector,
          start: "top bottom",
          end: "center center",
          onUpdate: (self) => {
            heroState[key] = self.progress;
            paint();
          },
        });
        heroState[key] = st.progress;
      };
      track("#statement", "statement");
      track("#featured", "featured");
      paint();

      // The stage dissolves as it scrolls away, instead of leaving half a scene behind.
      gsap.fromTo(
        q("[data-stage]"),
        { opacity: 1 },
        { opacity: 0, ease: "none", scrollTrigger: { trigger: "#featured", start: "bottom bottom", end: "bottom 35%", scrub: true } },
      );

      return () => resetHeroState();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
      <div data-stage className="sticky top-0 h-svh w-full overflow-hidden">
        <HeroStage />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div data-scrim="hero" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,9,11,0.92)_0%,rgba(4,9,11,0.35)_38%,transparent_60%)] md:bg-[linear-gradient(to_right,rgba(4,9,11,0.78)_0%,rgba(4,9,11,0.25)_45%,transparent_70%)]" />
          <div data-scrim="statement" className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_50%,rgba(4,9,11,0.55),transparent_80%)] opacity-0" />
          <div data-scrim="featured" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(4,9,11,0.95)_0%,rgba(4,9,11,0.5)_45%,transparent_65%)] opacity-0 md:bg-[linear-gradient(to_left,rgba(4,9,11,0.85)_0%,rgba(4,9,11,0.3)_45%,transparent_65%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        </div>
      </div>
      <div className="relative z-10 -mt-[100svh]">{children}</div>
    </div>
  );
}
