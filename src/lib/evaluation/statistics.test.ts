import { describe, expect, it } from "vitest";
import { summarizeRuns } from "./statistics";
import type { EvaluationRunRecord } from "./schema";

const record = (correct: boolean): EvaluationRunRecord => ({
  id: crypto.randomUUID(),
  failureModeId: "test",
  provider: "test",
  modelId: "model",
  modelVersion: "model-1",
  evaluatedAt: "2026-08-30T00:00:00.000Z",
  inputCondition: "native-image",
  mediaSha256: "a".repeat(64),
  promptSha256: "b".repeat(64),
  generatorVersion: "1",
  seed: 1,
  params: { difficulty: 1 },
  systemMessage: "answer",
  prompt: "question",
  temperature: 0,
  maxOutputTokens: 16,
  trial: 1,
  rawResponse: correct ? "yes" : "no",
  parsedAnswer: correct ? "yes" : "no",
  expectedAnswer: "yes",
  correct,
  scorer: "exact-option-v1",
  latencyMs: 1,
  costUsd: 0.01,
  preprocessingNotes: [],
  status: "verified",
});

describe("evaluation statistics", () => {
  it("reports Wilson uncertainty and sample count", () => {
    const summary = summarizeRuns([record(true), record(true), record(false), record(false)]);
    expect(summary).toMatchObject({ n: 4, correct: 2, accuracy: 0.5, totalCostUsd: 0.04 });
    expect(summary.lower95).toBeCloseTo(0.15, 1);
    expect(summary.upper95).toBeCloseTo(0.85, 1);
  });

  it("does not turn absent data into a model score", () => {
    expect(summarizeRuns([])).toMatchObject({ n: 0, accuracy: 0, lower95: 0, upper95: 0 });
  });
});
