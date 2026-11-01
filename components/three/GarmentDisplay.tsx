"use client";

import type { ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, type Ref } from "react";
import * as THREE from "three";

import { fabricTones, mix } from "@/lib/color";
import type { GarmentKind } from "@/lib/garments";
import { palette } from "@/lib/palette";
import { buildGarmentGeometry, buildGarmentMaps, buildPrintMaps } from "./garmentGeometry";
import type { Quality } from "./heroState";

type Props = Omit<ThreeElements["group"], "ref"> & {
  kind: GarmentKind;
  color: string;
  graphic?: boolean;
  quality: Quality;
  /** Initial emissive strength of reflective tape / zip glints (animate it via meshRef). */
  glow?: number;
  accent?: string;
  meshRef?: Ref<THREE.Mesh>;
};

/**
 * Sculptural garment form: extruded technical-flat silhouette with a fabric
 * (sheen) material and painted construction details.
 */
export function GarmentDisplay({ kind, color, graphic = false, quality, glow = 1.4, accent = palette.cyan, meshRef, ...group }: Props) {
  const geometry = useMemo(() => buildGarmentGeometry(kind, quality), [kind, quality]);
  const maps = useMemo(() => buildGarmentMaps(kind, quality, graphic), [kind, quality, graphic]);
  const tones = fabricTones(color);
  const prints = useMemo(
    () => buildPrintMaps(kind, quality, graphic, color, tones.print, tones.tonal),
    [kind, quality, graphic, color, tones.print, tones.tonal],
  );

  const materials = useMemo(() => {
    const light = tones.light;
    const base = {
      roughness: light ? 0.9 : 0.78,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 0.42,
      sheenColor: new THREE.Color(mix(color, "#9fc0c8", light ? 0.25 : 0.55)),
      envMapIntensity: 0.6,
    };
    const cap = (bump: THREE.Texture, glowMap: THREE.Texture | null, map: THREE.Texture | null) =>
      new THREE.MeshPhysicalMaterial({
        ...base,
        color: map ? "#ffffff" : color,
        map,
        bumpMap: bump,
        bumpScale: 2.2,
        emissive: glowMap ? accent : "#000000",
        emissiveMap: glowMap,
        emissiveIntensity: glow,
      });
    return [
      cap(maps.front.bump, maps.front.glow, prints.front),
      new THREE.MeshPhysicalMaterial({ ...base, color }),
      cap(maps.back.bump, maps.back.glow, prints.back),
    ];
  }, [maps, prints, color, accent, tones.light, glow]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => maps.dispose(), [maps]);
  useEffect(() => () => [prints.front, prints.back].forEach((t) => t?.dispose()), [prints]);
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  return (
    <group {...group}>
      <mesh ref={meshRef} geometry={geometry} material={materials} />
    </group>
  );
}
