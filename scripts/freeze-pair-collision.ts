import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createPairCollisionHoldout, pairCollisionVersion } from "../src/lib/discovery/pair-collision-count";

const output = resolve("evaluation/discovery/pair-collision-confirmatory-v1.json");
const candidates = createPairCollisionHoldout();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "pair-collision-confirmatory-v1", generatorVersion: pairCollisionVersion, status: "frozen-confirmatory-holdout-with-oracle-counter-control", frozenAt: "2026-09-01", selectedFromDiscovery: "pair-collision-discovery-v1", selectedCell: { targetCounts: [5, 6, 7, 8], totalPairwiseEvents: 24 }, candidates }, null, 2)}\n`,
);
console.log({ output, candidates: candidates.length });
