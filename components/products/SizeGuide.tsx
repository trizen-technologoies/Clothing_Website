"use client";

import { Ruler, X } from "lucide-react";
import { useId, useState } from "react";

import { Sheet } from "@/components/ui/Sheet";
import type { GarmentKind } from "@/lib/garments";
import { sizeGuides } from "@/lib/size-guide";

export function SizeGuideButton({ garment, productName }: { garment: GarmentKind; productName: string }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const guide = sizeGuides[garment];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="eyebrow inline-flex items-center gap-2 text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
      >
        <Ruler className="size-3.5" strokeWidth={1.5} />
        Size guide
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} side="center" labelledBy={titleId} className="w-full max-w-lg border border-line bg-ink-2 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow text-cyan">Size guide</p>
            <h2 id={titleId} className="font-display-x mt-3 text-4xl">
              {productName}
            </h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close size guide" className="-mr-2 -mt-2 inline-flex size-10 items-center justify-center text-muted hover:text-fg">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[22rem] border-collapse text-left font-mono text-xs">
            <caption className="sr-only">Measurements in centimetres</caption>
            <thead>
              <tr className="border-b border-line text-muted">
                {guide.columns.map((c) => (
                  <th key={c} scope="col" className="py-3 pr-4 font-normal uppercase tracking-wider">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guide.rows.map((row) => (
                <tr key={String(row[0])} className="border-b border-line/60">
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="py-3 pr-4 font-normal text-fg">
                        {cell}
                      </th>
                    ) : (
                      <td key={i} className="py-3 pr-4 text-muted">
                        {cell} cm
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-sm text-muted">{guide.note} Demo measurements for illustration only.</p>
      </Sheet>
    </>
  );
}
