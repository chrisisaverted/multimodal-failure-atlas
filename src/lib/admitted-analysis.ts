import type { AdmittedFamilyEvidence } from "./admitted-evidence";
import { routeExpansionModels } from "./external-replication";

export function conditionRate(condition: { substantiveAnswers: number; correct: number }) {
  return condition.substantiveAnswers ? condition.correct / condition.substantiveAnswers : null;
}

export function currentFamilyRoutes(family: AdmittedFamilyEvidence) {
  return [...family.models, ...(routeExpansionModels(family) ?? [])];
}

export function easiestRouteRate(family: AdmittedFamilyEvidence) {
  const rates = currentFamilyRoutes(family).flatMap((model) => {
    const rate = conditionRate(model.native);
    return rate === null ? [] : [rate];
  });
  return rates.length ? Math.max(...rates) : null;
}

export function pooledNativeRate(family: AdmittedFamilyEvidence) {
  const routes = currentFamilyRoutes(family);
  const correct = routes.reduce((sum, model) => sum + model.native.correct, 0);
  const total = routes.reduce((sum, model) => sum + model.native.substantiveAnswers, 0);
  return total ? correct / total : null;
}

export function weakestControlRate(family: AdmittedFamilyEvidence) {
  const rates = currentFamilyRoutes(family).flatMap((model) => {
    const rate = conditionRate(model.control);
    return rate === null ? [] : [rate];
  });
  return rates.length ? Math.min(...rates) : null;
}

export function controlRecoveryInterpretation(family: AdmittedFamilyEvidence) {
  const rate = weakestControlRate(family);
  if (rate === null) return { rate, level: "unmeasured" as const };
  if (rate >= 0.75) return { rate, level: "strong" as const };
  if (rate >= 0.5) return { rate, level: "partial" as const };
  return { rate, level: "inconclusive" as const };
}

export function responseConcentration(
  condition: { substantiveAnswers: number; answerDistribution?: Record<string, number> },
  optionCount = 4,
) {
  const entries = Object.entries(condition.answerDistribution ?? {});
  if (!entries.length || condition.substantiveAnswers <= 0) return null;
  const distributedAnswers = entries.reduce((sum, [, count]) => sum + count, 0);
  if (distributedAnswers !== condition.substantiveAnswers)
    throw new Error(
      `Answer distribution covers ${distributedAnswers}/${condition.substantiveAnswers} substantive answers`,
    );
  const [modalAnswer, modalCount] = [...entries].sort(
    ([leftAnswer, leftCount], [rightAnswer, rightCount]) =>
      rightCount - leftCount || leftAnswer.localeCompare(rightAnswer),
  )[0]!;
  const entropy = entries.reduce((sum, [, count]) => {
    const probability = count / distributedAnswers;
    return sum - probability * Math.log2(probability);
  }, 0);
  return {
    modalAnswer,
    modalCount,
    modalShare: modalCount / distributedAnswers,
    observedSupport: entries.length,
    normalizedEntropy: optionCount > 1 ? entropy / Math.log2(optionCount) : 0,
  };
}

export function familyResponseShape(family: AdmittedFamilyEvidence) {
  const routes = currentFamilyRoutes(family).map((route) => {
    const concentration = responseConcentration(route.native);
    if (!concentration)
      throw new Error(`${family.planId}:${route.modelId} has no native answer distribution`);
    return { modelId: route.modelId, ...concentration };
  });
  return {
    routes,
    concentratedRoutes: routes.filter((route) => route.modalShare >= 0.75).length,
    meanModalShare: routes.reduce((sum, route) => sum + route.modalShare, 0) / routes.length,
    meanNormalizedEntropy: routes.reduce((sum, route) => sum + route.normalizedEntropy, 0) / routes.length,
  };
}

export function orderByUniversalHardness(families: AdmittedFamilyEvidence[]) {
  return [...families].sort((left, right) => {
    const easiestDifference = (easiestRouteRate(left) ?? 1) - (easiestRouteRate(right) ?? 1);
    if (easiestDifference) return easiestDifference;
    const pooledDifference = (pooledNativeRate(left) ?? 1) - (pooledNativeRate(right) ?? 1);
    return pooledDifference || left.catalogueId.localeCompare(right.catalogueId);
  });
}
