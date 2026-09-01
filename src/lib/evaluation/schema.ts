import { z } from "zod";

export const evaluationRequestSchema = z.object({
  provider: z.enum(["fixture", "gemini", "openrouter", "kimi", "qwen-local", "glm"]),
  modelId: z.string().min(1).max(120),
  failureModeId: z.string().min(1).max(120),
  generator: z.enum([
    "small-object",
    "patch-phase",
    "attribute-binding",
    "numerosity-density",
    "brief-event",
    "event-order",
    "identity-occlusion",
    "event-counting",
  ]),
  seed: z.number().int().nonnegative(),
  difficulty: z.number().min(0).max(100),
  variant: z.number().int().min(0).max(1000),
  inputCondition: z.enum(["native-image", "native-video", "standardized-frames"]),
  estimatedCostUsd: z.number().nonnegative(),
  systemMessage: z.string().min(1).max(4000),
  prompt: z.string().min(1).max(12000),
  temperature: z.number().min(0).max(2).default(0),
  maxOutputTokens: z.number().int().min(1).max(16384).default(64),
  trial: z.number().int().positive().default(1),
  reasoningEffort: z.enum(["none", "minimal", "low", "medium", "high"]).optional(),
  excludeReasoning: z.boolean().optional(),
  routingProvider: z.string().min(1).max(120).optional(),
  allowProviderFallbacks: z.boolean().optional(),
  dataCollection: z.enum(["allow", "deny"]).optional(),
});

export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;

export const evaluationRunSchema = z.object({
  id: z.string(),
  failureModeId: z.string(),
  provider: z.string(),
  modelId: z.string(),
  modelVersion: z.string(),
  evaluatedAt: z.string().datetime(),
  inputCondition: z.enum(["native-image", "native-video", "standardized-frames"]),
  mediaSha256: z.string().regex(/^[a-f0-9]{64}$/),
  promptSha256: z.string().regex(/^[a-f0-9]{64}$/),
  generatorVersion: z.string(),
  seed: z.number().int(),
  params: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  systemMessage: z.string(),
  prompt: z.string(),
  temperature: z.number(),
  maxOutputTokens: z.number().int().positive(),
  trial: z.number().int().positive(),
  reasoningEffort: z.enum(["none", "minimal", "low", "medium", "high"]).optional(),
  excludeReasoning: z.boolean().optional(),
  rawResponse: z.string(),
  parsedAnswer: z.string(),
  expectedAnswer: z.string(),
  correct: z.boolean(),
  scorer: z.string(),
  latencyMs: z.number().nonnegative(),
  costUsd: z.number().nonnegative(),
  costBasis: z.enum(["estimated", "reported"]).optional(),
  requestId: z.string().optional(),
  upstreamProvider: z.string().optional(),
  systemFingerprint: z.string().optional(),
  finishReason: z.string().optional(),
  emptyResponse: z.boolean().optional(),
  usage: z
    .object({
      promptTokens: z.number().int().nonnegative().optional(),
      completionTokens: z.number().int().nonnegative().optional(),
      reasoningTokens: z.number().int().nonnegative().optional(),
      totalTokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
  routingProvider: z.string().optional(),
  allowProviderFallbacks: z.boolean().optional(),
  dataCollection: z.enum(["allow", "deny"]).optional(),
  artifactPath: z.string().optional(),
  evaluationPlanId: z.string().optional(),
  evaluationPlanSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  evaluationProtocolId: z.string().optional(),
  evaluationProtocolSha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  preprocessingNotes: z.array(z.string()),
  status: z.enum(["verified", "fixture", "pending-review"]),
});

export type EvaluationRunRecord = z.infer<typeof evaluationRunSchema>;
