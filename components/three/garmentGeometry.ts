import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import {
  detailPath,
  emblemPaths,
  garments,
  getBounds,
  outlinePath,
  roundedPath,
  type Detail,
  type GarmentKind,
  type GarmentView,
} from "@/lib/garments";
import type { Quality } from "./heroState";

/*
 * Turns a garment's technical flat into a 3D "form study": the outline is
 * extruded with a deep rounded bevel, and construction details are painted
 * into canvas bump / emissive / color maps on the front and back caps.
 * It is a sculptural object derived from the flat — not a garment simulation.
 */

export const GARMENT_HEIGHT = 3.2;
const PAD = 10;

type Frame = { x0: number; y0: number; w: number; h: number; cx: number; cy: number; s: number };

function frameFor(kind: GarmentKind): Frame {
  const b = getBounds(garments[kind].front.outline);
  return {
    x0: b.minX - PAD,
    y0: b.minY - PAD,
    w: b.width + PAD * 2,
    h: b.height + PAD * 2,
    cx: b.minX + b.width / 2,
    cy: b.minY + b.height / 2,
    s: GARMENT_HEIGHT / b.height,
  };
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

export function buildGarmentGeometry(kind: GarmentKind, quality: Quality) {
  const f = frameFor(kind);
  const shape = new THREE.Shape();
  const X = (x: number) => (x - f.cx) * f.s;
  const Y = (y: number) => -(y - f.cy) * f.s;

  for (const c of roundedPath(garments[kind].front.outline, true)) {
    if (c.type === "M") shape.moveTo(X(c.x), Y(c.y));
    else if (c.type === "L") shape.lineTo(X(c.x), Y(c.y));
    else if (c.type === "Q") shape.quadraticCurveTo(X(c.cx), Y(c.cy), X(c.x), Y(c.y));
  }

  const depth = 0.2;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.17,
    bevelSize: 0.085,
    bevelSegments: quality === "high" ? 7 : 3,
    curveSegments: quality === "high" ? 10 : 5,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);

  // ExtrudeGeometry puts both caps in group 0 (back cap first, then front).
  // Split them so front and back can carry different detail maps.
  const [caps, sides] = geometry.groups;
  const half = caps.count / 2;
  geometry.clearGroups();
  geometry.addGroup(caps.start + half, half, 0); // front
  geometry.addGroup(sides.start, sides.count, 1); // bevel + walls
  geometry.addGroup(caps.start, half, 2); // back

  // Smooth the bevel, then force the caps flat — caps have no interior
  // vertices, so averaged normals would streak across the large triangles.
  const smoothed = toCreasedNormals(geometry, Math.PI / 3);
  const normals = smoothed.getAttribute("normal") as THREE.BufferAttribute;
  for (let i = 0; i < half; i++) {
    normals.setXYZ(caps.start + i, 0, 0, -1);
    normals.setXYZ(caps.start + half + i, 0, 0, 1);
  }
  normals.needsUpdate = true;
  smoothed.computeBoundingSphere();
  return smoothed;
}

/* ------------------------------------------------------------------ */
/* Canvas maps                                                         */
/* ------------------------------------------------------------------ */

function canvasFor(f: Frame, width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((width * f.h) / f.w);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx, k: width / f.w };
}

/** Maps garment coords to canvas pixels; the back cap is seen mirrored. */
function applyTransform(ctx: CanvasRenderingContext2D, f: Frame, k: number, mirror: boolean) {
  if (mirror) ctx.setTransform(-k, 0, 0, k, (2 * f.cx - f.x0) * k, -f.y0 * k);
  else ctx.setTransform(k, 0, 0, k, -f.x0 * k, -f.y0 * k);
}

function toTexture(canvas: HTMLCanvasElement, f: Frame, srgb: boolean) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.repeat.set(1 / (f.w * f.s), 1 / (f.h * f.s));
  tex.offset.set(-(f.x0 - f.cx) / f.w, (f.y0 + f.h - f.cy) / f.h);
  tex.anisotropy = 4;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function strokeDetail(ctx: CanvasRenderingContext2D, d: Detail, style: string, width: number, dash: number[] = []) {
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.stroke(new Path2D(detailPath(d)));
  ctx.setLineDash([]);
}

function drawBump(view: GarmentView, outline: GarmentView, f: Frame, width: number, mirror: boolean, graphic: boolean) {
  const { canvas, ctx, k } = canvasFor(f, width);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyTransform(ctx, f, k, mirror);

  // Soft "pillow" height: blurred silhouette, so edges round off.
  ctx.filter = `blur(${Math.round(width * 0.03)}px)`;
  ctx.fillStyle = "#a6a6a6";
  ctx.fill(new Path2D(outlinePath(outline)));
  ctx.filter = `blur(${Math.max(1, Math.round(width / 700))}px)`;

  for (const d of view.details) {
    const path = new Path2D(detailPath(d));
    switch (d.style) {
      case "seam":
        strokeDetail(ctx, d, "rgba(0,0,0,0.7)", 1.3);
        break;
      case "stitch":
        strokeDetail(ctx, d, "rgba(0,0,0,0.5)", 0.8, [2.2, 1.6]);
        break;
      case "rib":
        strokeDetail(ctx, d, "rgba(0,0,0,0.35)", 0.7);
        break;
      case "panel":
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fill(path);
        strokeDetail(ctx, d, "rgba(0,0,0,0.65)", 1);
        break;
      case "shade":
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fill(path);
        break;
      case "cord":
        strokeDetail(ctx, d, "rgba(255,255,255,0.45)", d.width ?? 1.8);
        break;
      case "zip":
        strokeDetail(ctx, d, "rgba(0,0,0,0.85)", 2.6);
        strokeDetail(ctx, d, "rgba(255,255,255,0.35)", 1.2, [0.6, 0.9]);
        break;
      case "accent":
        strokeDetail(ctx, d, "rgba(255,255,255,0.18)", d.width ?? 2);
        break;
    }
  }

  if (view.emblem && (view.emblem.tonal || graphic)) {
    const e = emblemPaths(view.emblem.cx, view.emblem.cy, view.emblem.scale);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill(new Path2D(e.ring), "evenodd");
    ctx.fill(new Path2D(e.chevron));
  }

  return canvas;
}

/** Emissive map: reflective tape glows; zips glint faintly. */
function drawGlow(view: GarmentView, f: Frame, width: number, mirror: boolean) {
  const lit = view.details.filter((d) => d.style === "accent" || d.style === "zip");
  if (!lit.length) return null;
  const { canvas, ctx, k } = canvasFor(f, width);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyTransform(ctx, f, k, mirror);
  ctx.lineCap = "round";
  for (const d of lit) {
    if (d.style === "accent") {
      ctx.filter = `blur(${Math.round(width / 300)}px)`;
      strokeDetail(ctx, d, "#ffffff", (d.width ?? 2) * 0.9);
    } else {
      ctx.filter = "none";
      strokeDetail(ctx, d, "rgba(255,255,255,0.07)", 0.8);
    }
  }
  return canvas;
}

/** Color map with the printed emblem, only for garments that carry one. */
function drawPrint(view: GarmentView, f: Frame, width: number, mirror: boolean, fabric: string, ink: string) {
  if (!view.emblem) return null;
  const { canvas, ctx, k } = canvasFor(f, width);
  ctx.fillStyle = fabric;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyTransform(ctx, f, k, mirror);
  const e = emblemPaths(view.emblem.cx, view.emblem.cy, view.emblem.scale);
  ctx.fillStyle = ink;
  ctx.fill(new Path2D(e.ring), "evenodd");
  ctx.fill(new Path2D(e.chevron));
  return canvas;
}

export type GarmentMaps = {
  front: { bump: THREE.Texture; glow: THREE.Texture | null };
  back: { bump: THREE.Texture; glow: THREE.Texture | null };
  dispose: () => void;
};

export function buildGarmentMaps(kind: GarmentKind, quality: Quality, graphic: boolean): GarmentMaps {
  const spec = garments[kind];
  const f = frameFor(kind);
  const size = quality === "high" ? 1024 : 512;
  const tex = (c: HTMLCanvasElement | null) => (c ? toTexture(c, f, false) : null);

  const maps = {
    front: { bump: toTexture(drawBump(spec.front, spec.front, f, size, false, graphic), f, false), glow: tex(drawGlow(spec.front, f, size / 2, false)) },
    back: { bump: toTexture(drawBump(spec.back, spec.front, f, size, true, graphic), f, false), glow: tex(drawGlow(spec.back, f, size / 2, true)) },
  };
  return {
    ...maps,
    dispose: () => [maps.front.bump, maps.front.glow, maps.back.bump, maps.back.glow].forEach((t) => t?.dispose()),
  };
}

/** Front/back color maps carrying the emblem (null when the side has none). */
export function buildPrintMaps(kind: GarmentKind, quality: Quality, graphic: boolean, fabric: string, ink: string, tonal: string) {
  const spec = garments[kind];
  const f = frameFor(kind);
  const size = quality === "high" ? 1024 : 512;
  const side = (view: GarmentView, mirror: boolean) => {
    if (!view.emblem || !(view.emblem.tonal || graphic)) return null;
    const canvas = drawPrint(view, f, size, mirror, fabric, view.emblem.tonal ? tonal : ink);
    return canvas ? toTexture(canvas, f, true) : null;
  };
  return { front: side(spec.front, false), back: side(spec.back, true) };
}
