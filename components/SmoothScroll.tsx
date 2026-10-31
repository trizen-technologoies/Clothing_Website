"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { setSmoothScroll, settleScroll } from "@/lib/smooth-scroll";

const SCROLL_KEYS = new Set(["PageDown", "PageUp", "ArrowDown", "ArrowUp", " ", "Home", "End"]);

/**
 * Inertial wheel scrolling (Lenis), driven by GSAP's ticker so ScrollTrigger
 * and the 3D scroll story stay frame-locked. Scrolling stays native for touch,
 * keyboard and reduced-motion users; the page never stops being a normal
 * scrolling document.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    const teardown = () => {
      if (!lenis) return;
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenis = null;
      setSmoothScroll(null);
    };

    const setup = () => {
      teardown();
      if (reduced.matches) return;
      lenis = new Lenis({
        lerp: 0.085, // lower = heavier, silkier glide
        wheelMultiplier: 1,
        smoothWheel: true,
        autoRaf: false,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      // Lenis interpolates per frame; GSAP's lag smoothing would make it stutter.
      gsap.ticker.lagSmoothing(0);
      setSmoothScroll(lenis);
    };

    // Keyboard scrolling stays native. A glide still settling would otherwise
    // pull the page back over the key's scroll, so hand control over first.
    const onKey = (e: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(e.key)) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      settleScroll();
    };

    setup();
    reduced.addEventListener("change", setup);
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      reduced.removeEventListener("change", setup);
      window.removeEventListener("keydown", onKey, { capture: true });
      teardown();
    };
  }, []);

  // A glide still running when the route changes would drag the new page away
  // from where Next.js positioned it.
  useLayoutEffect(() => {
    settleScroll();
  }, [pathname]);

  return null;
}
