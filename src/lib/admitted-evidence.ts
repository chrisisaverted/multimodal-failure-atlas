import rawEvidence from "@/data/admitted-families.json";
import rawRuns from "@/data/admitted-runs.json";

export interface ConditionSummary {
  condition: string;
  requests: number;
  substantiveAnswers: number;
  adjudicatedAnswers?: number;
  correct: number;
  solveRate: number | null;
  lower95: number | null;
  upper95: number | null;
  pendingReview: number;
  emptyResponses: number;
  costUsd: number;
}

export interface AdmittedFamilyEvidence {
  catalogueId: string;
  planId: string;
  planSha256: string;
  generatorVersion: string;
  renderer: string;
  modality: "image" | "video";
  nativeCondition: string;
  controlCondition: string;
  admitted: boolean;
  humanSolvability: string;
  difficultySetting: {
    values: number[];
    label: string;
    nativeCases: number;
  };
  sample: {
    candidateId: string;
    seed: number;
    artifactPath: string;
    mimeType: "image/png" | "video/mp4";
    question: string;
    answerOptions: string[];
    expectedAnswer: string;
    difficulty: number;
  };
  models: Array<{
    modelId: string;
    modelVersion: string;
    upstreamProvider?: string;
    native: ConditionSummary;
    control: ConditionSummary;
  }>;
  expandedModels?: Array<{
    modelId: string;
    modelVersion: string;
    upstreamProvider?: string;
    native: ConditionSummary;
    control: ConditionSummary;
  }>;
}

interface AdmittedEvidenceDocument {
  schemaVersion: number;
  generatedAt: string;
  admissionRule: string;
  families: AdmittedFamilyEvidence[];
}

export const admittedEvidence = rawEvidence as AdmittedEvidenceDocument;
export const admittedRunCount = rawRuns.length;
export const admittedFamilyByCatalogueId = new Map(
  admittedEvidence.families.map((family) => [family.catalogueId, family]),
);
export const catalogueIdByPlan = new Map(
  admittedEvidence.families.map((family) => [family.planId, family.catalogueId]),
);
