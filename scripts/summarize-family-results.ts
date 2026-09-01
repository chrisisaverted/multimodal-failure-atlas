import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";

const manifestPath = resolve(process.argv[2] ?? "");
const resultPaths = process.argv.slice(3).map((path) => resolve(path));
if (!process.argv[2] || !resultPaths.length) {
  throw new Error(
    "Usage: tsx scripts/summarize-family-results.ts <manifest.json> <model-a.jsonl> [model-b.jsonl ...]",
  );
}

const manifest = z
  .object({
    id: z.string(),
    cases: z.array(
      z.object({
        candidateId: z.string(),
        cellId: z.string(),
        condition: z.string(),
        seed: z.number().int(),
      }),
    ),
  })
  .parse(JSON.parse(await readFile(manifestPath, "utf8")));
const modelRuns = await Promise.all(
  resultPaths.map(async (path) => ({
    path,
    runs: (await readFile(path, "utf8"))
      .split("\n")
      .filter(Boolean)
      .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
  })),
);

const conditionOf = (run: z.infer<typeof evaluationRunSchema>) =>
  run.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? run.inputCondition;
const cellForRun = (run: z.infer<typeof evaluationRunSchema>) =>
  manifest.cases.find((candidate) => candidate.seed === run.seed && candidate.condition === conditionOf(run))
    ?.cellId;
const cells = [...new Set(manifest.cases.map((candidate) => candidate.cellId))];
const conditions = [...new Set(manifest.cases.map((candidate) => candidate.condition))];

const groupedRuns = new Map<string, { paths: string[]; runs: (typeof modelRuns)[number]["runs"] }>();
for (const { path, runs } of modelRuns) {
  const modelId = runs[0]?.modelId ?? path;
  const existing = groupedRuns.get(modelId) ?? { paths: [], runs: [] };
  existing.paths.push(path);
  existing.runs.push(...runs);
  groupedRuns.set(modelId, existing);
}

const models = [...groupedRuns.entries()].map(([modelId, { paths, runs: rawRuns }]) => {
  const runs = [...new Map(rawRuns.map((run) => [run.id, run])).values()];
  const summaries = cells.flatMap((cellId) =>
    conditions.map((condition) => {
      const selected = runs.filter((run) => cellForRun(run) === cellId && conditionOf(run) === condition);
      const substantive = selected.filter((run) => run.status === "verified" && !run.emptyResponse);
      return {
        cellId,
        condition,
        requests: selected.length,
        substantiveAnswers: substantive.length,
        correct: substantive.filter((run) => run.correct).length,
        solveRate: substantive.length
          ? substantive.filter((run) => run.correct).length / substantive.length
          : null,
        noAnswer: selected.filter((run) => run.emptyResponse).length,
        pendingReview: selected.filter((run) => run.status === "pending-review").length,
        costUsd: selected.reduce((sum, run) => sum + run.costUsd, 0),
      };
    }),
  );
  return { modelId, paths, summaries };
});

const nativeCondition = conditions.find((condition) => condition.startsWith("native"));
const admissionByCell = cells.map((cellId) => {
  const rows = models.map((model) =>
    model.summaries.find((summary) => summary.cellId === cellId && summary.condition === nativeCondition),
  );
  return {
    cellId,
    nativeCondition,
    observedEveryModelBelowHalf:
      Boolean(nativeCondition) &&
      rows.every(
        (row) => row && row.substantiveAnswers >= 16 && row.solveRate !== null && row.solveRate < 0.5,
      ),
  };
});

console.log(JSON.stringify({ manifestId: manifest.id, models, admissionByCell }, null, 2));
