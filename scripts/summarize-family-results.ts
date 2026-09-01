import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { adjudicateExplicitDeclaration } from "../src/lib/evaluation/adjudication";
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
        answerOptions: z.array(z.string()),
        expectedAnswer: z.string(),
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
const candidateForRun = (run: z.infer<typeof evaluationRunSchema>) =>
  manifest.cases.find((candidate) => candidate.seed === run.seed && candidate.condition === conditionOf(run));
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
      const bySeed = new Map<number, typeof selected>();
      for (const run of selected) bySeed.set(run.seed, [...(bySeed.get(run.seed) ?? []), run]);
      const substantive = [...bySeed.values()].flatMap((attempts) => {
        const verified = attempts.filter((run) => run.status === "verified" && !run.emptyResponse);
        if (verified.length > 1)
          throw new Error(`${modelId}: duplicate substantive answers for seed ${attempts[0]?.seed}`);
        if (verified.length === 1)
          return [
            {
              run: verified[0]!,
              answer: verified[0]!.parsedAnswer,
              correct: verified[0]!.correct,
              adjudicated: false,
            },
          ];
        const adjudicated = attempts.flatMap((run) => {
          if (run.status !== "pending-review" || run.emptyResponse || run.finishReason !== "stop") return [];
          const candidate = candidateForRun(run);
          if (!candidate) throw new Error(`Missing manifest candidate for seed ${run.seed}`);
          const decision = adjudicateExplicitDeclaration(run.rawResponse, candidate.answerOptions);
          return decision
            ? [
                {
                  run,
                  answer: decision.claimedAnswer,
                  correct: decision.claimedAnswer === candidate.expectedAnswer,
                  adjudicated: true,
                },
              ]
            : [];
        });
        if (adjudicated.length > 1)
          throw new Error(`${modelId}: duplicate adjudicable answers for seed ${attempts[0]?.seed}`);
        return adjudicated;
      });
      const answerDistribution = Object.fromEntries(
        [...new Set(substantive.map(({ answer }) => answer))]
          .sort()
          .map((answer) => [answer, substantive.filter((entry) => entry.answer === answer).length]),
      );
      const adjudicatedRunIds = new Set(
        substantive.filter((entry) => entry.adjudicated).map((entry) => entry.run.id),
      );
      return {
        cellId,
        condition,
        requests: selected.length,
        substantiveAnswers: substantive.length,
        correct: substantive.filter((entry) => entry.correct).length,
        solveRate: substantive.length
          ? substantive.filter((entry) => entry.correct).length / substantive.length
          : null,
        adjudicatedAnswers: substantive.filter((entry) => entry.adjudicated).length,
        answerDistribution,
        excludedRequests: selected.length - substantive.length,
        noAnswer: selected.filter((run) => run.emptyResponse).length,
        pendingReview: selected.filter(
          (run) => run.status === "pending-review" && !adjudicatedRunIds.has(run.id),
        ).length,
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
