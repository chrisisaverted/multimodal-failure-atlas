import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const directory = resolve("evaluation/results");
const files = (await readdir(directory)).filter(
  (name) =>
    (name.startsWith("precision-wire-count-discovery-v1-") ||
      name.startsWith("precision-wire-count-confirmatory-v1-")) &&
    name.endsWith(".jsonl"),
);
const rows = (
  await Promise.all(
    files.map(async (name) =>
      (await readFile(resolve(directory, name), "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
    ),
  )
).flat();
const records = [...new Map(rows.map((record) => [record.id, record])).values()].sort((a, b) =>
  a.evaluatedAt.localeCompare(b.evaluatedAt),
);
const review = JSON.parse(
  await readFile("evaluation/reviews/precision-wire-count-confirmatory-v1.json", "utf8"),
) as { decisions: Array<{ runId: string; decision: "correct" | "incorrect" }> };
const reviewedCorrect = new Set(
  review.decisions.filter((item) => item.decision === "correct").map((item) => item.runId),
);

function condition(record: EvaluationRunRecord) {
  return (
    record.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? "native-image"
  );
}
function aggregate(selected: EvaluationRunRecord[]) {
  const verified = selected.filter((record) => record.status === "verified" && !record.emptyResponse);
  const adjudicatedCorrect = selected.filter((record) => reviewedCorrect.has(record.id)).length;
  return {
    requests: selected.length,
    substantiveAnswers:
      verified.length +
      selected.filter((record) => reviewedCorrect.has(record.id) && record.status !== "verified").length,
    automaticCorrect: verified.filter((record) => record.correct).length,
    adjudicatedCorrect: verified.filter((record) => record.correct).length + adjudicatedCorrect,
    pendingReview: selected.filter(
      (record) => record.status === "pending-review" && !reviewedCorrect.has(record.id),
    ).length,
    costUsd: selected.reduce((sum, record) => sum + record.costUsd, 0),
  };
}
const confirmatory = records.filter(
  (record) => record.evaluationPlanId === "precision-wire-count-confirmatory-v1",
);
const models = [...new Set(confirmatory.map((record) => record.modelId))].sort().map((modelId) => {
  const modelRows = confirmatory.filter((record) => record.modelId === modelId);
  return {
    modelId,
    reasoningEffort: modelRows[0]?.reasoningEffort ?? "provider-default",
    native: aggregate(modelRows.filter((record) => condition(record) === "native-image")),
    oracle: aggregate(modelRows.filter((record) => condition(record) === "oracle-highlighted-numbered-path")),
  };
});
const summary = {
  id: "precision-wire-count-confirmatory-v1",
  evidenceStatus: "frozen-confirmatory-holdout-passed-three-routes",
  generatorVersion: "wire-crossing-count-v2-precision",
  difficultySetting: { totalCrossings: 40, exactAnswerOptions: [7, 8, 9, 10] },
  admission: {
    everyModelSubstantiveSolveRateBelow: 0.5,
    oracleTarget: 0.75,
    passed: models.every(
      (model) =>
        model.native.adjudicatedCorrect / model.native.substantiveAnswers < 0.5 &&
        model.oracle.adjudicatedCorrect / model.oracle.substantiveAnswers >= 0.75,
    ),
  },
  humanSolvability: "unverified",
  models,
  discovery: aggregate(
    records.filter((record) => record.evaluationPlanId === "precision-wire-count-discovery-v1"),
  ),
  confirmatory: aggregate(confirmatory),
  totalCostUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
  resultFiles: files.sort(),
  reviewFile: "evaluation/reviews/precision-wire-count-confirmatory-v1.json",
};
await writeFile("src/data/precision-wire-runs.json", `${JSON.stringify(records, null, 2)}\n`);
await writeFile("src/data/precision-wire-summary.json", `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
