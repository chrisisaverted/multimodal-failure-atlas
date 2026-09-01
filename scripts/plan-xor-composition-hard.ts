import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createXorHardGrid, xorCompositionHardVersion } from "../src/lib/discovery/xor-composition";
const output = resolve("evaluation/discovery/xor-composition-discovery-v2.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "xor-composition-discovery-v2", generatorVersion: xorCompositionHardVersion, status: "discovery-only", supersedes: "xor-composition-discovery-v1", selectedCell: { gridSize: 20, flipsPerDistractor: 1 }, hypothesis: "One-cell near misses in a larger array isolate exact visual Boolean composition from coarse similarity matching.", candidates: createXorHardGrid() }, null, 2)}\n`);
console.log({ output, candidates: 8 });
