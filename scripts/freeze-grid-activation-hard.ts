import { mkdir, writeFile } from "node:fs/promises"; import { dirname, resolve } from "node:path";
import { createHardGridActivationHoldout, hardGridActivationVersion } from "../src/lib/discovery/grid-activation-memory-hard";
const output = resolve("evaluation/confirmatory/grid-activation-confirmatory-v2.json"); await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ id: "grid-activation-confirmatory-v2", generatorVersion: hardGridActivationVersion, status: "frozen-confirmatory", hypothesis: "Models fail temporal set-cardinality over repeated spatial events.", candidates: createHardGridActivationHoldout() }, null, 2)}\n`); console.log({ output, candidates: 16 });
