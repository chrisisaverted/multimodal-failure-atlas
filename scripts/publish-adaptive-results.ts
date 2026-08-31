import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const resultsDirectory = resolve("evaluation/results");
const files = (await readdir(resultsDirectory)).filter(
  (name) =>
    (name.startsWith("lattice-counting-discovery-v1") ||
      name.startsWith("lattice-counting-confirmatory-v1")) &&
    name.endsWith(".jsonl"),
);
const parsed = (
  await Promise.all(
    files.map(async (name) =>
      (await readFile(resolve(resultsDirectory, name), "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
    ),
  )
).flat();
const records = [...new Map(parsed.map((record) => [record.id, record])).values()].sort((left, right) =>
  left.evaluatedAt.localeCompare(right.evaluatedAt),
);

const ranking = z
  .object({
    id: z.string(),
    totalCostUsd: z.number(),
    selectionRule: z.string(),
    cells: z.array(
      z.object({
        cellId: z.string(),
        rankScore: z.number(),
        substantiveFailureRate: z.number(),
        failureWilsonLowerBound: z.number(),
        noAnswerRate: z.number(),
        scoredAnswers: z.number(),
        incorrectAnswers: z.number(),
        distinctModels: z.number(),
        parameters: z.object({
          flashDurationMs: z.number(),
          intervalMs: z.number(),
          phaseMs: z.number(),
        }),
      }),
    ),
  })
  .parse(
    JSON.parse(await readFile(resolve("evaluation/discovery/lattice-counting-ranking-v1.json"), "utf8")),
  );

function condition(record: EvaluationRunRecord) {
  const note = record.preprocessingNotes.find((entry) => entry.startsWith("Condition: "));
  return note?.slice("Condition: ".length) ?? "native-1x";
}

function aggregate(rows: EvaluationRunRecord[]) {
  const substantive = rows.filter((record) => !record.emptyResponse && record.status === "verified");
  return {
    requests: rows.length,
    substantiveAnswers: substantive.length,
    correct: substantive.filter((record) => record.correct).length,
    incorrect: substantive.filter((record) => !record.correct).length,
    noAnswer: rows.filter((record) => record.emptyResponse).length,
    pendingReview: rows.filter((record) => record.status === "pending-review").length,
    costUsd: rows.reduce((sum, record) => sum + record.costUsd, 0),
  };
}

function byModel(rows: EvaluationRunRecord[]) {
  return [...new Set(rows.map((record) => record.modelId))]
    .sort()
    .map((modelId) => ({ modelId, ...aggregate(rows.filter((record) => record.modelId === modelId)) }));
}

const discovery = records.filter((record) => record.evaluationPlanId === "lattice-counting-discovery-v1");
const confirmatory = records.filter(
  (record) => record.evaluationPlanId === "lattice-counting-confirmatory-v1",
);
const native = confirmatory.filter((record) => condition(record) === "native-1x");
const slowed = confirmatory.filter((record) => condition(record) === "slow-motion-4x");
const paired = new Map<string, Partial<Record<"native-1x" | "slow-motion-4x", EvaluationRunRecord>>>();
for (const record of confirmatory) {
  const key = `${record.modelId}:${record.seed}`;
  const entry = paired.get(key) ?? {};
  entry[condition(record) as "native-1x" | "slow-motion-4x"] = record;
  paired.set(key, entry);
}
const completePairs = [...paired.values()].filter((entry) => entry["native-1x"] && entry["slow-motion-4x"]);
const recovered = completePairs.filter((entry) => {
  const source = entry["native-1x"]!;
  const slow = entry["slow-motion-4x"]!;
  return !source.emptyResponse && !source.correct && !slow.emptyResponse && slow.correct;
});

const summary = {
  id: "adaptive-lattice-counting-v1",
  generatedAt: records.at(-1)?.evaluatedAt ?? "",
  evidenceStatus: "discovery-plus-frozen-confirmatory-holdout",
  humanSolvability: "unverified",
  discovery: { ...aggregate(discovery), models: byModel(discovery) },
  selectedCells: ranking.cells.slice(0, 2),
  selectionRule: ranking.selectionRule,
  confirmatory: {
    ...aggregate(confirmatory),
    models: byModel(confirmatory),
    native: aggregate(native),
    slowMotion4x: aggregate(slowed),
    completePairs: completePairs.length,
    nativeFailureRecoveredBySlowMotion: recovered.length,
  },
  resultFiles: files.sort(),
};

await writeFile(resolve("src/data/adaptive-runs.json"), `${JSON.stringify(records, null, 2)}\n`);
await writeFile(resolve("src/data/adaptive-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
