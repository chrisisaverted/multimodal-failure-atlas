import type { DiscoveryCandidate, SearchObservation } from "./schema";

export interface CellScore {
  cellId: string;
  candidateCount: number;
  observations: number;
  scoredAnswers: number;
  incorrectAnswers: number;
  noAnswers: number;
  reviewOrErrors: number;
  distinctModels: number;
  substantiveFailureRate: number;
  failureWilsonLowerBound: number;
  noAnswerRate: number;
  costUsd: number;
  rankScore: number;
}

function wilsonLower(successes: number, trials: number, z = 1.96) {
  if (trials === 0) return 0;
  const proportion = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const centre = proportion + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((proportion * (1 - proportion)) / trials + (z * z) / (4 * trials * trials));
  return Math.max(0, (centre - margin) / denominator);
}

export function scoreCells(
  candidates: DiscoveryCandidate[],
  observations: SearchObservation[],
  expectedModels: number,
) {
  const candidatesById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const grouped = new Map<string, { candidates: Set<string>; rows: SearchObservation[] }>();
  for (const candidate of candidates) {
    const group = grouped.get(candidate.cellId) ?? { candidates: new Set(), rows: [] };
    group.candidates.add(candidate.id);
    grouped.set(candidate.cellId, group);
  }
  for (const observation of observations) {
    const candidate = candidatesById.get(observation.candidateId);
    if (!candidate) continue;
    grouped.get(candidate.cellId)!.rows.push(observation);
  }

  return [...grouped.entries()]
    .map(([cellId, group]): CellScore => {
      const scored = group.rows.filter((row) => row.outcome === "correct" || row.outcome === "incorrect");
      const incorrect = scored.filter((row) => row.outcome === "incorrect").length;
      const noAnswers = group.rows.filter((row) => row.outcome === "no-answer").length;
      const reviewOrErrors = group.rows.filter(
        (row) => row.outcome === "review" || row.outcome === "error",
      ).length;
      const distinctModels = new Set(scored.map((row) => row.modelId)).size;
      const modelCoverage = expectedModels > 0 ? Math.min(1, distinctModels / expectedModels) : 0;
      const lowerBound = wilsonLower(incorrect, scored.length);
      const costUsd = group.rows.reduce((sum, row) => sum + row.costUsd, 0);
      return {
        cellId,
        candidateCount: group.candidates.size,
        observations: group.rows.length,
        scoredAnswers: scored.length,
        incorrectAnswers: incorrect,
        noAnswers,
        reviewOrErrors,
        distinctModels,
        substantiveFailureRate: scored.length ? incorrect / scored.length : 0,
        failureWilsonLowerBound: lowerBound,
        noAnswerRate: group.rows.length ? noAnswers / group.rows.length : 0,
        costUsd,
        // Silence never increases hardness. Coverage and a conservative confidence bound do.
        rankScore: lowerBound * modelCoverage,
      };
    })
    .sort((left, right) => right.rankScore - left.rankScore || left.cellId.localeCompare(right.cellId));
}
