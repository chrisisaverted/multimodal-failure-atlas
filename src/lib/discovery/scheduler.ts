import type { DiscoveryCandidate } from "./schema";

export interface ScheduledCall {
  candidateId: string;
  modelId: string;
  maximumEstimatedCostUsd: number;
}

export function scheduleBudgetedRound(options: {
  candidates: DiscoveryCandidate[];
  modelIds: string[];
  maximumEstimatedCostPerCallUsd: number;
  budgetUsd: number;
}) {
  if (options.budgetUsd < 0 || options.maximumEstimatedCostPerCallUsd < 0) {
    throw new Error("Discovery budgets must be non-negative.");
  }
  const calls: ScheduledCall[] = [];
  let committed = 0;
  for (const candidate of options.candidates) {
    for (const modelId of options.modelIds) {
      const next = committed + options.maximumEstimatedCostPerCallUsd;
      if (next > options.budgetUsd + Number.EPSILON) return calls;
      calls.push({
        candidateId: candidate.id,
        modelId,
        maximumEstimatedCostUsd: options.maximumEstimatedCostPerCallUsd,
      });
      committed = next;
    }
  }
  return calls;
}
