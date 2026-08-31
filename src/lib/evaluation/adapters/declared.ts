import { AdapterUnavailableError, type EvaluationAdapter } from "./types";
import type { EvaluationRequest } from "../schema";

type DeclaredProvider = Exclude<EvaluationRequest["provider"], "fixture" | "gemini" | "openrouter">;

const requirements: Record<
  DeclaredProvider,
  { env: string; supports: EvaluationAdapter["supports"]; reason: string }
> = {
  kimi: {
    env: "MOONSHOT_API_KEY",
    supports: [],
    reason: "modality support requires a dated endpoint conformance fixture",
  },
  "qwen-local": {
    env: "QWEN_MODEL_PATH",
    supports: ["native-image", "native-video", "standardized-frames"],
    reason: "local worker process has not been configured",
  },
  glm: {
    env: "ZHIPU_API_KEY",
    supports: ["native-image", "native-video", "standardized-frames"],
    reason: "documented video endpoint still requires a dated request conformance fixture",
  },
};

export function declaredAdapter(provider: DeclaredProvider): EvaluationAdapter {
  const requirement = requirements[provider];
  return {
    provider,
    supports: requirement.supports,
    availability: (env = process.env) => ({
      available: false,
      reason: env[requirement.env] ? requirement.reason : `missing ${requirement.env}`,
    }),
    estimate: async () => {
      throw new AdapterUnavailableError(provider, requirement.reason);
    },
    evaluate: async () => {
      throw new AdapterUnavailableError(provider, requirement.reason);
    },
  };
}
