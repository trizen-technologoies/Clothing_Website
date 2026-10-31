"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  /** Delay in ms. */
  delay?: number;
};

/**
 * Fades content up when it scrolls into view. Content is visible by default
 * (no-JS, reduced motion, or already on screen at mount) — the hidden state is
 * only "armed" for elements that start below the fold.
 */
export function Reveal({ as: Tag = "div", children, className = "", delay = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "armed" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    // Arm on the next frame so the hidden state never paints over visible content.
    const id = requestAnimationFrame(() => {
      setState((s) => (s === "idle" ? "armed" : s));
      io.observe(el);
    });
    return () => {
      cancelAnimationFrame(id);
      io.disconnect();
    };
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal={state}
      style={{ transitionDelay: state === "shown" ? `${delay}ms` : undefined }}
      className={`transition-[opacity,transform] duration-[900ms] ease-out-expo data-[reveal=armed]:translate-y-8 data-[reveal=armed]:opacity-0 ${className}`}
    >
      {children}
    </Tag>
  );
}
