"use client";

import { Minus, Plus } from "lucide-react";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  label?: string;
  size?: "sm" | "md";
};

export function QuantityStepper({ value, onChange, min = 1, max, label = "Quantity", size = "md" }: Props) {
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-8" : "w-11";
  return (
    <div role="group" aria-label={label} className={`inline-flex ${h} items-stretch border border-line`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={`${w} inline-flex items-center justify-center text-muted transition-colors hover:text-fg disabled:opacity-30`}
      >
        <Minus className="size-3.5" />
      </button>
      <output aria-live="polite" className="inline-flex min-w-8 items-center justify-center font-mono text-xs">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={`${w} inline-flex items-center justify-center text-muted transition-colors hover:text-fg disabled:opacity-30`}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
