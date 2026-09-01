import { admittedEvidence, type AdmittedFamilyEvidence } from "@/lib/admitted-evidence";
import { routeExpansionModels } from "@/lib/external-replication";
import { familyResponseShape, responseConcentration } from "@/lib/admitted-analysis";

export type RouteEvidenceStage =
  "core-confirmatory" | "route-expansion-confirmatory" | "replacement-confirmatory";

export function buildFiveRouteEvidence(families: AdmittedFamilyEvidence[] = admittedEvidence.families) {
  const documents = families.map((family) => {
    const expanded = routeExpansionModels(family);
    if (!expanded || expanded.length !== 2)
      throw new Error(`${family.planId} does not have exactly two frozen expansion routes`);
    const expansionStage: RouteEvidenceStage = family.expandedModels?.length
      ? "replacement-confirmatory"
      : "route-expansion-confirmatory";
    const routes = [
      ...family.models.map((model) => ({
        ...model,
        evidenceStage: "core-confirmatory" as const,
        responseShape: responseConcentration(model.native),
      })),
      ...expanded.map((model) => ({
        ...model,
        evidenceStage: expansionStage,
        responseShape: responseConcentration(model.native),
      })),
    ];
    if (routes.length !== 5 || new Set(routes.map((route) => route.modelId)).size !== 5)
      throw new Error(`${family.planId} does not resolve to five unique routes`);
    for (const route of routes) {
      if (
        route.native.substantiveAnswers < 16 ||
        route.native.solveRate === null ||
        route.native.solveRate >= 0.5
      )
        throw new Error(`${family.planId}:${route.modelId} does not satisfy the public five-route gate`);
    }
    return {
      catalogueId: family.catalogueId,
      planId: family.planId,
      modality: family.modality,
      humanSolvability: family.humanSolvability,
      difficultySetting: family.difficultySetting,
      nativeCondition: family.nativeCondition,
      controlCondition: family.controlCondition,
      responseShape: familyResponseShape(family),
      routes,
    };
  });
  return {
    schemaVersion: 2 as const,
    generatedAt: admittedEvidence.generatedAt,
    analysisRole:
      "Machine-readable current-family matrix; route results remain fixed observations of named hosted systems.",
    admissionRule:
      "Every one of five routes has at least 16 substantive native answers and an observed solve rate strictly below 0.5; non-answers never count as failures.",
    families: documents,
  };
}

export const fiveRouteEvidence = buildFiveRouteEvidence();
