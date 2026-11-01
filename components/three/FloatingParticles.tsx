"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uMin;
  uniform vec3 uRange;
  attribute float aSeed;
  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 p = position;
    float speed = 0.05 + aSeed * 0.1;
    float h = mod(p.y - uMin.y + uTime * speed, uRange.y);
    p.y = uMin.y + h;
    p.x += sin(uTime * 0.21 + aSeed * 6.2831) * 0.22;
    p.z += cos(uTime * 0.17 + aSeed * 12.0) * 0.18;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float scale = 0.45 + fract(aSeed * 91.7) * 0.9;
    gl_PointSize = uSize * scale * uPixelRatio * (10.0 / -mv.z);

    float yn = h / uRange.y;
    float edge = smoothstep(0.0, 0.1, yn) * (1.0 - smoothstep(0.82, 1.0, yn));
    float depth = smoothstep(32.0, 7.0, -mv.z);
    vAlpha = edge * depth * (0.3 + 0.7 * fract(aSeed * 13.7));
    vTint = step(0.88, fract(aSeed * 7.31));
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTint;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(vec3(0.80, 0.90, 0.92), vec3(0.1, 0.84, 0.93), vTint);
    gl_FragColor = vec4(col, a * vAlpha * uOpacity);
  }
`;

type Props = {
  count: number;
  min?: [number, number, number];
  range?: [number, number, number];
  size?: number;
  /** Mutable 0–1 opacity (e.g. driven by an intro timeline). */
  opacity?: { current: number };
  frozen?: boolean;
};

/** Dust motes drifting upward — positions animate entirely on the GPU. */
export function FloatingParticles({ count, min = [-9, -2, -16], range = [18, 8, 21], size = 1.6, opacity, frozen }: Props) {
  const gl = useThree((s) => s.gl);
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    // Deterministic pseudo-random layout keeps the scene identical across loads.
    let s = 1337;
    const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < count; i++) {
      positions[i * 3] = min[0] + rand() * range[0];
      positions[i * 3 + 1] = min[1] + rand() * range[1];
      positions[i * 3 + 2] = min[2] + rand() * range[2];
      seeds[i] = rand();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: size },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uMin: { value: new THREE.Vector3(...min) },
      uRange: { value: new THREE.Vector3(...range) },
      uOpacity: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    if (!frozen) m.uniforms.uTime.value += delta;
    m.uniforms.uOpacity.value = opacity?.current ?? 1;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
