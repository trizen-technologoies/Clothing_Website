"use client";

type Props = {
  name: string;
  sizes: string[];
  stock: Record<string, number>;
  value: string | null;
  onChange: (size: string) => void;
  lowStockAt?: number;
};

/** Native radio group of sizes. Sold-out sizes are disabled; low stock is flagged. */
export function SizeSelector({ name, sizes, stock, value, onChange, lowStockAt = 3 }: Props) {
  return (
    <fieldset>
      <legend className="sr-only">Size</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1.5">
        {sizes.map((s) => {
          const qty = stock[s] ?? 0;
          const soldOut = qty <= 0;
          const low = !soldOut && qty <= lowStockAt;
          return (
            <label key={s} className={soldOut ? "cursor-not-allowed" : "cursor-pointer"}>
              <input
                type="radio"
                name={name}
                value={s}
                checked={value === s}
                disabled={soldOut}
                onChange={() => onChange(s)}
                className="peer sr-only"
              />
              <span className="sr-only">{soldOut ? ", sold out" : low ? `, only ${qty} left` : ""}</span>
              <span
                aria-hidden
                className="relative flex h-11 items-center justify-center border border-line font-mono text-xs tracking-wider text-fg transition-colors hover:border-line-strong peer-checked:border-fg peer-checked:bg-fg peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan peer-disabled:border-line peer-disabled:text-muted/50 peer-disabled:line-through peer-disabled:hover:border-line"
              >
                {s}
                {low && <span className="absolute right-1.5 top-1.5 size-1 rounded-full bg-cyan" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
