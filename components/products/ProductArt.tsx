import { useId } from "react";

import { fabricTones } from "@/lib/color";
import {
  detailPath,
  emblemPaths,
  garments,
  getBounds,
  outlinePath,
  type Detail,
  type GarmentKind,
} from "@/lib/garments";

export type ArtView = "front" | "back" | "detail";

type Props = {
  garment: GarmentKind;
  color: string;
  graphic?: boolean;
  view?: ArtView;
  /** Accessible description of the illustration. */
  label: string;
  /** Adds technical-flat annotations (used on the product page). */
  annotate?: boolean;
  backdrop?: boolean;
  className?: string;
};

const W = 400;
const H = 500;

/**
 * Illustrated "technical flat" of a garment, drawn from the shared silhouette
 * data. Used as the product image whenever real photography isn't available.
 */
export function ProductArt({
  garment,
  color,
  graphic,
  view = "front",
  label,
  annotate,
  backdrop = true,
  className,
}: Props) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const spec = garments[garment];
  const side = view === "back" ? spec.back : spec.front;
  const tones = fabricTones(color);
  const b = getBounds(side.outline);

  let s: number;
  let tx: number;
  let ty: number;
  if (view === "detail") {
    const [fx, fy, fw, fh] = spec.focus;
    s = Math.max(W / fw, H / fh);
    tx = W / 2 - (fx + fw / 2) * s;
    ty = H / 2 - (fy + fh / 2) * s;
  } else {
    s = Math.min(286 / b.width, 352 / b.height);
    tx = W / 2 - (b.minX + b.width / 2) * s;
    ty = 232 - (b.minY + b.height / 2) * s;
  }

  const outline = outlinePath(side);
  const floorY = ty + b.maxY * s;
  const showEmblem = side.emblem && (side.emblem.tonal || graphic);
  const emblem = showEmblem && side.emblem ? emblemPaths(side.emblem.cx, side.emblem.cy, side.emblem.scale) : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      className={className}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id={`${id}-spot`} cx="50%" cy="18%" r="75%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.09" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.015" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id={`${id}-fabric`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={tones.highlight} />
          <stop offset="0.48" stopColor={tones.base} />
          <stop offset="1" stopColor={tones.shadow} />
        </linearGradient>
        <radialGradient id={`${id}-sheen`} cx="32%" cy="22%" r="60%">
          <stop offset="0" stopColor="#ffffff" stopOpacity={tones.light ? 0.16 : 0.1} />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-pillow`} x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
          <feComposite in="SourceAlpha" in2="blur" operator="arithmetic" k2="1" k3="-1" result="edge" />
          <feFlood floodColor="#000" floodOpacity={tones.light ? 0.35 : 0.6} />
          <feComposite in2="edge" operator="in" result="shade" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="shade" />
          </feMerge>
        </filter>
        <filter id={`${id}-blur`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <clipPath id={`${id}-clip`}>
          <path d={outline} />
        </clipPath>
      </defs>

      {backdrop && (
        <g>
          <rect width={W} height={H} fill="#0d0f13" />
          <rect width={W} height={H} fill={`url(#${id}-spot)`} />
          {view !== "detail" && (
            <>
              <rect y={floorY - 6} width={W} height={H - floorY + 6} fill={`url(#${id}-floor)`} />
              <ellipse cx={W / 2} cy={floorY + 14} rx={b.width * s * 0.42} ry={9} fill="#000" opacity={0.85} filter={`url(#${id}-blur)`} />
            </>
          )}
        </g>
      )}

      <g transform={`translate(${tx} ${ty}) scale(${s})`}>
        {/* Rim light: cyan from the right, violet from the left. */}
        <path d={outline} fill="none" stroke="#00e5ff" strokeOpacity={0.5} strokeWidth={2.2 / s * 1.4} transform="translate(1.1 -0.5)" />
        <path d={outline} fill="none" stroke="#8b5cf6" strokeOpacity={0.4} strokeWidth={2.2 / s * 1.4} transform="translate(-1.1 -0.5)" />

        <path d={outline} fill={`url(#${id}-fabric)`} filter={`url(#${id}-pillow)`} />

        <g clipPath={`url(#${id}-clip)`}>
          {side.details.map((d, i) => (
            <DetailShape key={i} detail={d} tones={tones} />
          ))}

          {emblem && side.emblem && (
            <g fill={side.emblem.tonal ? tones.tonal : tones.print}>
              <path d={emblem.ring} fillRule="evenodd" />
              <path d={emblem.chevron} />
              {!side.emblem.tonal && (
                <text
                  x={side.emblem.cx}
                  y={side.emblem.cy + 36}
                  textAnchor="middle"
                  fontSize={4.6}
                  letterSpacing={1.4}
                  className="font-mono"
                >
                  SIGNAL / 001
                </text>
              )}
            </g>
          )}

          <path d={outline} fill={`url(#${id}-sheen)`} />
        </g>

        <path d={outline} fill="none" stroke={tones.seam} strokeOpacity={0.45} strokeWidth={0.6} />
      </g>

      {annotate && view !== "detail" && (
        <g className="font-mono" fill="#00e5ff" stroke="#00e5ff" fontSize={9} letterSpacing={1.6}>
          <g strokeOpacity={0.45} strokeWidth={0.75} fill="none">
            <path d={`M${tx + b.minX * s} 470V478M${tx + b.minX * s} 474H${tx + b.maxX * s}M${tx + b.maxX * s} 470V478`} />
            <path d={`M378 ${ty + b.minY * s}H386M382 ${ty + b.minY * s}V${floorY}M378 ${floorY}H386`} />
          </g>
          <text x={22} y={32} stroke="none" fillOpacity={0.75}>
            FIG.{view === "back" ? "B" : "A"} — {spec.label.toUpperCase()} / {view.toUpperCase()}
          </text>
          <text x={W / 2} y={492} stroke="none" fillOpacity={0.55} textAnchor="middle">
            ILLUSTRATED FLAT · NOT TO SCALE
          </text>
        </g>
      )}
    </svg>
  );
}

function DetailShape({ detail, tones }: { detail: Detail; tones: ReturnType<typeof fabricTones> }) {
  const d = detailPath(detail);
  switch (detail.style) {
    case "seam":
      return <path d={d} fill="none" stroke={tones.seam} strokeWidth={detail.width ?? 0.9} strokeLinecap="round" strokeLinejoin="round" />;
    case "stitch":
      return <path d={d} fill="none" stroke={tones.stitch} strokeWidth={detail.width ?? 0.65} strokeDasharray="2.2 1.6" />;
    case "rib":
      return <path d={d} fill="none" stroke={tones.stitch} strokeOpacity={0.55} strokeWidth={0.45} />;
    case "panel":
      return <path d={d} fill={tones.panel} stroke={tones.seam} strokeWidth={0.8} strokeLinejoin="round" />;
    case "shade":
      return <path d={d} fill={tones.recess} fillOpacity={0.55} />;
    case "cord":
      return <path d={d} fill="none" stroke={tones.light ? tones.shadow : tones.highlight} strokeWidth={detail.width ?? 1.8} strokeLinecap="round" />;
    case "accent":
      return (
        <path d={d} fill="none" stroke="#00e5ff" strokeOpacity={0.85} strokeWidth={detail.width ?? 2} />
      );
    case "zip":
      return (
        <g>
          <path d={d} fill="none" stroke={tones.recess} strokeWidth={3.2} />
          <path d={d} fill="none" stroke={tones.seam} strokeWidth={1.6} strokeDasharray="0.6 0.9" />
        </g>
      );
  }
}
