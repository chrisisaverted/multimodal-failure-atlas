import type { DiscoveryCandidate, SearchObservation } from "./schema";

export interface ModelAdmissionScore {
  modelId: string;
  requests: number;
  substantiveAnswers: number;
  correct: number;
  incorrect: number;
  noAnswers: number;
  reviewOrErrors: number;
  operationalSolveRate: number;
  substantiveSolveRate: number;
  solveRateWilsonUpper: number;
  evidenceSufficient: boolean;
  observedBelowBar: boolean;
  confidenceBelowBar: boolean;
}

export interface CrossModelCellScore {
  cellId: string;
  models: ModelAdmissionScore[];
  evidenceComplete: boolean;
  observedAdmitted: boolean;
  confidenceAdmitted: boolean;
  worstModelSolveRate: number;
  worstModelWilsonUpper: number;
  noAnswerRate: number;
  rankScore: number;
}

export interface AdmissionPolicy {
  maximumSolveRateExclusive: number;
  minimumSubstantiveAnswersPerModel: number;
  confidenceZ: number;
}

export const frontierAdmissionPolicy: AdmissionPolicy = {
  maximumSolveRateExclusive: 0.5,
  minimumSubstantiveAnswersPerModel: 16,
  confidenceZ: 1.96,
};

export function wilsonUpper(successes: number, trials: number, z = 1.96) {
  if (trials === 0) return 1;
  const proportion = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const centre = proportion + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((proportion * (1 - proportion)) / trials + (z * z) / (4 * trials * trials));
  return Math.min(1, (centre + margin) / denominator);
}

/**
 * Scores the all-model bottleneck rather than pooled failure. Silence cannot
 * make a cell admissible: every target model must supply enough substantive
 * answers, and the easiest model determines the cell's rank.
 */
export function scoreCrossModelCells(
  candidates: Array<Pick<DiscoveryCandidate, "id" | "cellId">>,
  observations: SearchObservation[],
  targetModelIds: string[],
  policy: AdmissionPolicy = frontierAdmissionPolicy,
) {
  const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const cellIds = [...new Set(candidates.map((candidate) => candidate.cellId))];
  return cellIds
    .map((cellId): CrossModelCellScore => {
      const candidateIds = new Set(
        candidates.filter((candidate) => candidate.cellId === cellId).map((candidate) => candidate.id),
      );
      const rows = observations.filter(
        (row) => candidateById.has(row.candidateId) && candidateIds.has(row.candidateId),
      );
      const models = targetModelIds.map((modelId): ModelAdmissionScore => {
        const modelRows = rows.filter((row) => row.modelId === modelId);
        const correct = modelRows.filter((row) => row.outcome === "correct").length;
        const incorrect = modelRows.filter((row) => row.outcome === "incorrect").length;
        const noAnswers = modelRows.filter((row) => row.outcome === "no-answer").length;
        const reviewOrErrors = modelRows.filter(
          (row) => row.outcome === "review" || row.outcome === "error",
        ).length;
        const substantiveAnswers = correct + incorrect;
        const substantiveSolveRate = substantiveAnswers ? correct / substantiveAnswers : 1;
        const evidenceSufficient = substantiveAnswers >= policy.minimumSubstantiveAnswersPerModel;
        const solveRateWilsonUpper = wilsonUpper(correct, substantiveAnswers, policy.confidenceZ);
        return {
          modelId,
          requests: modelRows.length,
          substantiveAnswers,
          correct,
          incorrect,
          noAnswers,
          reviewOrErrors,
          operationalSolveRate: modelRows.length ? correct / modelRows.length : 1,
          substantiveSolveRate,
          solveRateWilsonUpper,
          evidenceSufficient,
          observedBelowBar: evidenceSufficient && substantiveSolveRate < policy.maximumSolveRateExclusive,
          confidenceBelowBar: evidenceSufficient && solveRateWilsonUpper < policy.maximumSolveRateExclusive,
        };
      });
      const evidenceComplete = models.every((model) => model.evidenceSufficient);
      const worstModelSolveRate = Math.max(...models.map((model) => model.substantiveSolveRate));
      const worstModelWilsonUpper = Math.max(...models.map((model) => model.solveRateWilsonUpper));
      const totalNoAnswers = models.reduce((sum, model) => sum + model.noAnswers, 0);
      const totalRequests = models.reduce((sum, model) => sum + model.requests, 0);
      return {
        cellId,
        models,
        evidenceComplete,
        observedAdmitted: evidenceComplete && models.every((model) => model.observedBelowBar),
        confidenceAdmitted: evidenceComplete && models.every((model) => model.confidenceBelowBar),
        worstModelSolveRate,
        worstModelWilsonUpper,
        noAnswerRate: totalRequests ? totalNoAnswers / totalRequests : 0,
        rankScore: evidenceComplete ? 1 - worstModelWilsonUpper : 0,
      };
    })
    .sort(
      (left, right) =>
        right.rankScore - left.rankScore ||
        left.worstModelSolveRate - right.worstModelSolveRate ||
        left.cellId.localeCompare(right.cellId),
    );
}
