import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createEulerHoldout, eulerGraphVersion } from "../src/lib/discovery/euler-graph";

const output = resolve("evaluation/discovery/euler-graph-confirmatory-v1.json");
const candidates = createEulerHoldout();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "euler-graph-confirmatory-v1", generatorVersion: eulerGraphVersion, status: "frozen-confirmatory-holdout-with-oracle-ring-control", frozenAt: "2026-09-01", selectedFromDiscovery: "euler-graph-discovery-v1", selectedCell: { panels: 4, verticesPerGraph: 10 }, candidates }, null, 2)}\n`,
);
console.log({ output, candidates: candidates.length });
