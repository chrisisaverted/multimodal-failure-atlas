import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  compositionalCountingGeneratorVersion,
  createCompositionalCountingDiscoveryGrid,
} from "../src/lib/discovery/compositional-counting";

const output = resolve(process.argv[2] ?? "evaluation/discovery/compositional-counting-discovery-v1.json");
const candidates = createCompositionalCountingDiscoveryGrid();
const plan = {
  id: "compositional-counting-discovery-v1",
  generatorVersion: compositionalCountingGeneratorVersion,
  status: "discovery-only",
  hypothesis: "Exact counts of three-attribute conjunctions fail under dense one-attribute-away distractors.",
  candidates,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({ output, candidates: candidates.length }, null, 2));
