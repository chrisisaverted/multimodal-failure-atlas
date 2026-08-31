import { describe, expect, it, vi } from "vitest";
import type { EvaluationAdapter } from "./adapters/types";
import { isTransientProviderError, withTransientRetries } from "./retry";

const adapter: EvaluationAdapter = {
  provider: "fixture",
  supports: ["native-image"],
  availability: () => ({ available: true }),
  estimate: async () => 0,
  evaluate: async () => ({ rawResponse: "yes", modelVersion: "fixture", latencyMs: 0 }),
};

describe("transient provider retries", () => {
  it("classifies timeouts and status failures without retrying arbitrary errors", () => {
    expect(isTransientProviderError(new Error("504 upstream idle timeout"))).toBe(true);
    expect(isTransientProviderError(new Error("429 rate limit"))).toBe(true);
    expect(isTransientProviderError(new Error("invalid media"))).toBe(false);
  });

  it("retries a transient error and returns the eventual response", async () => {
    const evaluate = vi
      .fn<NonNullable<EvaluationAdapter["evaluate"]>>()
      .mockRejectedValueOnce(new Error("503 overloaded"))
      .mockResolvedValue({ rawResponse: "yes", modelVersion: "fixture", latencyMs: 0 });
    const retrying = withTransientRetries(
      { ...adapter, evaluate },
      { delaysMs: [0], wait: async () => undefined },
    );
    await expect(
      retrying.evaluate(
        {
          provider: "fixture",
          modelId: "fixture",
          failureModeId: "test",
          generator: "brief-event",
          seed: 0,
          difficulty: 0,
          variant: 0,
          inputCondition: "native-image",
          estimatedCostUsd: 0,
          systemMessage: "test",
          prompt: "test",
          temperature: 0,
          maxOutputTokens: 1,
          trial: 1,
        },
        { mimeType: "image/png", bytes: new Uint8Array([1]) },
      ),
    ).resolves.toMatchObject({ rawResponse: "yes" });
    expect(evaluate).toHaveBeenCalledTimes(2);
  });
});
