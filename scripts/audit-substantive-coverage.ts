import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";

const manifestPath = process.argv[2];
const modelId = process.argv[3];
const resultPaths = process.argv.slice(4);
if (!manifestPath || !modelId || !resultPaths.length)
  throw new Error("Usage: tsx scripts/audit-substantive-coverage.ts <manifest> <model-id> <results...>");
const manifest = z
  .object({
    cases: z.array(z.object({ candidateId: z.string(), seed: z.number().int(), condition: z.string() })),
  })
  .parse(JSON.parse(await readFile(resolve(manifestPath), "utf8")));
const runs = (
  await Promise.all(
    resultPaths.map(async (path) =>
      (await readFile(resolve(path), "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
    ),
  )
)
  .flat()
  .filter((run) => run.modelId === modelId);
const conditionOf = (run: z.infer<typeof evaluationRunSchema>) =>
  run.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? run.inputCondition;
const coverage = manifest.cases.map((candidate, index) => {
  const selected = runs.filter(
    (run) => run.seed === candidate.seed && conditionOf(run) === candidate.condition,
  );
  const substantive = selected.filter((run) => run.status === "verified" && !run.emptyResponse);
  return {
    index,
    candidateId: candidate.candidateId,
    seed: candidate.seed,
    condition: candidate.condition,
    requests: selected.length,
    substantiveAnswers: substantive.length,
    correct: substantive.filter((run) => run.correct).length,
    pendingReview: selected.filter((run) => run.status === "pending-review").length,
  };
});
console.log(
  JSON.stringify(
    {
      modelId,
      cases: coverage.length,
      missing: coverage.filter((entry) => entry.substantiveAnswers === 0),
      duplicates: coverage.filter((entry) => entry.substantiveAnswers > 1),
      complete: coverage.every((entry) => entry.substantiveAnswers === 1),
    },
    null,
    2,
  ),
);
