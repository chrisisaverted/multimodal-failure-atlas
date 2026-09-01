import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createSymmetryHoldout, symmetryVersion } from "../src/lib/discovery/symmetry-search";
const output = resolve("evaluation/discovery/symmetry-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "symmetry-confirmatory-v1", generatorVersion: symmetryVersion, status: "frozen-confirmatory-holdout", frozenAt: "2026-09-01", selectedFromDiscovery: "symmetry-discovery-v1", selectedCell: { gridSize: 24, defectsPerDistractor: 1 }, candidates: createSymmetryHoldout() }, null, 2)}\n`);
console.log({ output, candidates: 16 });
