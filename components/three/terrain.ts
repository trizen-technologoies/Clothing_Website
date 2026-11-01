/*
 * Height fields for the hero landscape, built into ready-to-upload mesh
 * arrays with their static lighting baked in. Pure and DOM-free, so it runs
 * in a worker (terrain.worker.ts): generating the foreground takes most of a
 * second.
 */

/** Top of the summit the garment floats over. */
export const SUMMIT_Y = -1.95;

/** Moonlight direction (toward the light): low, from behind the peaks, so it rims crests. */
const MOON = (() => {
  const [x, y, z] = [-0.26, 0.3, -0.92];
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
})();
const MOON_COLOR = [0.52, 0.86, 0.93];
// Sky light from above, bounce from the dark ground below (linear RGB).
const SKY = [0.011, 0.04, 0.052];
const GROUND = [0.001, 0.0015, 0.002];

/* ------------------------------------------------------------------ */
/* Noise                                                               */
/* ------------------------------------------------------------------ */

/** Seeded 2D simplex noise, about -1..1. */
function simplex(seed: number) {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let s = seed;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = Uint8Array.from({ length: 512 }, (_, i) => p[i & 255]);
  const grad = [1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 0, 1, 0, -1];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  const corner = (h: number, x: number, y: number) => {
    const t = 0.5 - x * x - y * y;
    if (t < 0) return 0;
    const g = (h & 7) * 2;
    return t * t * t * t * (grad[g] * x + grad[g + 1] * y);
  };
  return (x: number, y: number) => {
    const k = (x + y) * F2;
    const i = Math.floor(x + k);
    const j = Math.floor(y + k);
    const u = (i + j) * G2;
    const x0 = x - i + u;
    const y0 = y - j + u;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = 1 - i1;
    const ii = i & 255;
    const jj = j & 255;
    return (
      70 *
      (corner(perm[ii + perm[jj]], x0, y0) +
        corner(perm[ii + i1 + perm[jj + j1]], x0 - i1 + G2, y0 - j1 + G2) +
        corner(perm[ii + 1 + perm[jj + 1]], x0 - 1 + 2 * G2, y0 - 1 + 2 * G2))
    );
  };
}

const noise = simplex(4127);

function fbm(x: number, y: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * noise(x, y);
    norm += amp;
    amp *= 0.5;
    x = x * 2.03 + 17.3;
    y = y * 2.03 - 9.1;
  }
  return sum / norm;
}

/** Ridged multifractal, 0..1: sharp crests like weathered rock. */
function ridged(x: number, y: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let weight = 1;
  for (let o = 0; o < octaves; o++) {
    let n = 1 - Math.abs(noise(x, y));
    n *= n * weight;
    weight = Math.min(1, n * 2);
    sum += n * amp;
    norm += amp;
    amp *= 0.5;
    x = x * 2.1 + 5.7;
    y = y * 2.1 + 3.3;
  }
  return sum / norm;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Smooth maximum: unions two landforms without a crease. */
function smax(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + h * h * k * 0.25;
}

/** Signed distance to a rectangle in the ground plane. */
function sdBox(x: number, z: number, cx: number, cz: number, hx: number, hz: number) {
  const dx = Math.abs(x - cx) - hx;
  const dz = Math.abs(z - cz) - hz;
  return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
}

/** Rounded cone: a mountain's mass, before the rock detail. */
function massif(x: number, z: number, cx: number, cz: number, height: number, radius: number) {
  const t = Math.max(0, 1 - Math.hypot(x - cx, z - cz) / radius);
  return height * t * t * (3 - 2 * t);
}

/* ------------------------------------------------------------------ */
/* Landforms                                                           */
/* ------------------------------------------------------------------ */

type Height = (x: number, z: number) => [height: number, shade: number];

/** The foreground: the summit, a crag on the left, mountains behind. */
const nearHeight: Height = (x, z) => {
  const rock = ridged(x * 0.55, z * 0.55, 5);
  const ridges = ridged(x * 0.17 + 4, z * 0.17, 3);
  const grain = fbm(x * 1.9, z * 1.9, 3);

  // A rocky ridge along the garment's path, its top kept below the hem.
  const d = sdBox(x, z, 0, -0.7, 4.4, 1.05) + 0.6 * fbm(x * 0.45 + 3, z * 0.45, 3);
  const top = SUMMIT_Y - 0.25 + 0.4 * rock + 0.05 * grain;
  const summit = d < 0 ? top : top - 3.6 * (1 - Math.exp(-d * 1.3)) + 0.6 * rock * Math.min(d, 2);

  // A crag rising into the hero view's bottom-left corner, under the copy.
  const crag =
    -3 + (2.4 * smoothstep(-0.5, -2.9, x) + 0.7 * smoothstep(-2.9, -6, x)) * smoothstep(1, 2.2, z) * (1 - smoothstep(4.4, 6.5, z)) + 0.6 * rock * smoothstep(-0.8, -3, x);

  const mass = massif(x, z, 6.2, -5.5, 4.6, 4.2) + massif(x, z, 9.6, -3.2, 6.2, 4.6) + massif(x, z, -6.5, -9, 3.6, 4.5) + massif(x, z, -2.5, -11.5, 3.2, 4);
  const mountains = -5 + mass * (0.75 + 0.45 * ridges) + mass * 0.22 * rock;
  const valley = -4.8 + 0.6 * fbm(x * 0.25, z * 0.25, 3);

  const height = smax(smax(smax(valley, summit, 0.5), crag, 0.7), mountains, 0.8);
  return [height, 0.25 + 0.85 * rock * rock];
};

/** Distant ranges: broad massifs rising with distance into the mist. */
const farHeight: Height = (x, z) => {
  const r = ridged(x * 0.035 + 11, z * 0.035, 4);
  const rise = smoothstep(-12, -40, z);
  return [-6 + rise * (3 + 12 * r * r) + 0.6 * fbm(x * 0.12, z * 0.12, 3), 0.3 + 0.5 * r];
};

/* ------------------------------------------------------------------ */
/* Meshes                                                              */
/* ------------------------------------------------------------------ */

export type TerrainKind = "near" | "far";

const EXTENTS: Record<TerrainKind, { width: number; depth: number; cx: number; cz: number; height: Height }> = {
  near: { width: 30, depth: 17, cx: 0, cz: -1.5, height: nearHeight },
  far: { width: 150, depth: 64, cx: 0, cz: -42, height: farHeight },
};

/**
 * Mesh arrays. `color` is the baked static light (moon and sky) times the
 * rock's shade; `shade` alone is kept for light added at runtime.
 */
export type TerrainData = { position: Float32Array; normal: Float32Array; uv: Float32Array; color: Float32Array; shade: Float32Array; index: Uint32Array };

/** A grid mesh over the landform, `step` units between vertices. */
export function buildTerrain(kind: TerrainKind, step: number): TerrainData {
  const { width, depth, cx, cz, height } = EXTENTS[kind];
  const cols = Math.round(width / step);
  const rows = Math.round(depth / step);
  const nx = cols + 1;
  const nz = rows + 1;
  const dx = width / cols;
  const dz = depth / rows;
  const x0 = cx - width / 2;
  const z0 = cz - depth / 2;

  const h = new Float32Array(nx * nz);
  const shade = new Float32Array(nx * nz);
  const position = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const v = j * nx + i;
      const x = x0 + i * dx;
      const z = z0 + j * dz;
      [h[v], shade[v]] = height(x, z);
      position.set([x, h[v], z], v * 3);
      // World-scaled uvs, so rock grain has the same scale on every mesh.
      uv.set([x * 0.45, z * 0.45], v * 2);
    }
  }

  const normal = new Float32Array(nx * nz * 3);
  const color = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const v = j * nx + i;
      const gx = (h[j * nx + Math.min(i + 1, cols)] - h[j * nx + Math.max(i - 1, 0)]) / (2 * dx);
      const gz = (h[Math.min(j + 1, rows) * nx + i] - h[Math.max(j - 1, 0) * nx + i]) / (2 * dz);
      const len = Math.hypot(gx, 1, gz);
      const n = [-gx / len, 1 / len, -gz / len];
      normal.set(n, v * 3);
      const moon = Math.max(0, n[0] * MOON[0] + n[1] * MOON[1] + n[2] * MOON[2]);
      const up = n[1] * 0.5 + 0.5;
      for (let c = 0; c < 3; c++) color[v * 3 + c] = shade[v] * (MOON_COLOR[c] * moon + GROUND[c] + (SKY[c] - GROUND[c]) * up);
    }
  }

  // Two triangles per cell, wound to face up.
  const index = new Uint32Array(cols * rows * 6);
  for (let j = 0, k = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++, k += 6) {
      const a = j * nx + i;
      const c = a + nx;
      index.set([a, c, a + 1, a + 1, c, c + 1], k);
    }
  }

  return { position, normal, uv, color, shade, index };
}
