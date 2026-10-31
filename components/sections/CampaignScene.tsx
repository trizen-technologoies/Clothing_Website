"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { FabricBanner } from "@/components/three/FabricBanner";
import { FloatingParticles } from "@/components/three/FloatingParticles";
import type { Quality } from "@/components/three/heroState";
import { StudioEnvironment } from "@/components/three/StudioEnvironment";

function Rig({ quality, frozen }: { quality: Quality; frozen: boolean }) {
  const { size } = useThree();
  const portrait = size.width / size.height < 0.9;
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (frozen) return;
    const k = 1 - Math.exp(-delta * 2);
    pointer.current.x += (state.pointer.x - pointer.current.x) * k;
    pointer.current.y += (state.pointer.y - pointer.current.y) * k;
    state.camera.position.set(pointer.current.x * 0.4, pointer.current.y * 0.25, 10);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <spotLight position={[2.5, 6, 6]} angle={0.45} penumbra={1} intensity={320} distance={30} decay={2} color="#eef4ff" />
      {/* Grazing rims catch the folds. */}
      <pointLight position={[6.5, 0.5, -1.5]} intensity={140} distance={14} decay={2} color="#00e5ff" />
      <pointLight position={[-1.5, 2.5, -3.5]} intensity={110} distance={14} decay={2} color="#8b5cf6" />
      <group ref={group} position={portrait ? [0.2, 1.6, -1] : [2.1, 0.9, 0]}>
        <group rotation={[0.04, portrait ? -0.3 : -0.55, 0.05]}>
          <FabricBanner quality={quality} frozen={frozen} />
        </group>
        <group position={[1.9, 0.6, -1.8]} rotation={[0.02, -0.15, -0.03]}>
          <FabricBanner quality={quality} frozen={frozen} width={1.9} height={10} phase={2.3} sheen="#5fd8ff" />
        </group>
      </group>
      <FloatingParticles count={quality === "high" ? 500 : 200} min={[-8, -5, -8]} range={[16, 10, 14]} size={1.3} frozen={frozen} />
    </>
  );
}

export default function CampaignScene({ quality, active, reducedMotion, onReady }: { quality: Quality; active: boolean; reducedMotion: boolean; onReady?: () => void }) {
  return (
    <Canvas
      dpr={quality === "high" ? [1, 1.6] : [1, 1.25]}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 30, position: [0, 0, 10] }}
      frameloop={!active ? "never" : reducedMotion ? "demand" : "always"}
      onCreated={() => onReady?.()}
      aria-hidden
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 9, 22]} />
      <StudioEnvironment intensity={0.9} variant="strips" />
      <Rig quality={quality} frozen={reducedMotion} />
    </Canvas>
  );
}
