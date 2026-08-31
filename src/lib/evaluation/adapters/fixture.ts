import type { EvaluationAdapter, MediaPayload } from "./types";
import type { EvaluationRequest } from "../schema";

export const fixtureAdapter: EvaluationAdapter = {
  provider: "fixture",
  supports: ["native-image", "native-video", "standardized-frames"],
  availability: () => ({
    available: process.env.NODE_ENV !== "production",
    reason: process.env.NODE_ENV === "production" ? "disabled in production" : undefined,
  }),
  estimate: async () => 0,
  evaluate: async (request: EvaluationRequest, media: MediaPayload) => {
    void media;
    return {
      rawResponse: `[FIXTURE ONLY] No model was called. Prompt length: ${request.prompt.length}; seed: ${request.seed}.`,
      modelVersion: "fixture-1",
      latencyMs: 0,
      reportedCostUsd: 0,
    };
  },
};
