"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";

import { palette } from "@/lib/palette";

export type LightLevels = {
  key: number;
  cyan: number;
  teal: number;
  /** World x/z the rim lights travel with (the garment's position). */
  x: number;
  z: number;
};

/**
 * Studio lighting: a cool key spot from above-front, a cyan rim from
 * back-right and a deep teal rim from back-left. Intensities follow `levels`.
 */
export function SceneLights({ levels }: { levels: RefObject<LightLevels> }) {
  const key = useRef<THREE.SpotLight>(null);
  const cyan = useRef<THREE.PointLight>(null);
  const teal = useRef<THREE.PointLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const target = useRef<THREE.Object3D>(null);

  useFrame(() => {
    const l = levels.current;
    if (!l) return;
    if (key.current && target.current) {
      key.current.intensity = 80 * l.key;
      key.current.position.set(l.x + 0.8, 5.5, l.z + 6);
      target.current.position.set(l.x, 0.2, l.z);
      key.current.target = target.current;
    }
    if (cyan.current) {
      cyan.current.intensity = 34 * l.cyan;
      cyan.current.position.set(l.x + 2.6, 1.6, l.z - 1.6);
    }
    if (teal.current) {
      teal.current.intensity = 30 * l.teal;
      teal.current.position.set(l.x - 2.8, 0.6, l.z - 1.4);
    }
    if (fill.current) fill.current.intensity = 0.7 * l.key;
  });

  return (
    <>
      <ambientLight intensity={0.06} />
      <object3D ref={target} />
      <spotLight ref={key} angle={0.42} penumbra={1} decay={2} distance={22} color={palette.key} />
      <pointLight ref={cyan} color={palette.cyan} distance={9} decay={2} />
      <pointLight ref={teal} color={palette.teal} distance={9} decay={2} />
      <directionalLight ref={fill} position={[0, 2, 8]} color="#b3cdd3" />
    </>
  );
}
