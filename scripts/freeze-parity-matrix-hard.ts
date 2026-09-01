import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createHardParityHoldout, hardParityVersion } from "../src/lib/discovery/parity-matrix-hard";

const output = resolve("evaluation/confirmatory/parity-matrix-confirmatory-v2.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  id: "parity-matrix-confirmatory-v2",
  generatorVersion: hardParityVersion,
  status: "frozen-confirmatory",
  hypothesis: "Frontier multimodal models fail exact two-dimensional parity verification over dense arrays.",
  candidates: createHardParityHoldout(),
}, null, 2)}\n`);
console.log({ output, candidates: 16 });
