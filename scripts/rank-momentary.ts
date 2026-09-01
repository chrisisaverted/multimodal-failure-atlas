import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { frontierAdmissionPolicy, scoreCrossModelCells } from "../src/lib/discovery/admission";
import { momentarySymbolCandidateSchema } from "../src/lib/discovery/momentary-symbol";
import { sha256 } from "../src/lib/evaluation/hash";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/momentary-symbol-discovery-v1.json");
const protocolPath = resolve(process.argv[3] ?? "evaluation/plans/momentary-symbol-screen-v1.json");
const outputPath = resolve(process.argv[4] ?? "evaluation/discovery/momentary-symbol-ranking-v1.json");
const planBytes = await readFile(planPath);
const plan = z
  .object({ id: z.string(), candidates: z.array(momentarySymbolCandidateSchema) })
  .parse(JSON.parse(planBytes.toString("utf8")));
const protocol = z
  .object({
    evaluationPlanId: z.string(),
    evaluationPlanSha256: z.string(),
    models: z.array(z.object({ modelId: z.string() })),
  })
  .parse(JSON.parse(await readFile(protocolPath, "utf8")));
if (protocol.evaluationPlanId !== plan.id || protocol.evaluationPlanSha256 !== sha256(planBytes)) {
  throw new Error("Momentary protocol does not bind the exact discovery plan.");
}

const resultPaths = ["gemini", "kimi", "qwen"].map((name) =>
  resolve(`evaluation/results/momentary-symbol-discovery-v1-${name}.jsonl`),
);
const parsed = (
  await Promise.all(
    resultPaths.map(async (path) =>
      (await readFile(path, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
    ),
  )
).flat();
const records = [...new Map(parsed.map((record) => [record.id, record])).values()];
const scientificKeys = records.map((record) => `${record.modelId}:${record.seed}`);
if (new Set(scientificKeys).size !== scientificKeys.length) {
  throw new Error("A model/candidate pair appears more than once.");
}
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
const policy = { ...frontierAdmissionPolicy, minimumSubstantiveAnswersPerModel: 4 };
const targetModelIds = protocol.models.map((model) => model.modelId);
const scores = scoreCrossModelCells(plan.candidates, observations, targetModelIds, policy).map((score) => {
  const representative = plan.candidates.find((candidate) => candidate.cellId === score.cellId)!;
  return {
    ...score,
    parameters: {
      eventDurationMs: representative.parameters.eventDurationMs,
      phaseMs: representative.parameters.phaseMs,
      videoDurationMs: representative.parameters.videoDurationMs,
    },
  };
});
const predictionDistribution = Object.fromEntries(
  targetModelIds.map((modelId) => [
    modelId,
    Object.fromEntries(
      [
        ...new Set(
          records.filter((record) => record.modelId === modelId).map((record) => record.parsedAnswer),
        ),
      ]
        .sort()
        .map((answer) => [
          answer || "unparsed",
          records.filter((record) => record.modelId === modelId && record.parsedAnswer === answer).length,
        ]),
    ),
  ]),
);
await writeFile(
  outputPath,
  `${JSON.stringify(
    {
      id: "momentary-symbol-ranking-v1",
      status: "adaptive-discovery-not-confirmatory-evidence",
      planSha256: sha256(planBytes),
      targetModelIds,
      policy,
      resultFiles: resultPaths.map((path) => path.slice(resolve(".").length + 1)),
      records: records.length,
      totalCostUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
      selectionRule:
        "minimize the easiest target model's Wilson-95% upper solve bound; require substantive coverage from every model; no-answer weight is zero",
      predictionDistribution,
      cells: scores,
    },
    null,
    2,
  )}\n`,
);
console.log(JSON.stringify({ outputPath, records: records.length, topCells: scores.slice(0, 3) }, null, 2));
