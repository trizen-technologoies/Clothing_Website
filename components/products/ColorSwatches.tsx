"use client";

import type { ProductColor } from "@/lib/commerce/types";

type Props = {
  name: string;
  colors: ProductColor[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  legend?: string;
};

/** Native radio group styled as color swatches (arrow keys work out of the box). */
export function ColorSwatches({ name, colors, value, onChange, size = "md", legend = "Color" }: Props) {
  const dot = size === "sm" ? "size-3.5" : "size-7";
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={`flex flex-wrap items-center ${size === "sm" ? "gap-1.5" : "gap-2.5"}`}>
        {colors.map((c) => (
          <label key={c.id} className="relative inline-flex cursor-pointer" title={c.name}>
            <input
              type="radio"
              name={name}
              value={c.id}
              checked={value === c.id}
              onChange={() => onChange(c.id)}
              className="peer sr-only"
            />
            <span className="sr-only">{c.name}</span>
            <span
              aria-hidden
              style={{ backgroundColor: c.hex }}
              className={`${dot} rounded-full border border-white/25 ring-offset-2 ring-offset-ink transition-shadow peer-checked:ring-1 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-cyan`}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
