import { z } from "zod";

export const searchSplitSchema = z.enum(["discovery", "confirmatory"]);

export const latticeCountingParametersSchema = z.object({
  count: z.number().int().min(1).max(20),
  flashDurationMs: z.number().int().min(34).max(1000),
  intervalMs: z.number().int().min(100).max(2000),
  phaseMs: z.number().int().min(0).max(999),
  videoDurationMs: z.number().int().min(1000).max(30000),
  fps: z.number().int().min(10).max(120),
  visualVariant: z.number().int().nonnegative(),
});

export const discoveryCandidateSchema = z.object({
  id: z.string().min(1),
  cellId: z.string().min(1),
  mechanism: z.literal("temporal-sampling-lattice"),
  split: searchSplitSchema,
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("repeated-event-undercount"),
  question: z.string().min(1),
  answerOptions: z.array(z.string()).min(2),
  expectedAnswer: z.string().min(1),
  humanSolvability: z.literal("unverified"),
  parameters: latticeCountingParametersSchema,
});

export const searchObservationSchema = z.object({
  candidateId: z.string().min(1),
  modelId: z.string().min(1),
  outcome: z.enum(["correct", "incorrect", "no-answer", "review", "error"]),
  costUsd: z.number().nonnegative(),
});

export type DiscoveryCandidate = z.infer<typeof discoveryCandidateSchema>;
export type SearchObservation = z.infer<typeof searchObservationSchema>;
