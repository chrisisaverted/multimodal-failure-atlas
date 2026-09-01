import { describe, expect, it, vi } from "vitest";
import type { EvaluationAdapter } from "./adapters/types";
import { BudgetError } from "./cost";
import { sha256 } from "./hash";
import { runEvaluationBatch, type EvaluationJob } from "./runner";
import { evaluationRequestSchema } from "./schema";
import { MemoryEvaluationStore } from "./store";

const request = {
  provider: "fixture" as const,
  modelId: "fixture-test",
  failureModeId: "brief-event-blindness",
  generator: "brief-event" as const,
  seed: 2,
  difficulty: 50,
  variant: 0,
  inputCondition: "native-video" as const,
  estimatedCostUsd: 0,
  systemMessage: "Return one allowed answer.",
  prompt: "Does it flash? Allowed answers: yes, no.",
  temperature: 0,
  maxOutputTokens: 16,
  trial: 1,
};

const job: EvaluationJob = {
  request,
  media: { mimeType: "video/mp4", bytes: new Uint8Array([1, 2, 3]), durationMs: 1000 },
  expectedAnswer: "yes",
  answerOptions: ["yes", "no"],
  generatorVersion: "test-1",
};

describe("evaluation batch runner", () => {
  it("accepts bounded reasoning budgets above the legacy ceiling", () => {
    expect(evaluationRequestSchema.parse({ ...request, maxOutputTokens: 8192 }).maxOutputTokens).toBe(8192);
    expect(() => evaluationRequestSchema.parse({ ...request, maxOutputTokens: 16385 })).toThrow();
  });

  it("records immutable provenance and resumes from cache", async () => {
    const evaluate = vi.fn(async () => ({
      rawResponse: "yes",
      modelVersion: "fixture-test-1",
      latencyMs: 4,
    }));
    const adapter: EvaluationAdapter = {
      provider: "fixture",
      supports: ["native-video"],
      availability: () => ({ available: true }),
      estimate: async () => 0,
      evaluate,
    };
    const store = new MemoryEvaluationStore();
    const first = await runEvaluationBatch([job], { adapter, store, minimumIntervalMs: 0 });
    const second = await runEvaluationBatch([job], { adapter, store, minimumIntervalMs: 0 });
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(second[0]).toEqual(first[0]);
    expect(first[0]).toMatchObject({ correct: true, status: "fixture", expectedAnswer: "yes" });
    expect(first[0]!.mediaSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(first[0]!.mediaSha256).toBe(sha256(job.media.bytes!));
    expect(first[0]!.promptSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects a declared digest that does not match supplied bytes", async () => {
    const adapter: EvaluationAdapter = {
      provider: "fixture",
      supports: ["native-video"],
      availability: () => ({ available: true }),
      estimate: async () => 0,
      evaluate: async () => ({ rawResponse: "yes", modelVersion: "x", latencyMs: 1 }),
    };
    await expect(
      runEvaluationBatch([{ ...job, media: { ...job.media, sha256: "a".repeat(64) } }], {
        adapter,
        store: new MemoryEvaluationStore(),
      }),
    ).rejects.toThrow(/does not match/);
  });

  it("fails closed when paid evaluation is not explicitly enabled", async () => {
    const adapter: EvaluationAdapter = {
      provider: "gemini",
      supports: ["native-video"],
      availability: () => ({ available: true }),
      estimate: async () => 0,
      evaluate: async () => ({ rawResponse: "yes", modelVersion: "x", latencyMs: 1 }),
    };
    await expect(
      runEvaluationBatch([{ ...job, request: { ...request, provider: "gemini" } }], {
        adapter,
        store: new MemoryEvaluationStore(),
        env: {},
      }),
    ).rejects.toThrow(/ATLAS_EVALUATION_ENABLED/);
  });

  it("never scores a length-exhausted generation as a substantive answer", async () => {
    const adapter: EvaluationAdapter = {
      provider: "gemini",
      supports: ["native-video"],
      availability: () => ({ available: true }),
      estimate: async () => 0,
      evaluate: async () => ({
        rawResponse: "yes",
        modelVersion: "x",
        latencyMs: 1,
        finishReason: "length",
      }),
    };
    const [record] = await runEvaluationBatch(
      [{ ...job, request: { ...request, provider: "gemini" as const } }],
      {
        adapter,
        store: new MemoryEvaluationStore(),
        env: { ATLAS_EVALUATION_ENABLED: "true" },
      },
    );
    expect(record).toMatchObject({ parsedAnswer: "yes", correct: true, status: "pending-review" });
  });

  it("rejects a declared batch ceiling above the per-run guard", async () => {
    const adapter: EvaluationAdapter = {
      provider: "fixture",
      supports: ["native-video"],
      availability: () => ({ available: true }),
      estimate: async () => 0,
      evaluate: async () => ({ rawResponse: "yes", modelVersion: "x", latencyMs: 1 }),
    };
    await expect(
      runEvaluationBatch([{ ...job, request: { ...request, estimatedCostUsd: 26 } }], {
        adapter,
        store: new MemoryEvaluationStore(),
      }),
    ).rejects.toBeInstanceOf(BudgetError);
  });
});
