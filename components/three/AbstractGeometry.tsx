"use client";

import { Float, Line, MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type ComponentRef, type RefObject } from "react";
import * as THREE from "three";

import type { Quality } from "./heroState";

export const FLOOR_Y = -1.95;

const CYAN = new THREE.Color("#00e5ff");
const VIOLET = new THREE.Color("#8b5cf6");

/** Scales a basic material's base color by a live level (for emissive-looking lines). */
function useGlowColor(material: RefObject<THREE.MeshBasicMaterial | null>, base: THREE.Color, boost: number, level: () => number) {
  useFrame(() => {
    material.current?.color.copy(base).multiplyScalar(boost * level());
  });
}

/**
 * A glowing line with a fixed on-screen width. Thin 3D geometry (tubes, rings)
 * shrinks below one pixel at a distance and breaks up into dashes; screen-space
 * lines never do.
 */
function GlowLine({
  points,
  color,
  boost,
  level,
  width = 1.5,
  segments = false,
}: {
  points: THREE.Vector3[];
  color: THREE.Color;
  boost: number;
  level: () => number;
  width?: number;
  segments?: boolean;
}) {
  const line = useRef<ComponentRef<typeof Line>>(null);
  useFrame(() => {
    const material = line.current?.material as { color?: THREE.Color } | undefined;
    material?.color?.copy(color).multiplyScalar(boost * level());
  });
  return <Line ref={line} points={points} segments={segments} lineWidth={width} color="black" toneMapped={false} />;
}

/** Points on a circle in the XY plane (rotate the parent for other planes). */
function circlePoints(radius: number, count = 160) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  });
}

/* ------------------------------------------------------------------ */
/* Colonnade — receding monoliths with light strips                    */
/* ------------------------------------------------------------------ */

const hazeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const hazeFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float a = pow(1.0 - smoothstep(0.0, 0.55, vUv.y), 1.6) * (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 3.0));
    gl_FragColor = vec4(vec3(0.07, 0.11, 0.14), a * uOpacity);
  }
`;

const ACCENT_ROWS = [1, 4];

/** Receding monoliths silhouetted against a low horizon haze; two rows carry light strips. */
export function Colonnade({ rows = 8, level }: { rows?: number; level: RefObject<{ intro: number }> }) {
  const slabs = useRef<THREE.InstancedMesh>(null);
  const hazeMaterial = useRef<THREE.ShaderMaterial>(null);
  const hazeUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  const count = rows * 2;

  // Vertical light strips on the inner faces of the accent rows, as segment pairs.
  const strips = useMemo(
    () =>
      ACCENT_ROWS.filter((r) => r < rows).flatMap((row) =>
        [-1, 1].flatMap((side) => {
          const x = side * (6.6 - 0.36);
          const z = -6 - row * 3.2 + 0.2;
          return [new THREE.Vector3(x, FLOOR_Y, z), new THREE.Vector3(x, FLOOR_Y + 9, z)];
        }),
      ),
    [rows],
  );

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      m.makeTranslation(side * 6.6, FLOOR_Y + 4.5, -6 - row * 3.2);
      slabs.current?.setMatrixAt(i, m);
    }
    if (slabs.current) {
      slabs.current.instanceMatrix.needsUpdate = true;
      slabs.current.computeBoundingSphere();
    }
  }, [count]);

  useFrame(() => {
    if (hazeMaterial.current) hazeMaterial.current.uniforms.uOpacity.value = 0.6 * (level.current?.intro ?? 1);
  });

  return (
    <group>
      <mesh position={[0, FLOOR_Y + 7, -30]}>
        <planeGeometry args={[90, 18]} />
        <shaderMaterial ref={hazeMaterial} vertexShader={hazeVertex} fragmentShader={hazeFragment} uniforms={hazeUniforms} transparent depthWrite={false} fog={false} />
      </mesh>
      <instancedMesh ref={slabs} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.7, 9, 0.7]} />
        <meshStandardMaterial color="#0b0c0f" metalness={0.85} roughness={0.32} />
      </instancedMesh>
      {strips.length > 0 && <GlowLine points={strips} segments color={CYAN} boost={0.75} width={1} level={() => level.current?.intro ?? 1} />}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Portal — arched frame with an inner light line                      */
/* ------------------------------------------------------------------ */

function archOutline(halfWidth: number, height: number, path: THREE.Path, reverse = false) {
  const springY = height - halfWidth;
  if (!reverse) {
    path.lineTo(-halfWidth, springY);
    path.absarc(0, springY, halfWidth, Math.PI, 0, true);
    path.lineTo(halfWidth, 0);
  } else {
    path.lineTo(halfWidth, springY);
    path.absarc(0, springY, halfWidth, 0, Math.PI, false);
    path.lineTo(-halfWidth, 0);
  }
}

export function Portal({ level, width = 4, height = 5.7 }: { level: RefObject<{ portal: number }>; width?: number; height?: number }) {
  const W = width / 2;
  const t = 0.16;

  const frame = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-W, 0);
    archOutline(W, height, s);
    s.lineTo(W - t, 0);
    archOutline(W - t, height - t, s, true);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 48 });
    g.translate(0, 0, -0.07);
    return g;
  }, [W, height]);

  const glowPoints = useMemo(() => {
    const p = new THREE.Path();
    const inner = W - t - 0.015;
    p.moveTo(-inner, 0);
    archOutline(inner, height - t - 0.015, p);
    return p.getPoints(64).map((v) => new THREE.Vector3(v.x, v.y, 0.09));
  }, [W, height]);

  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh geometry={frame}>
        <meshStandardMaterial color="#0e1013" metalness={0.9} roughness={0.28} />
      </mesh>
      <GlowLine points={glowPoints} color={CYAN} boost={1.8} width={2} level={() => level.current?.portal ?? 1} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floor, plinth ring and light pool                                   */
/* ------------------------------------------------------------------ */

const poolVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const poolFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

export function StageFloor({ quality, level }: { quality: Quality; level: RefObject<{ intro: number; x: number; z: number; beam: number }> }) {
  const ring = useRef<THREE.Group>(null);
  const ringPoints = useMemo(() => circlePoints(1.13), []);
  const pool = useRef<THREE.Mesh>(null);
  const poolMaterial = useRef<THREE.ShaderMaterial>(null);
  const poolUniforms = useMemo(() => ({ uColor: { value: new THREE.Color("#a9d6ff") }, uOpacity: { value: 0 } }), []);

  useFrame(() => {
    const l = level.current;
    if (!l) return;
    ring.current?.position.set(l.x, FLOOR_Y + 0.01, l.z);
    pool.current?.position.set(l.x, FLOOR_Y + 0.003, l.z);
    if (poolMaterial.current) poolMaterial.current.uniforms.uOpacity.value = 0.22 * l.beam * l.intro;
  });

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, FLOOR_Y, -10]}>
        <planeGeometry args={[60, 60]} />
        {quality === "high" ? (
          <MeshReflectorMaterial
            blur={[320, 90]}
            resolution={512}
            mixBlur={1}
            mixStrength={2.4}
            roughness={0.92}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#07080a"
            metalness={0.65}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color="#08090b" metalness={0.55} roughness={0.5} />
        )}
      </mesh>
      <group ref={ring} rotation-x={-Math.PI / 2}>
        <GlowLine points={ringPoints} color={CYAN} boost={0.7} width={1.5} level={() => (level.current?.intro ?? 1) * (level.current?.beam ?? 1)} />
      </group>
      <mesh ref={pool} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[5, 5]} />
        <shaderMaterial ref={poolMaterial} vertexShader={poolVertex} fragmentShader={poolFragment} uniforms={poolUniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floating chrome fragments and the orbit halo                        */
/* ------------------------------------------------------------------ */

const FLOATERS: { pos: [number, number, number]; kind: "octa" | "tetra" | "ring" | "rod"; size: number; speed: number }[] = [
  { pos: [4.1, 1.7, -1.3], kind: "octa", size: 0.22, speed: 1.1 },
  { pos: [0.7, 2.3, -0.6], kind: "octa", size: 0.12, speed: 1.6 },
  { pos: [-1.6, -0.9, 1.3], kind: "tetra", size: 0.17, speed: 1.3 },
  { pos: [-3.7, 1.5, -2.4], kind: "ring", size: 0.34, speed: 0.8 },
  { pos: [4.7, -0.7, 0.9], kind: "rod", size: 0.9, speed: 1 },
  { pos: [-4.4, 0.1, -0.8], kind: "octa", size: 0.09, speed: 1.9 },
  { pos: [2.2, -1.2, 2.2], kind: "ring", size: 0.16, speed: 1.4 },
];

export function Floaters({ count = FLOATERS.length, frozen }: { count?: number; frozen?: boolean }) {
  const chrome = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ccd3", metalness: 1, roughness: 0.14, envMapIntensity: 1.3 }), []);
  return (
    <group>
      {FLOATERS.slice(0, count).map((f, i) => (
        <Float key={i} position={f.pos} speed={frozen ? 0 : f.speed} rotationIntensity={0.8} floatIntensity={0.6}>
          <mesh material={chrome} rotation={[i, i * 0.7, 0]}>
            {f.kind === "octa" && <octahedronGeometry args={[f.size, 0]} />}
            {f.kind === "tetra" && <tetrahedronGeometry args={[f.size, 0]} />}
            {f.kind === "ring" && <torusGeometry args={[f.size, 0.012, 8, 64]} />}
            {f.kind === "rod" && <boxGeometry args={[0.018, f.size, 0.018]} />}
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export function Halo({ level, frozen }: { level: RefObject<{ intro: number; violet: number }>; frozen?: boolean }) {
  const spin = useRef<THREE.Group>(null);
  const ringPoints = useMemo(() => circlePoints(1.95, 220), []);
  const dotMaterial = useRef<THREE.MeshBasicMaterial>(null);

  useGlowColor(dotMaterial, CYAN, 3, () => level.current?.intro ?? 1);

  useFrame((_, delta) => {
    if (spin.current && !frozen) spin.current.rotation.z += delta * 0.18;
  });

  return (
    <group rotation={[1.32, 0.18, 0]}>
      <group ref={spin}>
        <GlowLine
          points={ringPoints}
          color={VIOLET}
          boost={1.1}
          width={1.25}
          level={() => (level.current?.intro ?? 1) * (0.5 + 0.5 * (level.current?.violet ?? 1))}
        />
        <mesh position={[1.95, 0, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial ref={dotMaterial} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
