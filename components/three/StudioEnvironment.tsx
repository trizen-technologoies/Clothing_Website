"use client";

import { Environment, Lightformer } from "@react-three/drei";

import { palette } from "@/lib/palette";

/**
 * Procedural studio reflections built from light panels — no HDR download.
 * "strips" swaps the round fill for tall softboxes, which reads as long
 * streak highlights on glossy fabric.
 */
export function StudioEnvironment({ intensity = 0.6, variant = "studio" }: { intensity?: number; variant?: "studio" | "strips" }) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 6, -2]} rotation-x={Math.PI / 2} scale={[8, 1.2, 1]} />
      <Lightformer form="rect" intensity={3} color={palette.cyan} position={[6, 1, -2]} rotation-y={-Math.PI / 2} scale={[2, 6, 1]} />
      <Lightformer form="rect" intensity={2.5} color={palette.teal} position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[2, 6, 1]} />
      {variant === "studio" ? (
        <Lightformer form="ring" intensity={1.2} color="#ffffff" position={[0, 2, 8]} scale={3} />
      ) : (
        <>
          <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[-3, 0, 7]} scale={[0.5, 12, 1]} />
          <Lightformer form="rect" intensity={1.4} color={palette.key} position={[4, 0, 6]} scale={[0.35, 12, 1]} />
        </>
      )}
    </Environment>
  );
}
