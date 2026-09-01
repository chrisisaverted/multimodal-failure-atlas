import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { coflashHardVersion, createCoflashHardGrid } from "../src/lib/discovery/coflash-counting";
const output = resolve("evaluation/discovery/coflash-discovery-v2.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "coflash-discovery-v2", generatorVersion: coflashHardVersion, status: "discovery-only", supersedes: "coflash-discovery-v1", selectedCell: { beats: 30, targetCount: 7, activeMs: 260 }, hypothesis: "A denser and briefer stream exposes exact distributed temporal aggregation failures while events remain individually visible to humans.", candidates: createCoflashHardGrid() }, null, 2)}\n`);
console.log({ output, candidates: 8 });
