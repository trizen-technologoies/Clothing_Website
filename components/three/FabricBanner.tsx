"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { Quality } from "./heroState";

type Props = {
  quality: Quality;
  frozen?: boolean;
  width?: number;
  height?: number;
  /** Offsets the wave pattern so several strips don't move in sync. */
  phase?: number;
  sheen?: string;
};

/**
 * A hanging strip of black silk. Displacement and normals are computed in the
 * vertex shader (injected into MeshPhysicalMaterial), so it costs no CPU.
 */
export function FabricBanner({ quality, frozen, width = 3.4, height = 9, phase = 0, sheen = "#8f80ff" }: Props) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(width, height, quality === "high" ? 80 : 36, quality === "high" ? 180 : 80),
    [quality, width, height],
  );
  // Uniform lives in a ref: it's advanced every frame and bound when the shader compiles.
  const time = useRef({ value: 4 + phase });

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#101116",
      roughness: 0.2,
      metalness: 0.15,
      sheen: 0.55,
      sheenColor: new THREE.Color(sheen),
      sheenRoughness: 0.3,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      envMapIntensity: 2,
      side: THREE.DoubleSide,
    });
    const half = (height / 2).toFixed(2);
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time.current;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform float uTime;
          float fabricH(vec2 p) {
            // Pinned along the top edge, free to move toward the hem.
            float hang = smoothstep(${half}, -${half}, p.y);
            float w = sin(p.x * 1.6 + uTime * 0.8 + p.y * 0.55) * 0.3
                    + sin(p.x * 3.4 - uTime * 1.1 + p.y * 1.3) * 0.08
                    + sin(p.y * 1.9 + uTime * 0.65 + p.x * 0.4) * 0.22;
            return w * (0.1 + hang * 0.9);
          }`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          /* glsl */ `float fe = 0.015;
          float fh0 = fabricH(position.xy);
          float fhx = fabricH(position.xy + vec2(fe, 0.0));
          float fhy = fabricH(position.xy + vec2(0.0, fe));
          vec3 objectNormal = normalize(vec3(-(fhx - fh0) / fe, -(fhy - fh0) / fe, 1.0));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`,
        )
        .replace("#include <begin_vertex>", "vec3 transformed = vec3(position.xy, position.z + fh0);");
    };
    m.customProgramCacheKey = () => `fabric-banner-${half}`;
    return m;
  }, [height, sheen]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    if (!frozen) time.current.value += Math.min(delta, 1 / 20);
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
