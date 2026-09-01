import type { AdmittedFamilyEvidence, ConditionSummary } from "./admitted-evidence";

export function conditionRate(condition: ConditionSummary) {
  return condition.substantiveAnswers ? condition.correct / condition.substantiveAnswers : null;
}

export function easiestRouteRate(family: AdmittedFamilyEvidence) {
  const rates = family.models.flatMap((model) => {
    const rate = conditionRate(model.native);
    return rate === null ? [] : [rate];
  });
  return rates.length ? Math.max(...rates) : null;
}

export function pooledNativeRate(family: AdmittedFamilyEvidence) {
  const correct = family.models.reduce((sum, model) => sum + model.native.correct, 0);
  const total = family.models.reduce((sum, model) => sum + model.native.substantiveAnswers, 0);
  return total ? correct / total : null;
}

export function weakestControlRate(family: AdmittedFamilyEvidence) {
  const rates = family.models.flatMap((model) => {
    const rate = conditionRate(model.control);
    return rate === null ? [] : [rate];
  });
  return rates.length ? Math.min(...rates) : null;
}

export function orderByUniversalHardness(families: AdmittedFamilyEvidence[]) {
  return [...families].sort((left, right) => {
    const easiestDifference = (easiestRouteRate(left) ?? 1) - (easiestRouteRate(right) ?? 1);
    if (easiestDifference) return easiestDifference;
    const pooledDifference = (pooledNativeRate(left) ?? 1) - (pooledNativeRate(right) ?? 1);
    return pooledDifference || left.catalogueId.localeCompare(right.catalogueId);
  });
}
