import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRouteTurnGrid, routeTurnVersion } from "../src/lib/discovery/route-turn-count";

const output = resolve("evaluation/discovery/route-turn-discovery-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "route-turn-discovery-v1", generatorVersion: routeTurnVersion, status: "discovery-only", hypothesis: "Video models fail to integrate direction changes along a moving route when the trajectory is not persistently rendered.", candidates: createRouteTurnGrid() }, null, 2)}\n`,
);
console.log({ output, candidates: 8 });
