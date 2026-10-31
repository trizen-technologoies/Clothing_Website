"use client";

import { useRef } from "react";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";

const LINES = [["Not", "made"], ["to", "follow."]];

export function BrandStatement() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        // Words light up one by one as the statement scrolls through.
        gsap.fromTo(
          "[data-word]",
          { opacity: 0.1 },
          { opacity: 1, ease: "none", stagger: 0.25, scrollTrigger: { trigger: root.current, start: "top 70%", end: "center 45%", scrub: true } },
        );
        gsap.fromTo(
          "[data-statement-copy]",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: root.current, start: "top 30%", end: "center 40%", scrub: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="statement" aria-labelledby="statement-title" className="relative flex min-h-[130svh] items-center py-24">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <SectionLabel index="02">Manifesto</SectionLabel>
        <h2 id="statement-title" className="font-display-x mt-8 text-[clamp(4.2rem,15.5vw,16.5rem)] leading-[0.8]">
          {LINES.map((line, i) => (
            <span key={i} className={`block ${i === 1 ? "text-right" : ""}`}>
              {line.map((word) => (
                <span key={word} data-word className="mr-[0.16em] inline-block last:mr-0">
                  {word}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div className="mt-10 grid md:mt-14 md:grid-cols-12">
          <p data-statement-copy className="max-w-md text-lg leading-relaxed text-fg/75 md:col-span-5 md:col-start-2 md:text-xl">
            We create modern streetwear for people who build their own identity.
          </p>
        </div>
      </div>
    </section>
  );
}
