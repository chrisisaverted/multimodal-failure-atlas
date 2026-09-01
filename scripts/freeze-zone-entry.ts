import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createZoneEntryHoldout, zoneEntryVersion } from "../src/lib/discovery/zone-entry-count";

const output = resolve("evaluation/discovery/zone-entry-confirmatory-v1.json");
const candidates = createZoneEntryHoldout();
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "zone-entry-confirmatory-v1", generatorVersion: zoneEntryVersion, status: "frozen-confirmatory-holdout-with-oracle-counter-control", frozenAt: "2026-09-01", selectedFromDiscovery: "zone-entry-discovery-v1", selectedCell: { cycles: [4, 5, 6, 7], distractorObjects: 4 }, candidates }, null, 2)}\n`,
);
console.log({ output, candidates: candidates.length });
