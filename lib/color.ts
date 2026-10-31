function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Linear blend between two hex colors. */
export function mix(a: string, b: string, t: number) {
  const ca = parse(a);
  const cb = parse(b);
  return toHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** Relative luminance (0–1). */
export function luminance(hex: string) {
  const [r, g, b] = parse(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLight(hex: string) {
  return luminance(hex) > 0.25;
}

/** Derived tones for drawing a garment in a given fabric color. */
export function fabricTones(hex: string) {
  const light = isLight(hex);
  return {
    base: hex,
    highlight: mix(hex, "#ffffff", light ? 0.35 : 0.16),
    shadow: mix(hex, "#000000", light ? 0.32 : 0.55),
    seam: light ? mix(hex, "#000000", 0.32) : mix(hex, "#ffffff", 0.2),
    stitch: light ? mix(hex, "#000000", 0.24) : mix(hex, "#ffffff", 0.15),
    panel: light ? mix(hex, "#ffffff", 0.12) : mix(hex, "#ffffff", 0.05),
    recess: mix(hex, "#000000", light ? 0.28 : 0.6),
    print: light ? "#0e0f12" : "#e9e5dc",
    tonal: light ? mix(hex, "#000000", 0.18) : mix(hex, "#ffffff", 0.14),
    light,
  };
}
