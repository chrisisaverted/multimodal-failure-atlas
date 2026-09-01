import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createSelectiveFlashHoldoutV2,
  selectiveFlashVersion,
} from "../src/lib/discovery/selective-flash-tracking";

const output = resolve("evaluation/discovery/selective-flash-confirmatory-v2.json");
const candidates = createSelectiveFlashHoldoutV2();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "selective-flash-confirmatory-v2", generatorVersion: selectiveFlashVersion, status: "frozen-confirmatory-holdout-with-oracle-counter-control", frozenAt: "2026-09-01", selectedFromDiscovery: "selective-flash-discovery-v1", selectedCell: { targetCounts: [8, 9, 10, 11], flashDurationMs: 133, distractorObjects: 4 }, candidates }, null, 2)}\n`,
);
console.log({ output, candidates: candidates.length });
