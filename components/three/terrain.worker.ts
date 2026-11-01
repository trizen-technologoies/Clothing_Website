import { buildTerrain, type TerrainKind } from "./terrain";

/** Builds a terrain mesh off the main thread and hands its arrays back without copying. */
self.onmessage = (event: MessageEvent<{ kind: TerrainKind; step: number }>) => {
  const { kind, step } = event.data;
  const data = buildTerrain(kind, step);
  (self as unknown as Worker).postMessage({ kind, data }, Object.values(data).map((array) => array.buffer));
};
