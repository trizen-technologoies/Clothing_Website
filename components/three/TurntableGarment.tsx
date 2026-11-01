"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

import { palette } from "@/lib/palette";
import manifest from "@/public/hero/turntable/manifest.json";
import { GARMENT_HEIGHT } from "./garmentGeometry";
import type { Quality } from "./heroState";

/*
 * A real garment from a filmed turntable (built by scripts/turntable.py):
 * a camera-facing card that shows the frame for the current turn, crossfading
 * between neighbours. Every frame sits small on one sheet that stays on the
 * GPU, so the turn never waits for a frame; once the garment is nearly still,
 * sharp frames around it are decoded and fade in. Studio lights can't reach a
 * photo, so the key, rims and reflective trim are painted on from the scene's
 * light levels.
 */

export type TurntableLevels = {
  /** Garment turn relative to the camera, in radians (as rotation.y). */
  turn: number;
  intro: number;
  key: number;
  cyan: number;
  teal: number;
  glow: number;
};

const TAU = Math.PI * 2;
const COUNT = manifest.frames;
const SHEET = manifest.atlas;
const CELL = { width: SHEET.width / SHEET.cols, height: SHEET.height / SHEET.rows };
const [GARMENT_TOP, GARMENT_BOTTOM] = manifest.garment;
const CARD_HEIGHT = GARMENT_HEIGHT / (GARMENT_BOTTOM - GARMENT_TOP);
const CARD_WIDTH = (CARD_HEIGHT * manifest.width) / manifest.height;
const BASE = "/hero/turntable";

// Sharp frames are decoded only while the garment is nearly still (turning
// less than this many frames per rendered frame): decoding and uploading
// them mid-turn drops frames on integrated GPUs.
const SETTLED = 0.04;
// Sharp frames kept either side of the current one.
const REACH = 4;
const POOL = 2 * REACH + 4;
const NEAR = [0, ...Array.from({ length: REACH }, (_, k) => [k + 1, -(k + 1)]).flat()];
const FETCH_CONCURRENCY = 4;

const wrap = (i: number) => ((i % COUNT) + COUNT) % COUNT;
/** Shortest distance between two frames around the turn. */
const apart = (a: number, b: number) => Math.min(wrap(a - b), wrap(b - a));

async function fetchBlob(url: string, signal: AbortSignal) {
  const res = await fetch(`${url}?v=${manifest.version}`, { signal });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.blob();
}

// Unpremultiplied bitmaps stay in memory and upload in ~1 ms; premultiplied
// ones can live on the GPU, and copying those into an sRGB texture stalls it.
const decode = (blob: Blob) => createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });

function bitmapTexture(mipmaps: boolean) {
  const t = new THREE.Texture();
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // ImageBitmaps ignore flipY; the shader flips instead
  t.generateMipmaps = mipmaps;
  t.minFilter = mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  return t;
}

function upload(renderer: THREE.WebGLRenderer, tex: THREE.Texture, bitmap: ImageBitmap) {
  tex.image = bitmap;
  tex.needsUpdate = true;
  renderer.initTexture(tex);
  bitmap.close(); // the GPU copy is all that's needed
}

/** Full-size frames, downloaded in the background and kept on the GPU around a still garment. */
class SharpFrames {
  private blobs = new Array<Blob | undefined>(COUNT);
  private resident = new Map<number, THREE.Texture>();
  private spare = Array.from({ length: POOL }, () => bitmapTexture(true));
  /** Requested frames, from decode until upload (or drop). */
  private pending = new Set<number>();
  private decoded: [number, ImageBitmap][] = [];
  private decoding = false;

  constructor(
    private signal: AbortSignal,
    private onReady: () => void,
  ) {}

  /** Downloads every frame, nearest `start` first. */
  load(start: number) {
    const order = Array.from({ length: COUNT }, (_, i) => i).sort((a, b) => apart(a, start) - apart(b, start));
    let next = 0;
    const worker = async () => {
      while (next < order.length && !this.signal.aborted) {
        const i = order[next++];
        try {
          this.blobs[i] = await fetchBlob(`${BASE}/frames/${String(i).padStart(3, "0")}.webp`, this.signal);
        } catch {
          // The sheet covers a missing frame.
        }
      }
    };
    for (let k = 0; k < FETCH_CONCURRENCY; k++) void worker();
  }

  get(i: number) {
    return this.resident.get(i);
  }

  /** Uploads the last decode and starts the next, one at a time, for the frames around `at`. */
  update(at: number, renderer: THREE.WebGLRenderer, keep: number[]) {
    const near = NEAR.map((offset) => wrap(at + offset));
    const done = this.decoded.shift();
    if (done) {
      const [i, bitmap] = done;
      const tex = near.includes(i) ? (this.spare.pop() ?? this.evict(at, [...near, ...keep])) : undefined;
      if (tex) {
        upload(renderer, tex, bitmap);
        this.resident.set(i, tex);
        this.onReady();
      } else {
        bitmap.close();
      }
      this.pending.delete(i);
    }

    if (this.decoding) return;
    const i = near.find((j) => this.blobs[j] && !this.resident.has(j) && !this.pending.has(j));
    if (i === undefined) return;
    this.pending.add(i);
    this.decoding = true;
    decode(this.blobs[i]!)
      .then((bitmap) => {
        if (this.signal.aborted) return bitmap.close();
        this.decoded.push([i, bitmap]);
        this.onReady();
      })
      .catch(() => this.pending.delete(i))
      .finally(() => (this.decoding = false));
  }

  /** Frees the texture of the unprotected frame farthest from `at`; the pool is larger than the window. */
  private evict(at: number, protect: number[]) {
    let worst = -1;
    for (const j of this.resident.keys()) {
      if (!protect.includes(j) && (worst < 0 || apart(j, at) > apart(worst, at))) worst = j;
    }
    if (worst < 0) return undefined;
    const tex = this.resident.get(worst)!;
    this.resident.delete(worst);
    return tex;
  }

  dispose() {
    for (const [, bitmap] of this.decoded) bitmap.close();
    for (const tex of [...this.spare, ...this.resident.values()]) tex.dispose();
  }
}

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x, 1.0 - uv.y); // bitmaps upload top row first
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D uSheet;
  uniform vec2 uGrid;
  uniform vec2 uCellA;
  uniform vec2 uCellB;
  uniform sampler2D uFrameA;
  uniform sampler2D uFrameB;
  uniform float uMix;
  uniform float uDetail;
  uniform vec2 uRimOffset;
  uniform float uOpacity;
  uniform float uExposure;
  uniform float uGlow;
  uniform vec3 uRimRight;
  uniform vec3 uRimLeft;
  uniform vec3 uRimTop;
  varying vec2 vUv;

  // Premultiplied, so transparent texels can't tint the edges when blending.
  vec4 premultiply(vec4 c) {
    return vec4(c.rgb * c.a, c.a);
  }

  vec4 sheet(vec2 uv) {
    uv = clamp(uv, 0.0, 1.0);
    return mix(
      premultiply(texture2D(uSheet, (uCellA + uv) / uGrid)),
      premultiply(texture2D(uSheet, (uCellB + uv) / uGrid)),
      uMix
    );
  }

  // How much of an edge faces dir: strongest at the silhouette, fading inward.
  float rim(float a, vec2 dir) {
    vec2 d = dir * uRimOffset;
    return clamp(a - 0.5 * (sheet(vUv + d).a + sheet(vUv + d * 3.0).a), 0.0, 1.0);
  }

  void main() {
    vec4 low = sheet(vUv);
    vec4 c = low;
    if (uDetail > 0.0) {
      vec4 sharp = mix(premultiply(texture2D(uFrameA, vUv)), premultiply(texture2D(uFrameB, vUv)), uMix);
      c = mix(low, sharp, uDetail);
    }
    if (c.a < 0.004) discard;
    vec3 color = c.rgb / c.a;

    // Rim light on the edges facing each light (uv y runs down).
    float right = rim(low.a, vec2(1.0, 0.0));
    float left = rim(low.a, vec2(-1.0, 0.0));
    float top = rim(low.a, vec2(0.0, -1.0));

    // Reflective trim: bright, near-grey texels catch the light and bloom.
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    vec3 lit = color * (uExposure + smoothstep(0.12, 0.4, luma) * uGlow);
    lit += uRimRight * right + uRimLeft * left + uRimTop * top;

    gl_FragColor = vec4(lit, c.a * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
  }
`;

const CYAN = new THREE.Color(palette.cyan);
const TEAL = new THREE.Color(palette.teal);
const KEY = new THREE.Color(palette.key);

type Props = { quality: Quality; level: RefObject<TurntableLevels> };

export function TurntableGarment({ quality, level }: Props) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const mesh = useRef<THREE.Mesh>(null);
  // Phones show the sheet alone: at their size it's close to full resolution.
  // Picked once, so a later quality drop doesn't reload anything.
  const [sharpFrames] = useState(() => quality === "high");
  const tiers = useRef<{ sheet: THREE.Texture | null; sharp: SharpFrames | null }>({ sheet: null, sharp: null });
  const motion = useRef({ last: 0, speed: 0, detail: 0 });

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
    // Centre the garment, not the card, on the origin.
    g.translate(0, (0.5 - (GARMENT_TOP + GARMENT_BOTTOM) / 2) * -CARD_HEIGHT, 0);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
          uSheet: { value: null },
          uGrid: { value: new THREE.Vector2(SHEET.cols, SHEET.rows) },
          uCellA: { value: new THREE.Vector2() },
          uCellB: { value: new THREE.Vector2() },
          uFrameA: { value: null },
          uFrameB: { value: null },
          uMix: { value: 0 },
          uDetail: { value: 0 },
          uRimOffset: { value: new THREE.Vector2(0.7 / CELL.width, 0.7 / CELL.height) },
          uOpacity: { value: 0 },
          uExposure: { value: 1 },
          uGlow: { value: 0 },
          uRimRight: { value: new THREE.Color() },
          uRimLeft: { value: new THREE.Color() },
          uRimTop: { value: new THREE.Color() },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        premultipliedAlpha: true,
        fog: true,
      }),
    [],
  );

  useEffect(() => {
    const abort = new AbortController();
    const sheet = bitmapTexture(false);
    const sharp = sharpFrames ? new SharpFrames(abort.signal, invalidate) : null;
    tiers.current = { sheet: null, sharp };
    (async () => {
      try {
        const bitmap = await decode(await fetchBlob(`${BASE}/atlas.webp`, abort.signal));
        if (abort.signal.aborted) return bitmap.close();
        upload(gl, sheet, bitmap);
        tiers.current.sheet = sheet;
        invalidate();
      } catch {
        return; // without the sheet the garment stays hidden
      }
      // Sharp frames download after the sheet, nearest the opening pose first.
      sharp?.load(wrap(Math.round(((level.current?.turn ?? 0) / TAU) * COUNT)));
    })();
    return () => {
      abort.abort();
      sharp?.dispose();
      sheet.dispose();
    };
  }, [gl, invalidate, level, sharpFrames]);

  useEffect(() => () => [geometry, material].forEach((o) => o.dispose()), [geometry, material]);

  useFrame((_, delta) => {
    const l = level.current;
    const m = mesh.current;
    const { sheet, sharp } = tiers.current;
    if (!l || !m) return;
    m.visible = sheet !== null;
    if (!sheet) return;
    const u = (m.material as THREE.ShaderMaterial).uniforms;

    // Fractional frame for this turn; frame 0 faces the camera.
    const x = wrap((l.turn / TAU) * COUNT);
    const s = motion.current;
    const step = Math.abs(wrap(x - s.last + COUNT / 2) - COUNT / 2);
    s.last = x;
    s.speed += (step - s.speed) * 0.2;

    const lo = Math.floor(x);
    const hi = wrap(lo + 1);
    u.uSheet.value = sheet;
    u.uMix.value = x - lo;
    (u.uCellA.value as THREE.Vector2).set(lo % SHEET.cols, Math.floor(lo / SHEET.cols));
    (u.uCellB.value as THREE.Vector2).set(hi % SHEET.cols, Math.floor(hi / SHEET.cols));

    // Sharp frames fade in once the garment settles, and fade out as it
    // starts to turn; without the exact pair they'd show the wrong angle.
    let target = 0;
    if (sharp) {
      const settled = s.speed < SETTLED;
      if (settled) sharp.update(lo, gl, [lo, hi]);
      const a = sharp.get(lo);
      const b = sharp.get(hi);
      if (a && b) {
        u.uFrameA.value = a;
        u.uFrameB.value = b;
        target = settled ? 1 : 0;
      } else {
        s.detail = 0;
      }
    }
    const rate = Math.min(delta, 0.1) / (target > s.detail ? 0.3 : 0.12);
    s.detail = target > s.detail ? Math.min(target, s.detail + rate) : Math.max(target, s.detail - rate);
    if (s.detail !== target) invalidate(); // keep fading when rendering on demand
    u.uDetail.value = s.detail;
    (window as unknown as { __ttDbg?: unknown }).__ttDbg = { detail: s.detail, speed: s.speed, sharp: !!sharp, lo, a: !!sharp?.get(lo), b: !!sharp?.get(hi), x }; // DEBUG-TT

    u.uOpacity.value = l.intro;
    u.uExposure.value = 0.55 + 0.45 * l.key;
    u.uGlow.value = l.glow;
    (u.uRimRight.value as THREE.Color).copy(CYAN).multiplyScalar(0.45 * l.cyan);
    (u.uRimLeft.value as THREE.Color).copy(TEAL).multiplyScalar(0.55 * l.teal);
    (u.uRimTop.value as THREE.Color).copy(KEY).multiplyScalar(0.25 * l.key);
  });

  // Drawn first among transparent objects, writing depth, so glows behind
  // the garment are hidden and those in front still show.
  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={-1} visible={false} />;
}
