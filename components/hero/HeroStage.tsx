"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { CanvasErrorBoundary } from "@/components/three/CanvasErrorBoundary";
import { heroState, type Quality } from "@/components/three/heroState";
import { getDeviceTier, useInView, usePrefersReducedMotion, useWebGLSupport } from "@/lib/hooks";
import { HeroFallback } from "./HeroFallback";

// Three.js, R3F and postprocessing load in their own chunk, after first paint.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

export function HeroStage() {
  const webgl = useWebGLSupport();
  const reducedMotion = usePrefersReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "200px 0px" });
  const [quality] = useState<Quality>(getDeviceTier);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      heroState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      heroState.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} className="absolute inset-0">
      <HeroFallback />
      {webgl && !failed && (
        <div className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${ready ? "opacity-100" : "opacity-0"}`}>
          <CanvasErrorBoundary onError={() => setFailed(true)}>
            <HeroScene quality={quality} reducedMotion={reducedMotion} active={inView} onReady={() => setReady(true)} />
          </CanvasErrorBoundary>
        </div>
      )}
    </div>
  );
}
