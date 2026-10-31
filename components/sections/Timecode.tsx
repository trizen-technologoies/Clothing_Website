"use client";

import { useEffect, useRef } from "react";

import { pad2 } from "@/lib/format";

/** Running film timecode (HH:MM:SS:FF at 24fps). Static under reduced motion. */
export function Timecode({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let raf = 0;
    let last = "";
    const tick = (now: number) => {
      const frames = Math.floor(((now - start) / 1000) * 24) + 12 * 24;
      const text = `00:${pad2(Math.floor(frames / 1440) % 60)}:${pad2(Math.floor(frames / 24) % 60)}:${pad2(frames % 24)}`;
      if (text !== last && ref.current) ref.current.textContent = last = text;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <span ref={ref} aria-hidden className={`tabular-nums ${className}`}>
      00:00:12:00
    </span>
  );
}
