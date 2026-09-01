import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createSelectiveFlashHoldoutV3,
  selectiveFlashAnswerVersion,
} from "../src/lib/discovery/selective-flash-tracking";

const output = resolve("evaluation/discovery/selective-flash-confirmatory-v3.json");
const candidates = createSelectiveFlashHoldoutV3();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "selective-flash-confirmatory-v3", generatorVersion: selectiveFlashAnswerVersion, status: "frozen-confirmatory-holdout-with-persistent-answer-control", frozenAt: "2026-09-01", selectedFromDiscovery: "selective-flash-discovery-v1", selectedCell: { targetCounts: [8, 9, 10, 11], flashDurationMs: 133, distractorObjects: 4 }, candidates }, null, 2)}\n`,
);
console.log({ output, candidates: candidates.length });
