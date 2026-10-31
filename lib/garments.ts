/*
 * Garment silhouettes.
 *
 * Each garment is described as a "technical flat": an outline polygon with
 * per-corner radii plus construction details (seams, stitching, zips, ribs).
 * The same data drives the SVG product illustrations and the 3D form studies
 * (extruded outline + canvas bump/emissive maps), so both always match.
 *
 * Coordinates live in a 200-unit-wide space, y pointing down, centre x = 100.
 */

export type GarmentKind = "tee" | "tee-boxy" | "hoodie" | "zip-hoodie" | "jacket" | "cargo";

/** [x, y, cornerRadius?] */
export type Pt = readonly [number, number] | readonly [number, number, number];

export type DetailStyle =
  | "seam" // solid construction line
  | "stitch" // dashed topstitch
  | "zip" // zipper tape + teeth
  | "rib" // fine rib knit lines
  | "panel" // layered fabric piece (flaps, loops) — filled + outlined
  | "shade" // recessed area (hood lining) — darker fill, no stroke
  | "cord" // drawcord
  | "accent"; // reflective signal tape

export type Detail = {
  style: DetailStyle;
  points: Pt[];
  closed?: boolean;
  /** Stroke width override, in garment units. */
  width?: number;
};

export type GarmentView = {
  outline: Pt[];
  details: Detail[];
  /** Printed/embroidered emblem position and scale. */
  emblem?: { cx: number; cy: number; scale: number; tonal?: boolean };
};

export type GarmentSpec = {
  label: string;
  front: GarmentView;
  back: GarmentView;
  /** Crop for the close-up gallery view: [x, y, width, height]. */
  focus: [number, number, number, number];
};

/* ------------------------------------------------------------------ */
/* Path helpers                                                        */
/* ------------------------------------------------------------------ */

export type PathCmd =
  | { type: "M" | "L"; x: number; y: number }
  | { type: "Q"; cx: number; cy: number; x: number; y: number }
  | { type: "Z" };

/** Converts a polygon/polyline with per-corner radii into path commands. */
export function roundedPath(points: readonly Pt[], closed: boolean): PathCmd[] {
  const n = points.length;
  const cmds: PathCmd[] = [];
  if (n < 2) return cmds;

  for (let i = 0; i < n; i++) {
    const [x, y, r = 0] = points[i];
    const isEnd = !closed && (i === 0 || i === n - 1);
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const d1 = Math.hypot(prev[0] - x, prev[1] - y);
    const d2 = Math.hypot(next[0] - x, next[1] - y);

    if (!r || isEnd || d1 === 0 || d2 === 0) {
      cmds.push({ type: i === 0 ? "M" : "L", x, y });
      continue;
    }

    const t1 = Math.min(r, d1 / 2);
    const t2 = Math.min(r, d2 / 2);
    const ax = x + ((prev[0] - x) / d1) * t1;
    const ay = y + ((prev[1] - y) / d1) * t1;
    const bx = x + ((next[0] - x) / d2) * t2;
    const by = y + ((next[1] - y) / d2) * t2;
    cmds.push({ type: i === 0 ? "M" : "L", x: ax, y: ay });
    cmds.push({ type: "Q", cx: x, cy: y, x: bx, y: by });
  }

  if (closed) cmds.push({ type: "Z" });
  return cmds;
}

const f = (v: number) => Math.round(v * 100) / 100;

export function toSvgPath(cmds: PathCmd[]) {
  return cmds
    .map((c) => {
      if (c.type === "Z") return "Z";
      if (c.type === "Q") return `Q${f(c.cx)} ${f(c.cy)} ${f(c.x)} ${f(c.y)}`;
      return `${c.type}${f(c.x)} ${f(c.y)}`;
    })
    .join("");
}

export function outlinePath(view: GarmentView) {
  return toSvgPath(roundedPath(view.outline, true));
}

export function detailPath(detail: Detail) {
  return toSvgPath(roundedPath(detail.points, Boolean(detail.closed)));
}

export function getBounds(points: readonly Pt[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/** Ring + chevron emblem, as SVG path strings (ring uses evenodd). */
export function emblemPaths(cx: number, cy: number, s: number) {
  const R = 24 * s;
  const r = 20.5 * s;
  const circle = (rad: number) =>
    `M${f(cx - rad)} ${f(cy)}a${f(rad)} ${f(rad)} 0 1 0 ${f(2 * rad)} 0a${f(rad)} ${f(rad)} 0 1 0 ${f(-2 * rad)} 0Z`;
  const p = (dx: number, dy: number) => `${f(cx + dx * s)} ${f(cy + dy * s)}`;
  return {
    ring: circle(R) + circle(r),
    chevron: `M${p(-13, -11)}L${p(-6, -11)}L${p(0, 4)}L${p(6, -11)}L${p(13, -11)}L${p(0, 15)}Z`,
  };
}

/* ------------------------------------------------------------------ */
/* Authoring helpers                                                   */
/* ------------------------------------------------------------------ */

const AXIS = 100;
const mx = (p: Pt): Pt => (p.length === 3 ? [2 * AXIS - p[0], p[1], p[2]] : [2 * AXIS - p[0], p[1]]);

/** Builds a closed, symmetric outline from its right half (top → bottom, clockwise). */
function symmetric(rightHalf: Pt[]): Pt[] {
  const left = rightHalf.filter((p) => p[0] !== AXIS).map(mx).reverse();
  return [...rightHalf, ...left];
}

/** A detail plus its mirror image across the centre line. */
function sym(detail: Detail): Detail[] {
  return [detail, { ...detail, points: detail.points.map(mx) }];
}

/** Evenly spaced rib lines between two edges. */
function ribs(a0: [number, number], a1: [number, number], b0: [number, number], b1: [number, number], count: number): Detail[] {
  const out: Detail[] = [];
  for (let i = 1; i < count; i++) {
    const t = i / count;
    out.push({
      style: "rib",
      points: [
        [a0[0] + (a1[0] - a0[0]) * t, a0[1] + (a1[1] - a0[1]) * t],
        [b0[0] + (b1[0] - b0[0]) * t, b0[1] + (b1[1] - b0[1]) * t],
      ],
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Tees                                                                */
/* ------------------------------------------------------------------ */

function teeSpec(opts: {
  label: string;
  shoulder: Pt;
  sleeveOuter: Pt;
  sleeveInner: Pt;
  armpit: Pt;
  hemY: number;
  hemX: number;
  sleeveStitch: [Pt, Pt];
  emblem?: boolean;
  focus: [number, number, number, number];
}): GarmentSpec {
  const { shoulder, sleeveOuter, sleeveInner, armpit, hemY, hemX } = opts;
  const body = (neck: Pt[]): Pt[] =>
    symmetric([...neck, [122, 14, 3], shoulder, sleeveOuter, sleeveInner, armpit, [hemX, hemY, 5], [AXIS, hemY]]);

  const shared: Detail[] = [
    ...sym({ style: "seam", points: [[shoulder[0] - 1, shoulder[1] + 1], [armpit[0], armpit[1]]] }),
    ...sym({ style: "stitch", points: opts.sleeveStitch }),
    { style: "stitch", points: [[2 * AXIS - hemX + 1, hemY - 8], [hemX - 1, hemY - 8]] },
  ];

  return {
    label: opts.label,
    focus: opts.focus,
    front: {
      outline: body([[AXIS, 31], [113, 29, 10]]),
      details: [
        { style: "seam", points: [[75, 15], [85, 35, 12], [AXIS, 37.5], [115, 35, 12], [125, 15]] },
        ...shared,
      ],
      emblem: opts.emblem ? { cx: AXIS, cy: 84, scale: 1 } : undefined,
    },
    back: {
      outline: body([[AXIS, 20], [114, 19, 8]]),
      details: [
        { style: "seam", points: [[75, 15], [88, 25, 8], [112, 25, 8], [125, 15]] },
        { style: "panel", closed: true, points: [[95, 27, 1], [105, 27, 1], [105, 35, 1], [95, 35, 1]] },
        ...shared,
      ],
    },
  };
}

/* ------------------------------------------------------------------ */
/* Hoodies                                                             */
/* ------------------------------------------------------------------ */

const HOODIE_OUTLINE = symmetric([
  [AXIS, -6, 30],
  [142, 6, 26],
  [140, 40, 6],
  [166, 50, 14],
  [191, 182, 2],
  [189, 206, 3],
  [167, 208, 3],
  [167, 184, 2],
  [162, 96, 10],
  [164, 212, 2],
  [160, 232, 4],
  [AXIS, 232],
]);

const HOODIE_SHARED: Detail[] = [
  ...sym({ style: "seam", points: [[166, 50], [159, 74, 16], [162, 96]] }),
  ...sym({ style: "seam", points: [[191, 182], [167, 184]] }),
  ...ribs([167, 184], [191, 182], [167, 208], [189, 206], 6),
  ...ribs([AXIS - 64, 212], [AXIS + 64, 212], [AXIS - 60, 232], [AXIS + 60, 232], 26),
  ...ribs([33, 184], [9, 182], [33, 208], [11, 206], 6),
  { style: "seam", points: [[36, 212], [164, 212]] },
];

const HOOD_OPENING: Pt[] = [[66, 42], [68, 12, 22], [AXIS, 2, 26], [132, 12, 22], [134, 42]];

const HOODIE_BACK: GarmentView = {
  outline: HOODIE_OUTLINE,
  details: [
    { style: "shade", closed: true, points: [[60, 40], [58, 6, 26], [AXIS, -6, 30], [142, 6, 26], [140, 40], [AXIS, 64, 30]] },
    { style: "seam", points: [[60, 40], [AXIS, 64, 30], [140, 40]] },
    { style: "seam", points: [[AXIS, -6], [AXIS, 60]] },
    ...HOODIE_SHARED,
  ],
};

const hoodie: GarmentSpec = {
  label: "Hoodie",
  focus: [50, -12, 100, 125],
  front: {
    outline: HOODIE_OUTLINE,
    details: [
      { style: "shade", closed: true, points: [...HOOD_OPENING, [AXIS, 66, 6]] },
      { style: "seam", points: HOOD_OPENING },
      { style: "seam", points: [[66, 42], [AXIS, 66, 6], [134, 42]] },
      { style: "cord", points: [[91, 60], [89, 112]] },
      { style: "cord", points: [[109, 60], [111, 112]] },
      { style: "cord", width: 4, points: [[89.3, 104], [89, 112]] },
      { style: "cord", width: 4, points: [[110.7, 104], [111, 112]] },
      { style: "seam", closed: true, points: [[66, 150, 4], [134, 150, 4], [146, 202, 4], [54, 202, 4]] },
      { style: "stitch", points: [[68, 155], [132, 155]] },
      ...HOODIE_SHARED,
    ],
  },
  back: HOODIE_BACK,
};

const zipHoodie: GarmentSpec = {
  label: "Zip Hoodie",
  focus: [62, 20, 76, 95],
  front: {
    outline: HOODIE_OUTLINE,
    details: [
      { style: "shade", closed: true, points: [...HOOD_OPENING, [AXIS, 64, 4]] },
      { style: "seam", points: HOOD_OPENING },
      { style: "cord", points: [[88, 58], [86, 108]] },
      { style: "cord", points: [[112, 58], [114, 108]] },
      { style: "cord", width: 4, points: [[86.3, 100], [86, 108]] },
      { style: "cord", width: 4, points: [[113.7, 100], [114, 108]] },
      ...sym({ style: "seam", points: [[105, 150], [140, 150, 4], [150, 204, 4], [105, 204]] }),
      { style: "zip", points: [[AXIS, 62], [AXIS, 232]] },
      ...HOODIE_SHARED,
    ],
  },
  back: { ...HOODIE_BACK, emblem: { cx: AXIS, cy: 84, scale: 0.34, tonal: true } },
};

/* ------------------------------------------------------------------ */
/* Jacket                                                              */
/* ------------------------------------------------------------------ */

const JACKET_OUTLINE = symmetric([
  [AXIS, 10],
  [128, 10, 6],
  [132, 40, 3],
  [170, 50, 12],
  [196, 196, 3],
  [170, 202, 3],
  [166, 98, 10],
  [168, 222, 4],
  [AXIS, 222],
]);

const JACKET_SHARED: Detail[] = [
  ...sym({ style: "seam", points: [[170, 50], [161, 76, 16], [166, 98]] }),
  ...sym({ style: "seam", points: [[171, 188], [195, 183]] }),
  ...sym({ style: "stitch", points: [[172, 194], [195, 190]] }),
  { style: "stitch", points: [[33, 214], [167, 214]] },
];

const jacket: GarmentSpec = {
  label: "Jacket",
  focus: [92, 36, 72, 90],
  front: {
    outline: JACKET_OUTLINE,
    details: [
      { style: "seam", points: [[68, 40], [AXIS, 46, 40], [132, 40]] },
      { style: "stitch", points: [[74, 16], [126, 16]] },
      ...sym({ style: "panel", closed: true, points: [[116, 92, 3], [150, 92, 3], [150, 132, 3], [116, 132, 3]] }),
      ...sym({ style: "panel", closed: true, points: [[114, 86, 3], [152, 86, 3], [152, 101, 2], [114, 101, 2]] }),
      { style: "accent", width: 1.6, points: [[116, 99], [150, 99]] },
      ...sym({ style: "seam", points: [[124, 188], [141, 150]] }),
      ...sym({ style: "stitch", points: [[128, 189], [145, 151]] }),
      { style: "stitch", points: [[107, 42], [107, 212]] },
      { style: "zip", points: [[AXIS, 10], [AXIS, 222]] },
      ...sym({ style: "cord", points: [[150, 214], [152, 228]] }),
      ...JACKET_SHARED,
    ],
  },
  back: {
    outline: JACKET_OUTLINE,
    details: [
      { style: "seam", points: [[68, 40], [AXIS, 44, 40], [132, 40]] },
      { style: "seam", points: [[34, 66], [AXIS, 72, 80], [166, 66]] },
      { style: "accent", width: 6, points: [[35, 82], [165, 82]] },
      { style: "stitch", points: [[74, 16], [126, 16]] },
      ...JACKET_SHARED,
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Cargo pants                                                         */
/* ------------------------------------------------------------------ */

const CARGO_OUTLINE = symmetric([
  [AXIS, 0],
  [154, 0, 2],
  [160, 24, 8],
  [168, 110, 40],
  [160, 230, 4],
  [114, 232, 4],
  [102, 80, 6],
  [AXIS, 74, 4],
]);

const CARGO_SHARED: Detail[] = [
  { style: "seam", points: [[41, 22], [159, 22]] },
  ...sym({ style: "panel", closed: true, points: [[120, -1], [125, -1], [125, 25], [120, 25]] }),
  ...sym({ style: "panel", closed: true, points: [[143, -1], [148, -1], [148, 25], [143, 25]] }),
  ...sym({ style: "panel", closed: true, points: [[138, 104, 3], [166, 104, 3], [167, 154, 3], [140, 154, 3]] }),
  ...sym({ style: "panel", closed: true, points: [[136, 97, 3], [167, 97, 3], [167, 112, 2], [136, 112, 2]] }),
  ...sym({ style: "seam", points: [[109, 166], [164, 166]] }),
  ...sym({ style: "stitch", points: [[110, 172], [164, 172]] }),
  ...sym({ style: "stitch", points: [[113, 222], [160, 220]] }),
];

const cargo: GarmentSpec = {
  label: "Cargo",
  focus: [120, 82, 64, 80],
  front: {
    outline: CARGO_OUTLINE,
    details: [
      { style: "seam", points: [[AXIS, 22], [AXIS, 62]] },
      { style: "stitch", points: [[108, 22], [108, 54, 8], [AXIS, 64]] },
      ...sym({ style: "seam", points: [[134, 22], [140, 52, 18], [164, 60]] }),
      ...CARGO_SHARED,
    ],
  },
  back: {
    outline: CARGO_OUTLINE,
    details: [
      { style: "seam", points: [[41, 40], [AXIS, 52], [159, 40]] },
      { style: "seam", points: [[AXIS, 22], [AXIS, 72]] },
      ...sym({ style: "panel", closed: true, points: [[110, 58, 3], [146, 55, 3], [146, 94, 3], [112, 96, 3]] }),
      ...CARGO_SHARED,
    ],
  },
};

/* ------------------------------------------------------------------ */

export const garments: Record<GarmentKind, GarmentSpec> = {
  tee: teeSpec({
    label: "Oversized Tee",
    shoulder: [164, 26, 10],
    sleeveOuter: [200, 86, 3],
    sleeveInner: [172, 102, 3],
    armpit: [164, 84, 10],
    hemY: 196,
    hemX: 166,
    sleeveStitch: [[196, 79], [168, 95]],
    emblem: true,
    focus: [56, 30, 88, 110],
  }),
  "tee-boxy": teeSpec({
    label: "Boxy Tee",
    shoulder: [160, 24, 10],
    sleeveOuter: [194, 78, 3],
    sleeveInner: [168, 94, 3],
    armpit: [160, 80, 10],
    hemY: 170,
    hemX: 161,
    sleeveStitch: [[190, 71], [164, 87]],
    focus: [62, 0, 76, 95],
  }),
  hoodie,
  "zip-hoodie": zipHoodie,
  jacket,
  cargo,
};
