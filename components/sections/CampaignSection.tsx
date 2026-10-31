"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import type { Quality } from "@/components/three/heroState";
import { btn, btnArrow } from "@/components/ui/buttons";
import { Magnetic } from "@/components/ui/Magnetic";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { getDeviceTier, useInView, usePrefersReducedMotion, useWebGLSupport } from "@/lib/hooks";
import { Timecode } from "./Timecode";

const CampaignScene = dynamic(() => import("./CampaignScene"), { ssr: false });

/** Scene 5 — cinematic campaign frame around an abstract fabric study. */
export function CampaignSection() {
  const root = useRef<HTMLElement>(null);
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  // Mount the scene shortly before it scrolls in; pause it when out of view.
  const [nearRef, near] = useInView<HTMLDivElement>({ rootMargin: "400px 0px" });
  const [quality] = useState<Quality>(getDeviceTier);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  if (near && !mounted) setMounted(true);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-campaign-title] > span",
          { yPercent: 100 },
          { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.1, scrollTrigger: { trigger: root.current, start: "top 60%" } },
        );
        gsap.fromTo("[data-letterbox]", { scaleY: 1.6 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 20%", scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="campaign-title" className="relative overflow-hidden bg-ink">
      <div ref={nearRef} className="relative h-[100svh] max-h-[1100px] min-h-[640px]">
        {/* Visual: fabric study, with a static gradient composition underneath as fallback. */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(40%_60%_at_68%_45%,rgba(139,92,246,0.14),transparent_70%),radial-gradient(30%_50%_at_80%_55%,rgba(0,229,255,0.08),transparent_70%)]" />
        {webgl && mounted && !failed && (
          <div className={`absolute inset-0 transition-opacity duration-[1500ms] ${ready ? "opacity-100" : "opacity-0"}`}>
            <CanvasErrorBoundary onError={() => setFailed(true)}>
              <CampaignScene quality={quality} active={near} reducedMotion={reducedMotion} onReady={() => setReady(true)} />
            </CanvasErrorBoundary>
          </div>
        )}

        {/* Letterbox bars + scrims */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div data-letterbox className="absolute inset-x-0 top-0 h-[7%] origin-top bg-ink" />
          <div data-letterbox className="absolute inset-x-0 bottom-0 h-[7%] origin-bottom bg-ink" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,5,0.9),transparent_55%)] md:bg-[linear-gradient(to_right,rgba(5,5,5,0.85),rgba(5,5,5,0.2)_50%,transparent_70%)]" />
          <div className="absolute inset-0 shadow-[inset_0_0_120px_30px_rgba(5,5,5,0.85)]" />
        </div>

        {/* HUD */}
        <div aria-hidden className="eyebrow pointer-events-none absolute inset-x-4 top-[9%] flex justify-between text-[0.625rem] text-fg/60 sm:inset-x-6 lg:inset-x-10">
          <span className="flex items-center gap-2">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-cyan" /> Cam 01 — Rec
          </span>
          <Timecode />
        </div>
        <div aria-hidden className="eyebrow pointer-events-none absolute inset-x-4 bottom-[9%] hidden justify-between text-[0.625rem] text-fg/50 sm:inset-x-6 md:flex lg:inset-x-10">
          <span>Campaign 001 — After hours</span>
          <span>2.39 : 1 — Fabric study, real-time render</span>
        </div>

        {/* Copy */}
        <div className="absolute inset-x-0 bottom-[12%] mx-auto max-w-[1600px] px-4 sm:px-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 lg:px-10">
          <SectionLabel index="05">Campaign</SectionLabel>
          <h2 id="campaign-title" data-campaign-title className="font-display-x mt-6 text-[clamp(4.5rem,12vw,12rem)] leading-[0.82]">
            <span className="block overflow-hidden">
              <span className="block">After</span>
            </span>
            <span className="block overflow-hidden">
              <span className="text-outline block">Hours</span>
            </span>
          </h2>
          <p className="mt-6 max-w-sm leading-relaxed text-fg/75">
            Collection 001 in motion. Fabric, light and shadow — a study of form after dark.
          </p>
          <div className="mt-8">
            <Magnetic>
              <Link href="/collections/001" className={btn.secondary}>
                Shop the campaign <ArrowRight className={btnArrow} />
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
