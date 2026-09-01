import rawRuns from "@/data/published-runs.json";
import adaptiveRuns from "@/data/adaptive-runs.json";
import precisionWireRuns from "@/data/precision-wire-runs.json";
import { evaluationRunSchema, type EvaluationRunRecord } from "./evaluation/schema";
import { summarizeRuns } from "./evaluation/statistics";

export const publishedRuns: EvaluationRunRecord[] = [
  ...new Map(
    [...rawRuns, ...adaptiveRuns, ...precisionWireRuns].map((run) => {
      const parsed = evaluationRunSchema.parse(run);
      return [parsed.id, parsed] as const;
    }),
  ).values(),
];

export function runsForFailure(failureModeId: string) {
  if (failureModeId === "identity-conditioned-exact-counting") {
    return publishedRuns.filter(
      (run) => run.evaluationPlanId === "precision-wire-count-confirmatory-v1",
    );
  }
  return publishedRuns.filter((run) => run.failureModeId === failureModeId);
}

export function groupRunSummaries(records: EvaluationRunRecord[]) {
  const groups = new Map<string, EvaluationRunRecord[]>();
  for (const record of records) {
    const key = `${record.provider}::${record.upstreamProvider ?? "direct"}::${record.modelVersion}::${record.inputCondition}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.entries()].map(([key, runs]) => {
    const [provider, upstreamProvider, modelVersion, inputCondition] = key.split("::");
    return {
      provider: provider!,
      upstreamProvider: upstreamProvider!,
      modelVersion: modelVersion!,
      inputCondition: inputCondition!,
      runs,
      ...summarizeRuns(runs),
    };
  });
}
