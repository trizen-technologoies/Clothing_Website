"use client";

import { Environment, Lightformer } from "@react-three/drei";

/**
 * Procedural studio reflections built from light panels — no HDR download.
 * "strips" swaps the round fill for tall softboxes, which reads as long
 * streak highlights on glossy fabric.
 */
export function StudioEnvironment({ intensity = 0.6, variant = "studio" }: { intensity?: number; variant?: "studio" | "strips" }) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer form="rect" intensity={3} color="#00e5ff" position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[2, 6, 1]} />
      <Lightformer form="rect" intensity={2.5} color="#8b5cf6" position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[2, 6, 1]} />
      {variant === "studio" ? (
        <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[0, 2, 8]} scale={3} />
      ) : (
        <>
          <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[-3, 0, 7]} scale={[0.5, 12, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#dfe7ff" position={[4, 0, 6]} scale={[0.35, 12, 1]} />
        </>
      )}
    </Environment>
  );
}
