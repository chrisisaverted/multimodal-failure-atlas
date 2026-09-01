import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createWireTracingDiscoveryGrid, wireTracingGeneratorVersion } from "../src/lib/discovery/wire-tracing";
const output = resolve(process.argv[2] ?? "evaluation/discovery/wire-tracing-discovery-v1.json");
const candidates = createWireTracingDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "wire-tracing-discovery-v1", generatorVersion: wireTracingGeneratorVersion, status: "discovery-only", hypothesis: "Identity tracking across repeated visual crossings degrades before human traceability does.", candidates }, null, 2)}\n`);
console.log(JSON.stringify({ output, candidates: candidates.length }, null, 2));
