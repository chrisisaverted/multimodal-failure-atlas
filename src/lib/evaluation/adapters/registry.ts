import type { EvaluationRequest } from "../schema";
import type { EvaluationAdapter } from "./types";
import { declaredAdapter } from "./declared";
import { fixtureAdapter } from "./fixture";
import { geminiAdapter } from "./gemini";

const adapters: Record<EvaluationRequest["provider"], EvaluationAdapter> = {
  fixture: fixtureAdapter,
  gemini: geminiAdapter,
  kimi: declaredAdapter("kimi"),
  "qwen-local": declaredAdapter("qwen-local"),
  glm: declaredAdapter("glm"),
};

export const getAdapter = (provider: EvaluationRequest["provider"]) => adapters[provider];
export const adapterStatuses = () =>
  Object.values(adapters).map((adapter) => ({
    provider: adapter.provider,
    supports: adapter.supports,
    ...adapter.availability(),
  }));
