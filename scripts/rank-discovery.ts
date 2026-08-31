import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { scoreCells } from "../src/lib/discovery/objective";
import { discoveryCandidateSchema } from "../src/lib/discovery/schema";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/lattice-counting-discovery-v1.json");
const outputPath = resolve(process.argv[4] ?? "evaluation/discovery/lattice-counting-ranking-v1.json");
const plan = z
  .object({ candidates: z.array(discoveryCandidateSchema) })
  .parse(JSON.parse(await readFile(planPath, "utf8")));
const explicitResultsPath = process.argv[3];
const resultPaths = explicitResultsPath
  ? [resolve(explicitResultsPath)]
  : (await readdir(resolve("evaluation/results")))
      .filter((name) => name.startsWith("lattice-counting-discovery-v1") && name.endsWith(".jsonl"))
      .map((name) => resolve("evaluation/results", name));
const records = (
  await Promise.all(
    resultPaths.map(async (path) =>
      (await readFile(path, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
    ),
  )
).flat();
const candidateBySeed = new Map(plan.candidates.map((candidate) => [candidate.seed, candidate]));
const observations = records.flatMap((record) => {
  const candidate = candidateBySeed.get(record.seed);
  if (!candidate) return [];
  return [
    {
      candidateId: candidate.id,
      modelId: record.modelId,
      outcome: record.emptyResponse
        ? ("no-answer" as const)
        : record.status === "pending-review"
          ? ("review" as const)
          : record.correct
            ? ("correct" as const)
            : ("incorrect" as const),
      costUsd: record.costUsd,
    },
  ];
});
const expectedModels = new Set(records.map((record) => record.modelId)).size;
const cells = scoreCells(plan.candidates, observations, expectedModels).map((score) => {
  const representative = plan.candidates.find((candidate) => candidate.cellId === score.cellId)!;
  return {
    ...score,
    parameters: {
      flashDurationMs: representative.parameters.flashDurationMs,
      intervalMs: representative.parameters.intervalMs,
      phaseMs: representative.parameters.phaseMs,
    },
  };
});
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      id: "lattice-counting-ranking-v1",
      status: "adaptive-discovery-not-confirmatory-evidence",
      expectedModels,
      resultFiles: resultPaths.map((path) => path.slice(resolve(".").length + 1)),
      records: records.length,
      totalCostUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
      selectionRule: "top two cells by Wilson-95%-lower-bound × model coverage; no-answer weight is zero",
      cells,
    },
    null,
    2,
  )}\n`,
);
console.log(JSON.stringify({ outputPath, topCells: cells.slice(0, 2) }, null, 2));
