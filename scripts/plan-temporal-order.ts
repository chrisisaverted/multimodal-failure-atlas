import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createTemporalOrderDiscoveryGrid, temporalOrderVersion } from "../src/lib/discovery/temporal-order";
const output = resolve("evaluation/discovery/temporal-order-discovery-v1.json");
const candidates = createTemporalOrderDiscoveryGrid();
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "temporal-order-discovery-v1", generatorVersion: temporalOrderVersion, status: "discovery-only", hypothesis: "Video routes fail to preserve the ordering of short, plainly visible events across a clip.", candidates }, null, 2)}\n`);
console.log({ output, candidates: candidates.length });
