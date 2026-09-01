export type Modality = "image" | "video" | "audiovisual" | "multi-image" | "interleaved";

export type PipelineStage =
  | "acquisition"
  | "frame-sampling"
  | "preprocessing"
  | "tokenization"
  | "vision-encoding"
  | "compression"
  | "cross-modal-projection"
  | "context-integration"
  | "object-state-representation"
  | "temporal-memory"
  | "reasoning"
  | "evidence-reliance"
  | "language-decoding"
  | "calibration"
  | "evaluation-artifact";

export type Capability =
  | "detection"
  | "recognition"
  | "localization"
  | "ocr"
  | "counting"
  | "attribute-binding"
  | "spatial-relations"
  | "depth-viewpoint"
  | "comparison"
  | "cross-region-integration"
  | "identity-persistence"
  | "tracking"
  | "brief-event-detection"
  | "event-frequency"
  | "temporal-order"
  | "duration-speed"
  | "state-transitions"
  | "causality"
  | "counterfactual-simulation"
  | "audiovisual-synchronization"
  | "evidence-grounding";

export type EvidenceLevel =
  | "literature-established"
  | "reproduced-here"
  | "behavioral-evidence"
  | "causal-intervention"
  | "representation-evidence"
  | "hypothesis"
  | "speculative";

export type GeneratorKey =
  | "small-object"
  | "patch-phase"
  | "attribute-binding"
  | "numerosity-density"
  | "brief-event"
  | "event-order"
  | "identity-occlusion"
  | "event-counting"
  | "dense-symmetry"
  | "dense-xor"
  | "gated-frequency"
  | "gated-pair-collision"
  | "route-turn-integration"
  | "target-transition-count"
  | "sequential-swap-tracking"
  | "signed-state-accumulation"
  | "parity-verification"
  | "change-localization"
  | "maze-reachability"
  | "rotation-correspondence";

export interface Citation {
  id: string;
  title: string;
  authors: string;
  year: number;
  url: string;
  venue?: string;
  note: string;
  retrieved: string;
}

export interface FailureMode {
  id: string;
  index: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  modalities: Modality[];
  stages: PipelineStage[];
  capabilities: Capability[];
  evidence: EvidenceLevel;
  sourceIds: string[];
  trigger: string;
  symptom: string;
  violatedExpectation: string;
  mechanism: string;
  alternatives: string[];
  disconfirmingTest: string;
  mitigations: string[];
  affectedModels?: string;
  severity: "foundational" | "high" | "moderate";
  reproducibility: "high" | "medium" | "emerging";
  generator?: GeneratorKey;
  accent: "vermillion" | "cobalt" | "citron" | "violet" | "teal";
  featured?: boolean;
}

export interface DiagnosticParams {
  seed: number;
  difficulty: number;
  variant: number;
}

export interface DiagnosticInstance {
  generator: GeneratorKey;
  seed: number;
  question: string;
  answer: string;
  answerOptions?: string[];
  latent: Record<string, string | number | boolean | string[] | number[]>;
  params: DiagnosticParams;
  minimalPairDescription: string;
}

export interface EvaluationRun {
  id: string;
  failureModeId: string;
  provider: string;
  modelId: string;
  modelVersion: string;
  evaluatedAt: string;
  inputCondition: "native-image" | "native-video" | "standardized-frames";
  mediaSha256: string;
  promptSha256: string;
  generatorVersion: string;
  seed: number;
  params: Record<string, string | number | boolean>;
  systemMessage: string;
  prompt: string;
  temperature: number;
  maxOutputTokens: number;
  trial: number;
  rawResponse: string;
  parsedAnswer: string;
  expectedAnswer: string;
  correct: boolean;
  scorer: string;
  latencyMs: number;
  costUsd: number;
  requestId?: string;
  preprocessingNotes: string[];
  status: "verified" | "fixture" | "pending-review";
}
