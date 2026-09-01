import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { adjudicateExplicitDeclaration } from "../src/lib/evaluation/adjudication";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const cohort = ["bytedance-seed/seed-2-1-turbo", "xiaomi/mimo-v2.5"] as const;
const requireComplete = process.argv.includes("--require-complete");
const evidence = z
  .object({
    families: z.array(z.object({ catalogueId: z.string(), planId: z.string(), modality: z.string() })),
  })
  .parse(JSON.parse(await readFile(resolve("src/data/admitted-families.json"), "utf8")));
const manifestSchema = z.object({
  cases: z.array(
    z.object({
      candidateId: z.string(),
      seed: z.number().int(),
      condition: z.string(),
      expectedAnswer: z.string(),
      answerOptions: z.array(z.string()),
    }),
  ),
});

function conditionOf(run: EvaluationRunRecord) {
  return (
    run.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? run.inputCondition
  );
}

function wilson(correct: number, total: number) {
  if (!total) return { lower95: null, upper95: null };
  const zScore = 1.959963984540054;
  const proportion = correct / total;
  const denominator = 1 + (zScore * zScore) / total;
  const centre = (proportion + (zScore * zScore) / (2 * total)) / denominator;
  const margin =
    (zScore * Math.sqrt((proportion * (1 - proportion)) / total + (zScore * zScore) / (4 * total * total))) /
    denominator;
  return { lower95: Math.max(0, centre - margin), upper95: Math.min(1, centre + margin) };
}

async function resultFiles(directory: string) {
  try {
    return (await readdir(resolve(directory))).filter((name) => name.endsWith(".jsonl"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

const resultDirectories = [
  "evaluation/results/replication-v1",
  "evaluation/results/replication-v1-completion",
  "evaluation/results/replication-v1-no-reasoning",
  "evaluation/results/replication-v1-mimo-replacement",
  "evaluation/results/replication-v1-mimo-forced-choice",
  "evaluation/results/replication-v1-mimo-declared-answer",
];
const resultPaths = (
  await Promise.all(
    resultDirectories.map(async (directory) =>
      (await resultFiles(directory)).map((name) => resolve(directory, name)),
    ),
  )
).flat();
const runs = (
  await Promise.all(
    resultPaths.map(async (path) =>
      (await readFile(path, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
    ),
  )
).flat();
const uniqueRuns = [...new Map(runs.map((run) => [run.id, run])).values()].sort(
  (left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt) || left.id.localeCompare(right.id),
);
const canonicalProtocolSuffix = new Map<string, string>([
  ["bytedance-seed/seed-2-1-turbo", "external-replication-v1-no-reasoning"],
  ["xiaomi/mimo-v2.5", "external-replication-v1-mimo-declared-answer"],
]);
const isCanonical = (run: EvaluationRunRecord) =>
  cohort.includes(run.modelId as (typeof cohort)[number]) &&
  run.evaluationProtocolId?.endsWith(canonicalProtocolSuffix.get(run.modelId) ?? "never") === true;
const canonicalRuns = uniqueRuns.filter(isCanonical);

const families = [];
for (const family of evidence.families) {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(resolve(`public/evaluations/${family.planId}/manifest.json`), "utf8")),
  );
  const conditions = [...new Set(manifest.cases.map((candidate) => candidate.condition))];
  const nativeCondition = conditions.find((condition) => condition.startsWith("native"));
  const controlCondition = conditions.find((condition) => condition !== nativeCondition);
  if (!nativeCondition || !controlCondition) throw new Error(`${family.planId} has invalid conditions`);
  const models = cohort.map((modelId) => {
    const modelRuns = uniqueRuns.filter(
      (run) =>
        run.evaluationPlanId === family.planId &&
        run.modelId === modelId &&
        run.evaluationProtocolId?.endsWith(canonicalProtocolSuffix.get(modelId)!) === true,
    );
    const summarize = (condition: string) => {
      const cases = manifest.cases.filter((candidate) => candidate.condition === condition);
      const perCase = cases.map((candidate) => {
        const attempts = modelRuns.filter(
          (run) => run.seed === candidate.seed && conditionOf(run) === condition,
        );
        const verified = attempts.filter((run) => run.status === "verified" && !run.emptyResponse);
        if (verified.length > 1) {
          throw new Error(`${family.planId}: duplicate substantive ${modelId} ${candidate.candidateId}`);
        }
        const adjudicated = verified.length
          ? undefined
          : attempts
              .filter((run) => run.status === "pending-review" && !run.emptyResponse)
              .map((run) => ({
                run,
                decision: adjudicateExplicitDeclaration(run.rawResponse, candidate.answerOptions),
              }))
              .find((entry) => entry.decision);
        const selected = verified[0]
          ? { run: verified[0], correct: verified[0].correct, adjudicated: false }
          : adjudicated?.decision
            ? {
                run: adjudicated.run,
                correct:
                  adjudicated.decision.withinOptions &&
                  adjudicated.decision.claimedAnswer === candidate.expectedAnswer,
                adjudicated: true,
              }
            : undefined;
        return { candidate, attempts, selected };
      });
      const answered = perCase.flatMap((entry) => entry.selected ?? []);
      const correct = answered.filter((entry) => entry.correct).length;
      return {
        condition,
        plannedCases: cases.length,
        requests: perCase.reduce((sum, entry) => sum + entry.attempts.length, 0),
        substantiveAnswers: answered.length,
        correct,
        solveRate: answered.length ? correct / answered.length : null,
        ...wilson(correct, answered.length),
        missingCandidateIds: perCase
          .filter((entry) => !entry.selected)
          .map((entry) => entry.candidate.candidateId),
        adjudicatedAnswers: answered.filter((entry) => entry.adjudicated).length,
        excludedRequests: perCase.reduce(
          (sum, entry) => sum + entry.attempts.length - Number(Boolean(entry.selected)),
          0,
        ),
        costUsd: perCase.reduce(
          (sum, entry) => sum + entry.attempts.reduce((inner, run) => inner + run.costUsd, 0),
          0,
        ),
      };
    };
    const native = summarize(nativeCondition);
    const control = summarize(controlCondition);
    return {
      modelId,
      modelVersion: modelRuns[0]?.modelVersion ?? modelId,
      upstreamProvider: modelRuns[0]?.upstreamProvider,
      native,
      control,
      complete: native.substantiveAnswers === 16 && control.substantiveAnswers === 16,
      observedBelowHalf:
        native.substantiveAnswers === 16 && native.solveRate !== null && native.solveRate < 0.5,
    };
  });
  families.push({
    catalogueId: family.catalogueId,
    planId: family.planId,
    modality: family.modality,
    models,
    complete: models.every((model) => model.complete),
    replicatedBelowHalf: models.every((model) => model.complete && model.observedBelowHalf),
  });
}

if (requireComplete && !families.every((family) => family.complete)) {
  const incomplete = families.filter((family) => !family.complete).map((family) => family.planId);
  throw new Error(`Incomplete external replication: ${incomplete.join(", ")}`);
}

const output = {
  schemaVersion: 1,
  cohortId: "external-replication-v1-2026-09-01",
  generatedAt: uniqueRuns.at(-1)?.evaluatedAt ?? null,
  analysisRole: "Untouched post-confirmatory route replication; never used for generator selection.",
  analysisRule:
    "A family externally replicates only when both untouched routes provide 16 substantive native answers and each observed native solve rate is strictly below 50%. Frozen scorer-pending responses are included only when the answer-key-blind explicit-declaration adjudicator recovers one unambiguous claim; ambiguous responses remain excluded.",
  canonicalCohort: cohort.map((modelId) => ({
    modelId,
    protocolSuffix: canonicalProtocolSuffix.get(modelId),
    canonicalRequests: canonicalRuns.filter((run) => run.modelId === modelId).length,
    substantiveAnswers: canonicalRuns.filter(
      (run) => run.modelId === modelId && run.status === "verified" && !run.emptyResponse,
    ).length,
    costUsd: canonicalRuns
      .filter((run) => run.modelId === modelId)
      .reduce((sum, run) => sum + run.costUsd, 0),
  })),
  audit: {
    allAttemptRequests: uniqueRuns.length,
    canonicalRequests: canonicalRuns.length,
    noncanonicalAttempts: uniqueRuns.length - canonicalRuns.length,
    allAttemptCostUsd: uniqueRuns.reduce((sum, run) => sum + run.costUsd, 0),
    canonicalCostUsd: canonicalRuns.reduce((sum, run) => sum + run.costUsd, 0),
    attemptedModels: [...new Set(uniqueRuns.map((run) => run.modelId))].map((modelId) => ({
      modelId,
      requests: uniqueRuns.filter((run) => run.modelId === modelId).length,
      substantiveAnswers: uniqueRuns.filter(
        (run) => run.modelId === modelId && run.status === "verified" && !run.emptyResponse,
      ).length,
      pendingReview: uniqueRuns.filter((run) => run.modelId === modelId && run.status === "pending-review")
        .length,
      emptyResponses: uniqueRuns.filter((run) => run.modelId === modelId && run.emptyResponse).length,
      costUsd: uniqueRuns.filter((run) => run.modelId === modelId).reduce((sum, run) => sum + run.costUsd, 0),
    })),
  },
  families,
};
for (const [path, value] of [
  ["src/data/external-replication.json", output],
  ["src/data/external-replication-runs.json", uniqueRuns],
  ["public/evidence/external-replication.json", output],
  ["public/evidence/external-replication-runs.json", uniqueRuns],
] as const) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

console.log(
  JSON.stringify({
    requests: uniqueRuns.length,
    canonicalRequests: canonicalRuns.length,
    completeFamilies: families.filter((family) => family.complete).length,
    replicatedBelowHalf: families.filter((family) => family.replicatedBelowHalf).length,
    costUsd: uniqueRuns.reduce((sum, run) => sum + run.costUsd, 0),
  }),
);
