import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const cohort = ["bytedance-seed/seed-2-1-turbo", "xiaomi/mimo-v2.5"] as const;
const requireComplete = process.argv.includes("--require-complete");
const evidence = z
  .object({
    families: z.array(z.object({ catalogueId: z.string(), planId: z.string(), modality: z.string() })),
  })
  .parse(JSON.parse(await readFile(resolve("src/data/admitted-families.json"), "utf8")));
const manifestSchema = z.object({
  cases: z.array(z.object({ candidateId: z.string(), seed: z.number().int(), condition: z.string() })),
});

function conditionOf(run: EvaluationRunRecord) {
  return (
    run.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? run.inputCondition
  );
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
const canonicalProtocolSuffix = new Map([
  ["bytedance-seed/seed-2-1-turbo", "external-replication-v1-no-reasoning"],
  ["xiaomi/mimo-v2.5", "external-replication-v1-mimo-declared-answer"],
]);

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
        const substantive = attempts.filter((run) => run.status === "verified" && !run.emptyResponse);
        if (substantive.length > 1) {
          throw new Error(`${family.planId}: duplicate substantive ${modelId} ${candidate.candidateId}`);
        }
        return { candidate, attempts, substantive: substantive[0] };
      });
      const answered = perCase.flatMap((entry) => entry.substantive ?? []);
      const correct = answered.filter((run) => run.correct).length;
      return {
        condition,
        plannedCases: cases.length,
        requests: perCase.reduce((sum, entry) => sum + entry.attempts.length, 0),
        substantiveAnswers: answered.length,
        correct,
        solveRate: answered.length ? correct / answered.length : null,
        missingCandidateIds: perCase
          .filter((entry) => !entry.substantive)
          .map((entry) => entry.candidate.candidateId),
        excludedRequests: perCase.reduce(
          (sum, entry) => sum + entry.attempts.length - Number(Boolean(entry.substantive)),
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
    replicatedBelowHalf: models.every((model) => model.observedBelowHalf),
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
  families,
};
for (const [path, value] of [
  ["src/data/external-replication.json", output],
  ["src/data/external-replication-runs.json", uniqueRuns],
] as const) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

console.log(
  JSON.stringify({
    requests: uniqueRuns.length,
    completeFamilies: families.filter((family) => family.complete).length,
    replicatedBelowHalf: families.filter((family) => family.replicatedBelowHalf).length,
    costUsd: uniqueRuns.reduce((sum, run) => sum + run.costUsd, 0),
  }),
);
