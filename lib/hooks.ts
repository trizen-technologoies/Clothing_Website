"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

/** SSR-safe media query subscription (false on the server). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

let webglSupport: boolean | undefined;

/** Whether WebGL can be used. `undefined` until checked on the client. */
export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    if (webglSupport === undefined) {
      try {
        const canvas = document.createElement("canvas");
        webglSupport = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      } catch {
        webglSupport = false;
      }
    }
    // Deferred so the check never runs during render.
    const id = requestAnimationFrame(() => setSupported(webglSupport));
    return () => cancelAnimationFrame(id);
  }, []);
  return supported;
}

/**
 * Tracks whether an element is within (or near) the viewport.
 * `once` stops observing after the first intersection.
 */
export function useInView<T extends Element>(
  options: { rootMargin?: string; once?: boolean; threshold?: number } = {},
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const { rootMargin = "0px", once = false, threshold = 0 } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) io.disconnect();
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, once, threshold]);

  return [ref, inView];
}

/** Rough device tier used to scale 3D quality. */
export function getDeviceTier(): "high" | "low" {
  if (typeof window === "undefined") return "low";
  const small = window.matchMedia("(max-width: 767px)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  return small || coarse || cores < 4 ? "low" : "high";
}
