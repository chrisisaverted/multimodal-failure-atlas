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

export function orderByUniversalHardness(families: AdmittedFamilyEvidence[]) {
  return [...families].sort((left, right) => {
    const easiestDifference = (easiestRouteRate(left) ?? 1) - (easiestRouteRate(right) ?? 1);
    if (easiestDifference) return easiestDifference;
    const pooledDifference = (pooledNativeRate(left) ?? 1) - (pooledNativeRate(right) ?? 1);
    return pooledDifference || left.catalogueId.localeCompare(right.catalogueId);
  });
}
