import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { changeLocalizationVersion, createChangeLocalizationHoldout } from "../src/lib/discovery/change-localization";

const output = resolve("evaluation/discovery/change-localization-confirmatory-v1.json");
const candidates = createChangeLocalizationHoldout();
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  id: "change-localization-confirmatory-v1",
  generatorVersion: changeLocalizationVersion,
  status: "frozen-confirmatory-holdout",
  frozenAt: "2026-09-01",
  selectedFromDiscovery: "change-localization-discovery-v2",
  selectedCell: { gridSize: 34 },
  candidates,
}, null, 2)}\n`);
console.log({ output, candidates: candidates.length });
