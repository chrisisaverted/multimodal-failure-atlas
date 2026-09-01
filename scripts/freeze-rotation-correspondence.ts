import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createRotationCorrespondenceHoldout,
  rotationCorrespondenceCandidateSchema,
  rotationCorrespondenceVersion,
} from "../src/lib/discovery/rotation-correspondence";
import { sha256 } from "../src/lib/evaluation/hash";

const discoveryPath = resolve("evaluation/discovery/rotation-correspondence-discovery-v1.json");
const discovery = JSON.parse(await readFile(discoveryPath, "utf8")) as { candidates: unknown[] };
const candidates = discovery.candidates.map((candidate) =>
  rotationCorrespondenceCandidateSchema.parse(candidate),
);
const selectedCellId = "cell-950947490e3b7ab6";
const representative = candidates.find((candidate) => candidate.cellId === selectedCellId);
if (!representative) throw new Error(`Selected cell ${selectedCellId} is absent.`);

const resultPaths = [
  "evaluation/results/rotation-correspondence-discovery-v1-gemini.jsonl",
  "evaluation/results/rotation-correspondence-discovery-v1-kimi.jsonl",
  "evaluation/results/rotation-correspondence-discovery-v1-qwen.jsonl",
  "evaluation/results/rotation-correspondence-discovery-v1-qwen-a.jsonl",
  "evaluation/results/rotation-correspondence-discovery-v1-qwen-b.jsonl",
  "evaluation/results/rotation-correspondence-discovery-v1-qwen-c.jsonl",
];
const discoveryEvidence = await Promise.all(
  resultPaths.map(async (path) => ({
    path,
    sha256: sha256(new Uint8Array(await readFile(resolve(path)))),
  })),
);
const output = resolve("evaluation/discovery/rotation-correspondence-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "rotation-correspondence-confirmatory-v1",
      generatorVersion: rotationCorrespondenceVersion,
      status: "frozen-confirmatory-holdout",
      frozenAt: new Date().toISOString(),
      selectedCellId,
      selectionRule:
        "Selected the easier nine-vertex cell because every target route was below 50% and it maximizes likely human interpretability.",
      discoveryEvidence,
      holdoutSeparation:
        "New seeds 1500000+, new visual variants 300+, and four balanced replicates per answer location.",
      candidates: createRotationCorrespondenceHoldout(representative),
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: 16, selectedCellId });
