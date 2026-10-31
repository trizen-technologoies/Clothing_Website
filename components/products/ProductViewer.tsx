"use client";

import { Center, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Minus, Plus, RotateCcw, RotateCw } from "lucide-react";
import { Suspense, useEffect, useRef, useState, type ComponentRef } from "react";
import * as THREE from "three";

import { GarmentDisplay } from "@/components/three/GarmentDisplay";
import { StudioEnvironment } from "@/components/three/StudioEnvironment";
import type { GarmentKind } from "@/lib/garments";

type Props = {
  garment: GarmentKind;
  color: string;
  graphic?: boolean;
  /** Optional .glb in /public. When set it replaces the procedural form study. */
  modelUrl?: string;
  onReady?: () => void;
};

const BASE_DISTANCE = 9;

/** Damps the turntable toward its target angle and the camera toward its zoom. */
function Rig({ angle, zoom, children }: { angle: number; zoom: number; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 6);
    if (group.current) group.current.rotation.y += (angle - group.current.rotation.y) * k;
    const target = BASE_DISTANCE / zoom;
    const current = camera.position.length();
    camera.position.setLength(current + (target - current) * k);
  });

  return <group ref={group}>{children}</group>;
}

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export default function ProductViewer({ garment, color, graphic, modelUrl, onReady }: Props) {
  const [angle, setAngle] = useState(0);
  const [zoom, setZoom] = useState(1);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const facingBack = Math.abs(Math.round(angle / Math.PI)) % 2 === 1;

  useEffect(() => {
    if (modelUrl) useGLTF.preload(modelUrl);
  }, [modelUrl]);

  const reset = () => {
    controls.current?.reset();
    setAngle(0);
    setZoom(1);
  };

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 30, position: [0, 0.3, BASE_DISTANCE] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => onReady?.()}
        className="touch-none"
        aria-label="Interactive 3D form study. Use the buttons below to rotate and zoom."
        role="img"
      >
        <color attach="background" args={["#0d0f13"]} />
        <ambientLight intensity={0.4} />
        <spotLight position={[2, 6, 7]} angle={0.5} penumbra={1} intensity={260} decay={2} color="#eef4ff" />
        <pointLight position={[3.5, 1.5, -2.5]} intensity={45} distance={10} decay={2} color="#00e5ff" />
        <pointLight position={[-3.5, 0.8, -2.5]} intensity={38} distance={10} decay={2} color="#8b5cf6" />
        <directionalLight position={[0, 1, 6]} intensity={1} color="#c9d4e6" />
        <StudioEnvironment intensity={0.8} />

        <Rig angle={angle} zoom={zoom}>
          <Suspense fallback={null}>
            {modelUrl ? <GltfModel url={modelUrl} /> : <GarmentDisplay kind={garment} color={color} graphic={graphic} quality="high" glow={0.9} />}
          </Suspense>
        </Rig>

        <ContactShadows position={[0, -1.85, 0]} opacity={0.55} scale={8} blur={2.6} far={3} frames={1} />
        <OrbitControls
          ref={controls}
          makeDefault
          enablePan={false}
          enableZoom={false}
          enableDamping
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.6}
        />
      </Canvas>

      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="View" className="flex border border-line bg-ink/70 backdrop-blur">
          {(["Front", "Back"] as const).map((label, i) => {
            const active = (i === 1) === facingBack;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => setAngle(i === 0 ? 0 : Math.PI)}
                className="eyebrow h-9 px-3 text-muted transition-colors hover:text-fg aria-pressed:bg-fg aria-pressed:text-ink"
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex border border-line bg-ink/70 backdrop-blur">
          <ViewerButton label="Rotate left" onClick={() => setAngle((a) => a - Math.PI / 4)}>
            <RotateCcw className="size-3.5" />
          </ViewerButton>
          <ViewerButton label="Rotate right" onClick={() => setAngle((a) => a + Math.PI / 4)}>
            <RotateCw className="size-3.5" />
          </ViewerButton>
          <ViewerButton label="Zoom out" disabled={zoom <= 0.8} onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}>
            <Minus className="size-3.5" />
          </ViewerButton>
          <ViewerButton label="Zoom in" disabled={zoom >= 1.8} onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}>
            <Plus className="size-3.5" />
          </ViewerButton>
          <button type="button" onClick={reset} className="eyebrow h-9 px-3 text-muted transition-colors hover:text-fg">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewerButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center text-muted transition-colors hover:text-fg disabled:opacity-30"
    >
      {children}
    </button>
  );
}
