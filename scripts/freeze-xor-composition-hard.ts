import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createXorHardHoldout, xorCompositionHardVersion } from "../src/lib/discovery/xor-composition";
const output = resolve("evaluation/discovery/xor-composition-confirmatory-v2.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "xor-composition-confirmatory-v2", generatorVersion: xorCompositionHardVersion, status: "frozen-confirmatory-holdout", frozenAt: "2026-09-01", selectedFromDiscovery: "xor-composition-discovery-v2", selectedCell: { gridSize: 20, flipsPerDistractor: 1 }, candidates: createXorHardHoldout() }, null, 2)}\n`);
console.log({ output, candidates: 16 });
