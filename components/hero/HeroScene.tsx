"use client";

import { Html, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { Colonnade, Floaters, Halo, Portal, StageFloor } from "@/components/three/AbstractGeometry";
import { FloatingParticles } from "@/components/three/FloatingParticles";
import { GarmentDisplay } from "@/components/three/GarmentDisplay";
import { clamp01, easeInOutCubic, easeOutCubic, heroState, type Quality } from "@/components/three/heroState";
import { LightBeam } from "@/components/three/LightBeam";
import { SceneLights, type LightLevels } from "@/components/three/SceneLights";
import { StudioEnvironment } from "@/components/three/StudioEnvironment";

/*
 * Hero story rig. Three key poses — hero, statement, featured — are blended
 * by scroll progress (heroState), damped every frame, and layered with an
 * intro timeline, ambient float and pointer parallax.
 */

const POSE_KEYS = ["gx", "gy", "gz", "ry", "sc", "cx", "cy", "cz", "lx", "ly", "lz", "key", "cyan", "violet", "glow", "beam"] as const;
type Pose = Record<(typeof POSE_KEYS)[number], number>;

const TAU = Math.PI * 2;

const DESKTOP: [Pose, Pose, Pose] = [
  { gx: 2.65, gy: 0.05, gz: 0, ry: -0.42, sc: 0.88, cx: 0, cy: 0.55, cz: 10.8, lx: 0.6, ly: 0.32, lz: 0, key: 1, cyan: 1, violet: 0.55, glow: 1.1, beam: 1 },
  { gx: 0, gy: 0.5, gz: -1.6, ry: Math.PI - 0.2, sc: 0.9, cx: 0, cy: 1.6, cz: 13.6, lx: 0, ly: 0.85, lz: -1.6, key: 0.45, cyan: 0.35, violet: 1.6, glow: 1.9, beam: 0.35 },
  { gx: -2.45, gy: 0.12, gz: 0.4, ry: TAU + 0.5, sc: 0.98, cx: -0.5, cy: 0.42, cz: 10, lx: -1.15, ly: 0.32, lz: 0, key: 1.1, cyan: 1.25, violet: 0.6, glow: 1.2, beam: 1 },
];

const PORTRAIT: [Pose, Pose, Pose] = [
  { gx: 0, gy: 1.05, gz: 0, ry: -0.34, sc: 0.8, cx: 0, cy: 0.35, cz: 12.6, lx: 0, ly: -0.35, lz: 0, key: 1, cyan: 1, violet: 0.6, glow: 1.1, beam: 1 },
  { gx: 0, gy: 1.1, gz: -1.4, ry: Math.PI - 0.2, sc: 0.76, cx: 0, cy: 1.2, cz: 14.2, lx: 0, ly: 0.35, lz: -1.4, key: 0.45, cyan: 0.35, violet: 1.6, glow: 1.9, beam: 0.35 },
  { gx: 0, gy: 1.15, gz: 0.2, ry: TAU + 0.45, sc: 0.84, cx: 0, cy: 0.4, cz: 12.2, lx: 0, ly: -0.25, lz: 0, key: 1.1, cyan: 1.25, violet: 0.6, glow: 1.2, beam: 1 },
];

function blend(a: Pose, b: Pose, t: number, out: Pose) {
  for (const k of POSE_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

// Anchored on the garment's left half so labels extend away from the copy column.
const CALLOUTS: { label: string; position: [number, number, number] }[] = [
  { label: "Stand collar", position: [-0.42, 1.42, 0.3] },
  { label: "Bellowed chest pocket", position: [-0.62, 0.62, 0.3] },
  { label: "Storm-flap zip", position: [0.0, -0.45, 0.3] },
];

type Levels = LightLevels & { intro: number; portal: number; beam: number };

function Story({ quality, reducedMotion }: { quality: Quality; reducedMotion: boolean }) {
  const size = useThree((s) => s.size);
  const portrait = size.width / size.height < 0.85;
  const keys = portrait ? PORTRAIT : DESKTOP;

  const garment = useRef<THREE.Group>(null);
  const stage = useRef<THREE.Group>(null);
  const beamGroup = useRef<THREE.Group>(null);
  const calloutGroup = useRef<THREE.Group>(null);
  const current = useRef<Pose>({ ...keys[0] });
  const scratch = useRef<{ a: Pose; b: Pose }>({ a: { ...keys[0] }, b: { ...keys[0] } });
  const pointer = useRef({ x: 0, y: 0 });
  const clock = useRef(0);
  const levels = useRef<Levels>({ key: 0, cyan: 0, violet: 0, x: keys[0].gx, z: 0, intro: 0, portal: 0, beam: 0 });
  const particleOpacity = useRef(0);
  const beamLevel = useRef(0);
  const garmentMesh = useRef<THREE.Mesh>(null);
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

    const g = garment.current;
    if (g) {
      g.position.set(c.gx, c.gy + float - (1 - intro) * 0.9, c.gz);
      g.rotation.set(-p.y * 0.04, c.ry + sway + p.x * 0.16 - (1 - intro) * 0.5, 0);
      g.scale.setScalar(c.sc * (0.9 + 0.1 * intro));
    }
    stage.current?.position.set(c.gx, 0, c.gz);
    beamGroup.current?.position.set(c.gx, 0, c.gz);
    if (calloutGroup.current && g) {
      calloutGroup.current.position.copy(g.position);
      calloutGroup.current.rotation.copy(g.rotation);
      calloutGroup.current.scale.copy(g.scale);
    }

    state.camera.position.set(c.cx + p.x * 0.35, c.cy - p.y * 0.18, c.cz + (1 - introCam) * 2.8);
    state.camera.lookAt(c.lx, c.ly, c.lz);

    const l = levels.current;
    l.intro = intro;
    l.key = c.key * intro;
    l.cyan = c.cyan * intro;
    l.violet = c.violet * intro;
    l.portal = (0.55 + 0.45 * c.cyan) * intro;
    l.beam = c.beam;
    l.x = c.gx;
    l.z = c.gz;
    beamLevel.current = c.beam * intro;

    const materials = garmentMesh.current?.material;
    if (Array.isArray(materials)) {
      (materials[0] as THREE.MeshPhysicalMaterial).emissiveIntensity = c.glow * intro;
      (materials[2] as THREE.MeshPhysicalMaterial).emissiveIntensity = c.glow * intro;
    }

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

      <FloatingParticles count={quality === "high" ? 1400 : 450} opacity={particleOpacity} frozen={reducedMotion} />
      <Colonnade rows={quality === "high" ? 8 : 5} level={levels} />
      <StageFloor quality={quality} level={levels} />

      <group ref={stage}>
        <group position={[0, 0, -2.3]}>
          <Portal level={levels} width={3.7} height={5} />
        </group>
        <group position={[0, 0.25, -0.2]}>
          <Halo level={levels} frozen={reducedMotion} />
        </group>
      </group>

      <group ref={beamGroup}>
        <LightBeam position={[0, 2.4, 0]} level={beamLevel} />
      </group>

      <Floaters count={quality === "high" ? 7 : 4} frozen={reducedMotion} />

      <group ref={garment}>
        <GarmentDisplay kind="jacket" color="#15171d" quality={quality} glow={0} meshRef={garmentMesh} />
      </group>

      {calloutsOn && (
        <group ref={calloutGroup}>
          {CALLOUTS.map((c) => (
            <Html key={c.label} position={c.position} zIndexRange={[5, 0]} className="pointer-events-none">
              <div aria-hidden className="flex -translate-x-full -translate-y-1/2 flex-row-reverse items-center gap-2 whitespace-nowrap">
                <span className="size-1.5 rounded-full bg-cyan shadow-[0_0_12px_2px_rgba(0,229,255,0.6)]" />
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
      camera={{ fov: 32, near: 0.1, far: 60, position: [0, 0.6, 13] }}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      onCreated={() => onReady?.()}
      aria-hidden
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 11, 31]} />
      {monitoring && !reducedMotion && (
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
      {high && (
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
