import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createMazeReachabilityDiscoveryGrid, mazeReachabilityVersion } from "../src/lib/discovery/maze-reachability";

const output = resolve("evaluation/discovery/maze-reachability-discovery-v1.json");
const candidates = createMazeReachabilityDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "maze-reachability-discovery-v1", generatorVersion: mazeReachabilityVersion, status: "discovery-only", hypothesis: "Frontier models fail exact visual graph reachability in dense mazes even when one of four choices is objectively connected.", candidates }, null, 2)}\n`);
console.log({ output, candidates: candidates.length });
