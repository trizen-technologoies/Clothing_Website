"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ComponentRef } from "react";
import * as THREE from "three";

import { palette } from "@/lib/palette";

/*
 * The neon around the hero garment: a large ring standing behind it and a
 * tilted orbit through it. Both carry their own soft glow, so they read as
 * lit tubes without bloom too.
 */

const CYAN = new THREE.Color(palette.cyan);

/**
 * A glowing line with a fixed on-screen width. Thin 3D geometry shrinks below
 * one pixel at a distance and breaks into dashes; screen-space lines don't.
 * Additive, so a dim line brightens what's behind it instead of covering it.
 */
function GlowLine({ points, width, level }: { points: THREE.Vector3[]; width: number; level: () => number }) {
  const line = useRef<ComponentRef<typeof Line>>(null);
  useFrame(() => {
    const material = line.current?.material as { color?: THREE.Color } | undefined;
    material?.color?.copy(CYAN).multiplyScalar(level());
  });
  return (
    <Line
      ref={line}
      points={points}
      lineWidth={width}
      color="black"
      toneMapped={false}
      transparent
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  );
}

/** Points on a circle in the XY plane (rotate the parent for other planes). */
function circlePoints(radius: number, count: number) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  });
}

const ringVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ringFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uRadius;
  uniform float uLevel;
  varying vec2 vPos;
  void main() {
    float d = abs(length(vPos) - uRadius);
    float core = exp(-pow(d / 0.018, 2.0));
    float halo = (exp(-d / 0.055) * 0.4 + exp(-d / 0.2) * 0.05) * (1.0 - smoothstep(0.3, 0.45, d));
    // Brightest over the top, gone by the bottom, as if lit from above.
    float fade = smoothstep(-0.5, 0.45, vPos.y / uRadius);
    gl_FragColor = vec4(uColor * (core * 2.4 + halo) * fade * uLevel, 1.0);
  }
`;

/** Large ring standing behind the garment. */
export function BackRing({ radius = 1.65, level }: { radius?: number; level: () => number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uColor: { value: CYAN.clone() }, uRadius: { value: radius }, uLevel: { value: 0 } }), [radius]);
  useFrame(() => {
    if (material.current) material.current.uniforms.uLevel.value = level();
  });
  return (
    <mesh>
      <ringGeometry args={[radius - 0.45, radius + 0.45, 256, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={ringVertex}
        fragmentShader={ringFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Neon orbit through the garment, tilted up to the right. */
export function Orbit({ radius = 1.75, level }: { radius?: number; level: () => number }) {
  const points = useMemo(() => circlePoints(radius, 240), [radius]);
  return (
    <group rotation-z={0.27}>
      <group rotation-x={1.39}>
        <GlowLine points={points} width={2.6} level={() => 2.2 * level()} />
        <GlowLine points={points} width={12} level={() => 0.22 * level()} />
      </group>
    </group>
  );
}
