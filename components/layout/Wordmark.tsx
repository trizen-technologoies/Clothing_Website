import { brand } from "@/lib/brand";

/*
 * Custom geometric wordmark for "VANTA" (A drawn as Λ). Glyphs are filled
 * polygons in a 10 × 12 cell. If brand.name changes, the wordmark falls back
 * to set type — or replace this component with your own SVG logo.
 */

const GLYPHS: Record<string, string[]> = {
  V: ["M0 0H2.5L5 8.4L7.5 0H10L6.3 12H3.7Z"],
  A: ["M0 12H2.5L5 3.6L7.5 12H10L6.3 0H3.7Z"],
  N: ["M0 0H2.3V12H0Z", "M7.7 0H10V12H7.7Z", "M0 0H2.6L10 12H7.4Z"],
  T: ["M0 0H10V2.3H0Z", "M3.85 0H6.15V12H3.85Z"],
};

const ADVANCE = 14.5;

export function Wordmark({ className = "", title = brand.name }: { className?: string; title?: string }) {
  const letters = brand.name.toUpperCase().split("");
  const custom = letters.every((l) => GLYPHS[l]);

  if (!custom) {
    return <span className={`font-display-wide text-lg tracking-[0.3em] ${className}`}>{brand.name}</span>;
  }

  const width = (letters.length - 1) * ADVANCE + 10;
  return (
    <svg viewBox={`0 0 ${width} 12`} className={className} role="img" aria-label={title} fill="currentColor">
      {letters.map((l, i) => (
        <g key={i} transform={`translate(${i * ADVANCE} 0)`}>
          {GLYPHS[l].map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}
