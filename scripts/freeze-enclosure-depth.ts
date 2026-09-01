import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createEnclosureDepthHoldout,
  enclosureDepthCandidateSchema,
  enclosureDepthVersion,
} from "../src/lib/discovery/enclosure-depth";
import { sha256 } from "../src/lib/evaluation/hash";

const discoveryPath = resolve("evaluation/discovery/enclosure-depth-discovery-v1.json");
const discovery = JSON.parse(await readFile(discoveryPath, "utf8")) as {
  candidates: unknown[];
};
const candidates = discovery.candidates.map((candidate) => enclosureDepthCandidateSchema.parse(candidate));
const selectedCellId = "cell-307acd43045653fa";
const representative = candidates.find((candidate) => candidate.cellId === selectedCellId);
if (!representative) throw new Error(`Selected cell ${selectedCellId} is absent.`);

const resultPaths = [
  "evaluation/results/enclosure-depth-discovery-v1-gemini.jsonl",
  "evaluation/results/enclosure-depth-discovery-v1-qwen.jsonl",
  "evaluation/results/enclosure-depth-discovery-v1-kimi.jsonl",
];
const discoveryEvidence = await Promise.all(
  resultPaths.map(async (path) => ({
    path,
    sha256: sha256(new Uint8Array(await readFile(resolve(path)))),
  })),
);
const output = resolve("evaluation/discovery/enclosure-depth-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "enclosure-depth-confirmatory-v1",
      generatorVersion: enclosureDepthVersion,
      status: "frozen-confirmatory-holdout",
      frozenAt: new Date().toISOString(),
      selectedCellId,
      selectionRule:
        "Every target route produced eight substantive discovery answers and observed solve rate 2/8 at this cell.",
      discoveryEvidence,
      holdoutSeparation:
        "New seeds 1200000+, visual variants 109+, four replicates per adjacent answer, and no holdout artifact was screened.",
      candidates: createEnclosureDepthHoldout(representative),
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: 16, selectedCellId });
