"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying float vY;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    vY = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vY;
  varying vec3 vNormalV;
  varying vec3 vViewDir;
  void main() {
    float facing = abs(dot(vNormalV, vViewDir));
    float a = pow(facing, 2.2) * pow(vY, 1.4) * smoothstep(0.0, 0.18, vY);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

/** Soft volumetric-looking cone of light (additive, no real volume). */
export function LightBeam({
  height = 7.5,
  radius = 1.7,
  color = "#cdf1f6",
  level,
  ...props
}: {
  height?: number;
  radius?: number;
  color?: string;
  /** Mutable intensity multiplier. */
  level: { current: number };
  position?: [number, number, number];
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0 } }),
    [color],
  );

  useFrame(() => {
    if (material.current) material.current.uniforms.uOpacity.value = 0.16 * level.current;
  });

  return (
    <mesh {...props} renderOrder={2}>
      <coneGeometry args={[radius, height, 48, 1, true]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
