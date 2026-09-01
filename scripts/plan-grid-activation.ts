import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createGridActivationGrid, gridActivationVersion } from "../src/lib/discovery/grid-activation-memory";

const output = resolve("evaluation/discovery/grid-activation-discovery-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "grid-activation-discovery-v1", generatorVersion: gridActivationVersion, status: "discovery-only", hypothesis: "Video models fail to maintain a duplicate-suppressed set of spatial events across a temporal stream.", candidates: createGridActivationGrid() }, null, 2)}\n`,
);
console.log({ output, candidates: 8 });
