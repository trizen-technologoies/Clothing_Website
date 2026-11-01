"use client";

import { Html, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { FloatingParticles } from "@/components/three/FloatingParticles";
import { BackRing, Orbit } from "@/components/three/GlowRings";
import { clamp01, easeInOutCubic, easeOutCubic, heroState, type Quality } from "@/components/three/heroState";
import { Landscape } from "@/components/three/Landscape";
import { LightBeam } from "@/components/three/LightBeam";
import { SceneLights, type LightLevels } from "@/components/three/SceneLights";
import { StudioEnvironment } from "@/components/three/StudioEnvironment";
import { TurntableGarment, type TurntableLevels } from "@/components/three/TurntableGarment";
import { palette } from "@/lib/palette";

/*
 * Hero story rig. Three key poses — hero, statement, featured — are blended
 * by scroll progress (heroState), damped every frame, and layered with an
 * intro timeline, ambient float and pointer parallax.
 */

const POSE_KEYS = ["gx", "gy", "gz", "ry", "sc", "cx", "cy", "cz", "lx", "ly", "lz", "key", "cyan", "teal", "glow", "beam"] as const;
type Pose = Record<(typeof POSE_KEYS)[number], number>;

const TAU = Math.PI * 2;

const DESKTOP: [Pose, Pose, Pose] = [
  { gx: 1.14, gy: 0.3, gz: 0, ry: -0.32, sc: 1.13, cx: 0, cy: 0.45, cz: 8.2, lx: 0, ly: 0.25, lz: 0, key: 1, cyan: 1, teal: 0.55, glow: 1.1, beam: 1 },
  { gx: 0, gy: 0.5, gz: -1.6, ry: Math.PI - 0.2, sc: 0.9, cx: 0, cy: 1.6, cz: 13.6, lx: 0, ly: 0.85, lz: -1.6, key: 0.45, cyan: 0.35, teal: 1.6, glow: 1.9, beam: 0.35 },
  // Camera raised to look over the foreground crag.
  { gx: -2.45, gy: 0.2, gz: -1.4, ry: TAU + 0.5, sc: 1.1, cx: -0.5, cy: 1.2, cz: 9.5, lx: -1.2, ly: 0.2, lz: -1.4, key: 1.1, cyan: 1.25, teal: 0.6, glow: 1.2, beam: 1 },
];

const PORTRAIT: [Pose, Pose, Pose] = [
  { gx: 0, gy: 1.05, gz: 0, ry: -0.34, sc: 0.8, cx: 0, cy: 0.35, cz: 12.6, lx: 0, ly: -0.35, lz: 0, key: 1, cyan: 1, teal: 0.6, glow: 1.1, beam: 1 },
  { gx: 0, gy: 1.1, gz: -1.4, ry: Math.PI - 0.2, sc: 0.76, cx: 0, cy: 1.2, cz: 14.2, lx: 0, ly: 0.35, lz: -1.4, key: 0.45, cyan: 0.35, teal: 1.6, glow: 1.9, beam: 0.35 },
  { gx: 0, gy: 1.15, gz: 0.2, ry: TAU + 0.45, sc: 0.84, cx: 0, cy: 0.4, cz: 12.2, lx: 0, ly: -0.25, lz: 0, key: 1.1, cyan: 1.25, teal: 0.6, glow: 1.2, beam: 1 },
];

function blend(a: Pose, b: Pose, t: number, out: Pose) {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

// Anchored on the garment's left half so labels extend away from the copy
// column; placed on the turntable frame shown at the featured pose (~18°).
const CALLOUTS: { label: string; position: [number, number, number] }[] = [
  { label: "Adjustable storm hood", position: [-0.24, 1.04, 0.05] },
  { label: "Buckled chest pocket", position: [-0.25, 0.34, 0.05] },
  { label: "Reflective piping", position: [-0.96, -0.29, 0.05] },
];

type Levels = LightLevels & TurntableLevels & { ring: number; beam: number };

function Story({ quality, reducedMotion }: { quality: Quality; reducedMotion: boolean }) {
  const size = useThree((s) => s.size);
  const portrait = size.width / size.height < 0.85;
  const keys = portrait ? PORTRAIT : DESKTOP;

  const garment = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  const beamGroup = useRef<THREE.Group>(null);
  const calloutGroup = useRef<THREE.Group>(null);
  const current = useRef<Pose>({ ...keys[0] });
  const scratch = useRef<{ a: Pose; b: Pose }>({ a: { ...keys[0] }, b: { ...keys[0] } });
  const pointer = useRef({ x: 0, y: 0 });
  const clock = useRef(0);
  const levels = useRef<Levels>({ key: 0, cyan: 0, teal: 0, x: keys[0].gx, z: 0, intro: 0, ring: 0, beam: 0, turn: 0, glow: 0 });
  const particleOpacity = useRef(0);
  const beamLevel = useRef(0);
  const settleFrames = useRef(0);
  const [calloutsOn, setCalloutsOn] = useState(false);

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const fov = portrait ? 42 : 32;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    const dt = Math.min(delta, 1 / 20);
    clock.current += dt;
    const t = clock.current;

    // Intro: particles first, then the garment rises in with the lights.
    const intro = reducedMotion ? 1 : easeOutCubic(clamp01((t - 0.5) / 2.4));
    const introCam = reducedMotion ? 1 : easeOutCubic(clamp01(t / 3.4));
    particleOpacity.current = reducedMotion ? 1 : clamp01(t / 1.4);

    // Scroll story target.
    const s = reducedMotion ? 0 : easeInOutCubic(clamp01(heroState.statement));
    const f = reducedMotion ? 0 : easeInOutCubic(clamp01(heroState.featured));
    const { a, b } = scratch.current;
    blend(keys[0], keys[1], s, a);
    blend(a, keys[2], f, b);

    const c = current.current;
    const k = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.4);
    for (const key of POSE_KEYS) c[key] += (b[key] - c[key]) * k;

    const p = pointer.current;
    const pk = 1 - Math.exp(-dt * 2.5);
    p.x += (heroState.pointerX - p.x) * pk;
    p.y += (heroState.pointerY - p.y) * pk;

    const float = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.06;
    const sway = reducedMotion ? 0 : Math.sin(t * 0.31) * 0.07;
    const camX = c.cx + p.x * 0.35;
    const camZ = c.cz + (1 - introCam) * 2.8;

    // The garment is filmed, so its card faces the camera and the turn picks
    // the frame: the angle it would show the camera if it were solid.
    const facing = Math.atan2(camX - c.gx, camZ - c.gz);
    const g = garment.current;
    if (g) {
      g.position.set(c.gx, c.gy + float - (1 - intro) * 0.9, c.gz);
      g.rotation.set(-p.y * 0.04, facing, 0);
      g.scale.setScalar(c.sc * (0.9 + 0.1 * intro));
    }
    rings.current?.position.set(c.gx, c.gy, c.gz);
    rings.current?.scale.setScalar(c.sc);
    beamGroup.current?.position.set(c.gx, 0, c.gz);
    if (calloutGroup.current && g) {
      calloutGroup.current.position.copy(g.position);
      calloutGroup.current.rotation.copy(g.rotation);
      calloutGroup.current.scale.copy(g.scale);
    }

    state.camera.position.set(camX, c.cy - p.y * 0.18, camZ);
    state.camera.lookAt(c.lx, c.ly, c.lz);

    const l = levels.current;
    l.turn = c.ry + sway + p.x * 0.16 - (1 - intro) * 0.5 - facing;
    l.glow = c.glow * intro;
    l.intro = intro;
    l.key = c.key * intro;
    l.cyan = c.cyan * intro;
    l.teal = c.teal * intro;
    l.ring = (0.55 + 0.45 * c.cyan) * intro;
    l.beam = c.beam;
    l.x = c.gx;
    l.z = c.gz;
    beamLevel.current = c.beam * intro;

    // On-demand rendering (reduced motion) draws once; render a few frames so
    // every light and material has picked up its level.
    if (reducedMotion && settleFrames.current < 6) {
      settleFrames.current++;
      state.invalidate();
    }

    const showCallouts = !portrait && !reducedMotion && heroState.featured > 0.75;
    if (showCallouts !== calloutsOn) setCalloutsOn(showCallouts);
  });

  return (
    <>
      <SceneLights levels={levels} />

      <FloatingParticles count={quality === "high" ? 900 : 350} opacity={particleOpacity} frozen={reducedMotion} />
      <Landscape quality={quality} level={levels} frozen={reducedMotion} />

      <group ref={rings}>
        <group position={[0.05, 0.38, -0.55]}>
          <BackRing level={() => levels.current.ring} />
        </group>
        <group position={[0, -0.17, 0]}>
          <Orbit level={() => levels.current.ring} />
        </group>
      </group>

      <group ref={beamGroup}>
        <LightBeam position={[0, 2.4, 0]} level={beamLevel} />
      </group>

      <group ref={garment}>
        <TurntableGarment quality={quality} level={levels} />
      </group>

      {calloutsOn && (
        <group ref={calloutGroup}>
          {CALLOUTS.map((c) => (
            <Html key={c.label} position={c.position} zIndexRange={[5, 0]} className="pointer-events-none">
              <div aria-hidden className="flex -translate-x-full -translate-y-1/2 flex-row-reverse items-center gap-2 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_12px_2px_rgba(26,213,236,0.6)]" />
                <span className="h-px w-10 bg-cyan/50" />
                <span className="eyebrow text-[0.625rem] text-fg/80">{c.label}</span>
              </div>
            </Html>
          ))}
        </group>
      )}
    </>
  );
}

type HeroSceneProps = {
  quality: Quality;
  reducedMotion: boolean;
  active: boolean;
  onReady?: () => void;
};

// Seconds to wait before judging performance: shader compilation and page
// hydration cause a few slow frames that say nothing about steady-state speed.
const MONITOR_DELAY_MS = 4000;

export default function HeroScene({ quality, reducedMotion, active, onReady }: HeroSceneProps) {
  const [q, setQ] = useState<Quality>(quality);
  const high = q === "high";
  const [maxDpr] = useState(() => Math.max(1, Math.min(window.devicePixelRatio || 1, 1.75)));
  // 0–1 share of the extra resolution above 1×, lowered first when frames drop.
  const [dprShare, setDprShare] = useState(1);
  const [monitoring, setMonitoring] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMonitoring(true), MONITOR_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const dpr = 1 + (Math.min(maxDpr, high ? 1.75 : 1.3) - 1) * dprShare;

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: !high, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 32, near: 0.1, far: 140, position: [0, 0.6, 13] }}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      onCreated={() => onReady?.()}
      aria-hidden
    >
      <color attach="background" args={[palette.ink]} />
      {/* Rock fades into mist with distance; the sky behind is lighter still. */}
      <fog attach="fog" args={[palette.mist, 9, 46]} />
      {monitoring && !reducedMotion && !location.search.includes("pm=off") /* DEBUG-LS */ && (
        // Step resolution down (and back up) first; drop effects only if it
        // keeps struggling at native resolution or keeps flip-flopping.
        <PerformanceMonitor
          factor={1}
          flipflops={4}
          onChange={({ factor }) => setDprShare(factor)}
          onDecline={({ factor }) => {
            if (factor <= 0.05) setQ("low");
          }}
          onFallback={() => setQ("low")}
        />
      )}
      <StudioEnvironment />
      <Story quality={q} reducedMotion={reducedMotion} />
      {high && !location.search.includes("nopost") /* DEBUG-LS */ && (
        // MSAA + mipmap bloom renders black on some Intel/D3D11 drivers, so
        // anti-aliasing comes from SMAA instead of a multisampled target.
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.9} luminanceSmoothing={0.15} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.22} darkness={0.72} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  );
}
