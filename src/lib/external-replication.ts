import rawReplication from "@/data/external-replication.json";
import type { AdmittedFamilyEvidence } from "./admitted-evidence";

export interface ReplicationCondition {
  condition: string;
  plannedCases: number;
  requests: number;
  substantiveAnswers: number;
  correct: number;
  solveRate: number | null;
  lower95: number | null;
  upper95: number | null;
  missingCandidateIds: string[];
  adjudicatedAnswers: number;
  excludedRequests: number;
  costUsd: number;
}

export interface ReplicationModel {
  modelId: string;
  modelVersion: string;
  upstreamProvider?: string;
  native: ReplicationCondition;
  control: ReplicationCondition;
  complete: boolean;
  observedBelowHalf: boolean;
}

export interface ReplicationFamily {
  catalogueId: string;
  planId: string;
  modality: "image" | "video";
  models: ReplicationModel[];
  complete: boolean;
  replicatedBelowHalf: boolean;
}

interface ReplicationDocument {
  schemaVersion: number;
  cohortId: string;
  generatedAt: string | null;
  analysisRole: string;
  analysisRule: string;
  canonicalCohort: Array<{
    modelId: string;
    protocolSuffixes: string[];
    canonicalRequests: number;
    substantiveAnswers: number;
    costUsd: number;
  }>;
  audit: {
    allAttemptRequests: number;
    canonicalRequests: number;
    noncanonicalAttempts: number;
    allAttemptCostUsd: number;
    canonicalCostUsd: number;
    attemptedModels: Array<{
      modelId: string;
      requests: number;
      substantiveAnswers: number;
      pendingReview: number;
      emptyResponses: number;
      costUsd: number;
    }>;
  };
  families: ReplicationFamily[];
}

export const externalReplication = rawReplication as ReplicationDocument;

export function replicationStatus(family: ReplicationFamily) {
  if (!family.complete) return "incomplete" as const;
  return family.replicatedBelowHalf ? ("replicated" as const) : ("did-not-replicate" as const);
}

export function routeExpansionModels(family: AdmittedFamilyEvidence) {
  if (family.expandedModels?.length) return family.expandedModels;
  const frozen = externalReplication.families.find(
    (candidate) => candidate.planId === family.planId && candidate.replicatedBelowHalf,
  );
  return frozen?.models;
}
