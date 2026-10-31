"use client";

import { btn } from "@/components/ui/buttons";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[80svh] max-w-[1600px] flex-col justify-center px-4 pt-24 sm:px-6 lg:px-10">
      <p className="eyebrow text-cyan">Something went wrong</p>
      <h1 className="font-display-x mt-6 text-[clamp(3.5rem,10vw,9rem)]">Interference.</h1>
      <p className="mt-6 max-w-md text-fg/70">This page failed to load. Try again — your cart is saved in this browser.</p>
      <button type="button" onClick={reset} className={`${btn.primary} mt-10 self-start`}>
        Try again
      </button>
    </div>
  );
}
