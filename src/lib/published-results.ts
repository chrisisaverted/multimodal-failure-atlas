import rawRuns from "@/data/published-runs.json";
import { evaluationRunSchema, type EvaluationRunRecord } from "./evaluation/schema";
import { summarizeRuns } from "./evaluation/statistics";

export const publishedRuns: EvaluationRunRecord[] = rawRuns.map((run) => evaluationRunSchema.parse(run));

export function runsForFailure(failureModeId: string) {
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
