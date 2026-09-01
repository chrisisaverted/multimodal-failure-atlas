import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createSwapTrackingHoldout, swapTrackingVersion } from "../src/lib/discovery/swap-tracking";

const output = resolve("evaluation/discovery/swap-tracking-confirmatory-v1.json");
const candidates = createSwapTrackingHoldout();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "swap-tracking-confirmatory-v1", generatorVersion: swapTrackingVersion, status: "frozen-confirmatory-holdout-with-visible-identity-control", frozenAt: "2026-09-01", selectedFromDiscovery: "swap-tracking-discovery-v1", selectedCell: { swaps: 12, slots: 4 }, candidates }, null, 2)}\n`,
);
console.log({ output, candidates: candidates.length });
