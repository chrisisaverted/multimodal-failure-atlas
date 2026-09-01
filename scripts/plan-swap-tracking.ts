import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createSwapTrackingGrid, swapTrackingVersion } from "../src/lib/discovery/swap-tracking";
const output = resolve("evaluation/discovery/swap-tracking-discovery-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "swap-tracking-discovery-v1", generatorVersion: swapTrackingVersion, status: "discovery-only", hypothesis: "Video models fail to preserve a target identity through a long sequence of explicitly visible permutations.", candidates: createSwapTrackingGrid() }, null, 2)}\n`);
console.log({ output, candidates: 8 });
