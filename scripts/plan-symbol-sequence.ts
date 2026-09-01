import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createSymbolSequenceGrid, symbolSequenceVersion } from "../src/lib/discovery/symbol-sequence-recall";

const output = resolve("evaluation/discovery/symbol-sequence-discovery-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "symbol-sequence-discovery-v1", generatorVersion: symbolSequenceVersion, status: "discovery-only", hypothesis: "Video models fail exact ordered reconstruction of a rapidly presented symbol stream even when every atomic symbol is trivial.", candidates: createSymbolSequenceGrid() }, null, 2)}\n`,
);
console.log({ output, candidates: 8 });
