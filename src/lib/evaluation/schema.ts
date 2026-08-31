import { z } from "zod";

export const evaluationRequestSchema = z.object({
  provider: z.enum(["fixture", "gemini", "kimi", "qwen-local", "glm"]),
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
  maxOutputTokens: z.number().int().min(1).max(4096).default(64),
  trial: z.number().int().positive().default(1),
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
  rawResponse: z.string(),
  parsedAnswer: z.string(),
  expectedAnswer: z.string(),
  correct: z.boolean(),
  scorer: z.string(),
  latencyMs: z.number().nonnegative(),
  costUsd: z.number().nonnegative(),
  requestId: z.string().optional(),
  preprocessingNotes: z.array(z.string()),
  status: z.enum(["verified", "fixture", "pending-review"]),
});

export type EvaluationRunRecord = z.infer<typeof evaluationRunSchema>;
