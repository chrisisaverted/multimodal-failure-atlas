import type { EvaluationRunRecord } from "./schema";

export interface AccuracySummary {
  n: number;
  correct: number;
  accuracy: number;
  lower95: number;
  upper95: number;
  parseFailures: number;
  totalCostUsd: number;
}

export function summarizeRuns(records: EvaluationRunRecord[]): AccuracySummary {
  const scored = records.filter((record) => record.status === "verified");
  const n = scored.length;
  const correct = scored.filter((record) => record.correct).length;
  if (n === 0) {
    return {
      n: 0,
      correct: 0,
      accuracy: 0,
      lower95: 0,
      upper95: 0,
      parseFailures: records.filter((record) => record.status === "pending-review").length,
      totalCostUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
    };
  }
  const z = 1.959963984540054;
  const p = correct / n;
  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denominator;
  return {
    n,
    correct,
    accuracy: p,
    lower95: Math.max(0, centre - margin),
    upper95: Math.min(1, centre + margin),
    parseFailures: records.filter((record) => record.status === "pending-review").length,
    totalCostUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
  };
}
