"use client";

import type Lenis from "lenis";

/*
 * Shared handle to the page's smooth-scroll instance. Modal sheets lock it so
 * the page can't drift behind them; locks are counted because sheets nest.
 */

let instance: Lenis | null = null;
let locks = 0;

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis;
  if (lenis && locks > 0) lenis.stop();
}

export function getSmoothScroll() {
  return instance;
}

export function lockScroll() {
  locks++;
  instance?.stop();
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (locks === 0) instance?.start();
}

/** Cancels any in-flight momentum (e.g. when the route changes mid-glide). */
export function settleScroll() {
  if (!instance || locks > 0) return;
  instance.stop();
  instance.start();
}
