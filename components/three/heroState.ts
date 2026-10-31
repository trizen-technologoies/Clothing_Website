/**
 * Mutable state shared between the DOM (scroll + pointer) and the hero
 * scene's render loop. Plain object on purpose: written by ScrollTrigger and
 * pointer listeners, read inside useFrame — no React re-renders involved.
 */
export const heroState = {
  /** 0 → 1 while the brand statement scrolls into the viewport centre. */
  statement: 0,
  /** 0 → 1 while the featured collection scrolls into the viewport centre. */
  featured: 0,
  /** Normalised pointer position, −1 → 1. */
  pointerX: 0,
  pointerY: 0,
};

export function resetHeroState() {
  heroState.statement = 0;
  heroState.featured = 0;
  heroState.pointerX = 0;
  heroState.pointerY = 0;
}

export type Quality = "high" | "low";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
