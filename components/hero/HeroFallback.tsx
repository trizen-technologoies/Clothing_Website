import Image from "next/image";

import { palette } from "@/lib/palette";
// Cut out by scripts/turntable.py --still.
import jacket from "@/public/hero/jacket.webp";

/**
 * Static stand-in for the 3D hero: shown while the scene loads and kept when
 * WebGL is unavailable. Mirrors the 3D composition so the hand-off is seamless.
 */
export function HeroFallback() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_50%_30%,rgba(26,213,236,0.07),transparent_70%),radial-gradient(35%_40%_at_45%_60%,rgba(27,138,163,0.09),transparent_70%)] md:bg-[radial-gradient(35%_55%_at_68%_38%,rgba(26,213,236,0.08),transparent_70%),radial-gradient(30%_40%_at_60%_58%,rgba(27,138,163,0.1),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[26%] border-t border-white/[0.04] bg-gradient-to-b from-white/[0.015] to-transparent" />
      <div className="absolute left-1/2 top-[11%] h-[46%] -translate-x-1/2 md:left-[67%] md:top-[15%] md:h-[66%]">
        <svg viewBox="0 0 100 140" className="absolute left-1/2 top-[-6%] h-[118%] -translate-x-1/2" fill="none">
          <path d="M8 140V50a42 42 0 0 1 84 0v90" stroke={palette.cyan} strokeOpacity="0.35" strokeWidth="0.6" />
          <path d="M4 140V50a46 46 0 0 1 92 0v90" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="3" />
        </svg>
        {/* Sized and placed like the 3D garment at its first pose. */}
        <Image
          src={jacket}
          alt=""
          sizes="(min-width: 768px) 25vw, 50vw"
          preload
          className="absolute left-1/2 top-[25%] h-[52%] w-auto max-w-none -translate-x-1/2 md:top-[26%] md:h-[61%] md:-translate-x-1/3"
        />
      </div>
    </div>
  );
}
