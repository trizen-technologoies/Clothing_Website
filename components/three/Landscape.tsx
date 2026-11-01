"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

import { palette } from "@/lib/palette";
import type { Quality } from "./heroState";
import { SUMMIT_Y, type TerrainData, type TerrainKind } from "./terrain";

/*
 * The hero's night landscape: rocky peaks under a dark teal sky, mist
 * drifting between the ridges, and a summit under the garment where its
 * light pools on the rock. Terrain is generated in a worker (terrain.ts) and
 * emerges from the mist when it arrives; sky and mist are shaded on the GPU.
 */

/** Tileable rock grain for bump mapping (periodic value noise). */
function grainTexture(size = 256) {
  const data = new Uint8Array(size * size * 4);
  const lattice = (cells: number, seed: number) => {
    const values = Array.from({ length: cells * cells }, (_, i) => {
      const v = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
      return v - Math.floor(v);
    });
    return (u: number, v: number) => {
      const x = u * cells;
      const y = v * cells;
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const fx = x - x0;
      const fy = y - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const at = (a: number, b: number) => values[(((b % cells) + cells) % cells) * cells + (((a % cells) + cells) % cells)];
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      return top + (bottom - top) * sy;
    };
  };
  const octaves = [4, 8, 16, 32, 64].map((cells, i) => [lattice(cells, i + 1), 0.5 ** i] as const);
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      let v = 0;
      for (const [n, amp] of octaves) v += n(i / size, j / size) * amp;
      const c = Math.round((v / 1.9375) * 255);
      data.set([c, c, c, 255], (j * size + i) * 4);
    }
  }
  const t = new THREE.DataTexture(data, size, size);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

function terrainGeometry({ position, normal, uv, color, index }: TerrainData) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(position, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setAttribute("color", new THREE.BufferAttribute(color, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  g.computeBoundingSphere();
  return g;
}

type RockUniforms = {
  uPool: { value: THREE.Vector3 };
  uPoolLevel: { value: number };
  uPoolColor: { value: THREE.Color };
  /** 0 → 1 as the terrain emerges from the mist. */
  uReveal: { value: number };
};

/** Dark wet rock. */
function rockMaterial(grain: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({
    color: "#1f2e34",
    vertexColors: true,
    roughness: 0.5,
    metalness: 0.2,
    bumpMap: grain,
    bumpScale: 1.6,
  });
  m.customProgramCacheKey = () => "rock-pool";
  return m;
}

/**
 * Paints the garment's light pool onto the rock as emission, so it follows
 * the relief, and fades the rock in from the fog colour.
 */
function paintPool(shader: THREE.WebGLProgramParametersWithUniforms, uniforms: RockUniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
    .replace("#include <project_vertex>", "#include <project_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;\nuniform vec3 uPool;\nuniform float uPoolLevel;\nuniform vec3 uPoolColor;\nuniform float uReveal;")
    .replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `#include <emissivemap_fragment>
      {
        // A bright ring with a soft fill on the up-facing rock around the
        // garment's foot, and a faint spill beyond.
        vec3 wn = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        float up = smoothstep(0.5, 0.95, abs(wn.y));
        float pd = length(vWorld.xz - uPool.xz);
        float level = 1.0 - smoothstep(0.12, 0.6, abs(vWorld.y - uPool.y));
        float ring = exp(-pow((pd - 0.8) / 0.09, 2.0));
        float fill = exp(-pd * pd / 0.35);
        float spill = exp(-pd / 1.2);
        totalEmissiveRadiance += uPoolColor * uPoolLevel * ((ring * 1.3 + fill * 1.1) * up * level + spill * 0.08);
      }`,
    )
    .replace(
      "#include <fog_fragment>",
      /* glsl */ `#include <fog_fragment>
      #ifdef USE_FOG
        gl_FragColor.rgb = mix(fogColor, gl_FragColor.rgb, uReveal);
      #endif`,
    );
}

/* ------------------------------------------------------------------ */
/* Sky and mist                                                        */
/* ------------------------------------------------------------------ */

const NOISE_GLSL = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float s = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      s += a * vnoise(p);
      p = p * 2.03 + 7.1;
      a *= 0.5;
    }
    return s;
  }
`;

const worldVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${NOISE_GLSL}
  void main() {
    // Dark overhead, a misty glow low behind the peaks.
    float h = smoothstep(-6.0, 22.0, vWorld.y);
    vec3 c = mix(uHorizon, uTop, pow(h, 0.7));
    float cloud = fbm(vWorld.xy * vec2(0.035, 0.08) + vec2(uTime * 0.004, 0.0));
    c *= 0.8 + 0.5 * cloud;
    gl_FragColor = vec4(c, 1.0);
  }
`;

const mistFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDensity;
  uniform float uScale;
  uniform float uSeed;
  uniform float uLevel;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${NOISE_GLSL}
  void main() {
    vec2 p = vWorld.xy * uScale + vec2(uTime * uSpeed + uSeed, uSeed * 0.37);
    float n = fbm(p + 0.6 * vec2(fbm(p * 0.7 + uTime * 0.02), 0.0));
    float body = smoothstep(0.38, 0.85, n);
    float fade = smoothstep(0.0, 0.3, vUv.y) * (1.0 - smoothstep(0.35, 1.0, vUv.y)) * smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
    gl_FragColor = vec4(uColor, body * fade * uDensity * uLevel);
  }
`;

const MIST: { position: [number, number, number]; size: [number, number]; density: number; scale: number; speed: number }[] = [
  { position: [3, -0.8, -18], size: [80, 12], density: 0.6, scale: 0.12, speed: 0.025 },
  { position: [-1, -1.8, -9.5], size: [56, 8], density: 0.65, scale: 0.18, speed: 0.035 },
  { position: [0.5, -2.6, -3.6], size: [34, 5], density: 0.7, scale: 0.32, speed: 0.05 },
  { position: [-5, 0, -6], size: [15, 7], density: 0.45, scale: 0.26, speed: 0.04 },
  { position: [-4, -1.6, 2.6], size: [10, 4], density: 0.4, scale: 0.42, speed: 0.06 },
];

function Mist({ level, frozen, layers }: { level: RefObject<{ intro: number }>; frozen?: boolean; layers: number }) {
  const first = useRef<THREE.ShaderMaterial>(null);
  // Time, level and colour are shared by every layer, so advancing one advances all.
  const uniforms = useMemo(() => {
    const shared = { uColor: { value: new THREE.Color("#6d98a2") }, uTime: { value: 0 }, uLevel: { value: 0 } };
    return MIST.map((layer, i) => ({
      ...shared,
      uSpeed: { value: layer.speed },
      uDensity: { value: layer.density },
      uScale: { value: layer.scale },
      uSeed: { value: i * 13.7 },
    }));
  }, []);
  useFrame((_, delta) => {
    const u = first.current?.uniforms;
    if (!u) return;
    if (!frozen) u.uTime.value += delta;
    u.uLevel.value = level.current?.intro ?? 1;
  });
  return (
    <group>
      {MIST.slice(0, layers).map((layer, i) => (
        <mesh key={i} position={layer.position} renderOrder={1}>
          <planeGeometry args={layer.size} />
          <shaderMaterial
            ref={i === 0 ? first : undefined}
            vertexShader={worldVertex}
            fragmentShader={mistFragment}
            uniforms={uniforms[i]}
            transparent
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Sky({ frozen }: { frozen?: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTop: { value: new THREE.Color("#020608") }, uHorizon: { value: new THREE.Color("#163139") }, uTime: { value: 0 } }),
    [],
  );
  useFrame((_, delta) => {
    if (material.current && !frozen) material.current.uniforms.uTime.value += delta;
  });
  return (
    <mesh position={[0, 14, -72]} renderOrder={-10}>
      <planeGeometry args={[300, 110]} />
      <shaderMaterial ref={material} vertexShader={worldVertex} fragmentShader={skyFragment} uniforms={uniforms} depthWrite={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */

type Terrain = Record<TerrainKind, THREE.BufferGeometry>;

/** Builds both terrain meshes in a worker; null until they arrive. */
function useTerrain(high: boolean) {
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  useEffect(() => {
    const worker = new Worker(new URL("./terrain.worker.ts", import.meta.url));
    const built: Partial<Terrain> = {};
    worker.onmessage = (event: MessageEvent<{ kind: TerrainKind; data: TerrainData }>) => {
      built[event.data.kind] = terrainGeometry(event.data.data);
      if (built.near && built.far) {
        worker.terminate();
        setTerrain({ near: built.near, far: built.far });
      }
    };
    worker.postMessage({ kind: "near", step: high ? 0.06 : 0.1 });
    worker.postMessage({ kind: "far", step: high ? 0.45 : 0.7 });
    return () => {
      worker.terminate();
      built.near?.dispose();
      built.far?.dispose();
    };
  }, [high]);
  return terrain;
}

export type LandscapeLevels = { intro: number; x: number; z: number; beam: number };

export function Landscape({ quality, level, frozen }: { quality: Quality; level: RefObject<LandscapeLevels>; frozen?: boolean }) {
  // Picked once: a quality drop mid-scroll shouldn't rebuild the terrain.
  const [high] = useState(() => quality === "high");
  const terrain = useTerrain(high);
  // Uniforms live in a ref: updated every frame, bound when the rock shader compiles.
  const uniforms = useRef<RockUniforms>({
    uPool: { value: new THREE.Vector3(0, SUMMIT_Y, 0) },
    uPoolLevel: { value: 0 },
    uPoolColor: { value: new THREE.Color(palette.cyan) },
    uReveal: { value: 0 },
  });
  const grain = useMemo(() => grainTexture(), []);
  const material = useMemo(() => {
    const m = rockMaterial(grain);
    m.onBeforeCompile = (shader) => paintPool(shader, uniforms.current);
    return m;
  }, [grain]);
  const poolLight = useRef<THREE.PointLight>(null);
  const moon = useRef<THREE.DirectionalLight>(null);

  useEffect(() => () => [grain, material].forEach((o) => o.dispose()), [grain, material]);
  useEffect(() => {
    // Light from behind the peaks catches the crests.
    moon.current?.target.position.set(0, -3, 0);
    moon.current?.target.updateMatrixWorld();
  }, []);

  useFrame((state, delta) => {
    const l = level.current;
    if (!l) return;
    const u = uniforms.current;
    if (terrain && u.uReveal.value < 1) {
      u.uReveal.value = frozen ? 1 : Math.min(1, u.uReveal.value + delta / 1.2);
      state.invalidate();
    }
    const glow = l.beam * l.intro;
    u.uPool.value.set(l.x, SUMMIT_Y, l.z);
    u.uPoolLevel.value = 1.6 * glow;
    if (poolLight.current) {
      poolLight.current.position.set(l.x, SUMMIT_Y + 0.6, l.z);
      poolLight.current.intensity = 9 * glow;
    }
  });

  const dbg = typeof location === "undefined" ? "" : location.search; // DEBUG-LS
  return (
    <group>
      {!dbg.includes("nosky") && <Sky frozen={frozen} />}
      {/* Low and from behind, so it rims the crests instead of flooding flat tops. */}
      <directionalLight ref={moon} position={[-6, 4, -22]} intensity={2.8} color="#bfe8ef" />
      <hemisphereLight args={["#1f3c45", "#020405", 0.22]} />
      <pointLight ref={poolLight} color={palette.cyan} distance={5} decay={2} />
      {terrain && !dbg.includes("noterrain") && (
        <>
          <mesh geometry={terrain.far} material={material} />
          <mesh geometry={terrain.near} material={material} />
        </>
      )}
      {!dbg.includes("nomist") && <Mist level={level} frozen={frozen} layers={high ? MIST.length : 3} />}
    </group>
  );
}
