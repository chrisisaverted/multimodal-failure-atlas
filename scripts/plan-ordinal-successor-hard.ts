import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createOrdinalHardGrid, ordinalSuccessorHardVersion } from "../src/lib/discovery/ordinal-successor";
const output = resolve("evaluation/discovery/ordinal-successor-discovery-v2.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "ordinal-successor-discovery-v2", generatorVersion: ordinalSuccessorHardVersion, status: "discovery-only", supersedes: "ordinal-successor-discovery-v1", selectedCell: { events: 32, targetOrdinal: 5, activeMs: 300 }, hypothesis: "Dense event presentation stresses selective ordinal retrieval while leaving every symbol consciously visible.", candidates: createOrdinalHardGrid() }, null, 2)}\n`);
console.log({ output, candidates: 8 });
