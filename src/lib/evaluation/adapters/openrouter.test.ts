import { afterEach, describe, expect, it, vi } from "vitest";
import type { EvaluationRequest } from "../schema";
import { openRouterAdapter } from "./openrouter";

const request: EvaluationRequest = {
  provider: "openrouter",
  modelId: "example/video-model",
  failureModeId: "brief-event-blindness",
  generator: "brief-event",
  seed: 1,
  difficulty: 90,
  variant: 0,
  inputCondition: "native-video",
  estimatedCostUsd: 0.25,
  systemMessage: "Return one option.",
  prompt: "Did it flash? Allowed answers: yes, no.",
  temperature: 0,
  maxOutputTokens: 128,
  trial: 1,
  reasoningEffort: "minimal",
  excludeReasoning: true,
  routingProvider: "provider-a",
  allowProviderFallbacks: false,
  dataCollection: "deny",
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.OPENROUTER_API_KEY;
});

describe("OpenRouter adapter", () => {
  it("sends exact video bytes with pinned, no-fallback routing and records reported usage", async () => {
    process.env.OPENROUTER_API_KEY = "test-only";
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.provider).toEqual({
        only: ["provider-a"],
        allow_fallbacks: false,
        data_collection: "deny",
      });
      expect(body.reasoning).toEqual({ effort: "minimal", exclude: true });
      expect(body.messages[1].content[0]).toEqual({
        type: "video_url",
        video_url: { url: "data:video/mp4;base64,AQID" },
      });
      return new Response(
        JSON.stringify({
          id: "generation-1",
          model: "example/video-model-20260830",
          provider: "provider-a",
          system_fingerprint: "fp_1",
          choices: [{ message: { content: "yes" } }],
          usage: {
            prompt_tokens: 42,
            completion_tokens: 1,
            total_tokens: 43,
            completion_tokens_details: { reasoning_tokens: 0 },
            cost: 0.0012,
          },
        }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openRouterAdapter.evaluate(request, {
        mimeType: "video/mp4",
        bytes: new Uint8Array([1, 2, 3]),
      }),
    ).resolves.toMatchObject({
      rawResponse: "yes",
      modelVersion: "example/video-model-20260830",
      upstreamProvider: "provider-a",
      systemFingerprint: "fp_1",
      reportedCostUsd: 0.0012,
      usage: { promptTokens: 42, completionTokens: 1, totalTokens: 43 },
    });
  });

  it("refuses ambiguous gateway routing", async () => {
    process.env.OPENROUTER_API_KEY = "test-only";
    await expect(
      openRouterAdapter.evaluate(
        { ...request, routingProvider: undefined },
        { mimeType: "image/png", bytes: new Uint8Array([1]) },
      ),
    ).rejects.toThrow(/pinned routingProvider/);
  });

  it("treats nullable optional provenance fields as absent", async () => {
    process.env.OPENROUTER_API_KEY = "test-only";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: "generation-2",
            model: "example/video-model-20260830",
            provider: "provider-a",
            system_fingerprint: null,
            choices: [{ message: { content: "yes" } }],
            usage: {
              prompt_tokens: 42,
              completion_tokens: 1,
              total_tokens: 43,
              completion_tokens_details: { reasoning_tokens: null },
              cost: 0.0012,
            },
          }),
          { status: 200 },
        )),
    );

    await expect(
      openRouterAdapter.evaluate(request, {
        mimeType: "video/mp4",
        bytes: new Uint8Array([1, 2, 3]),
      }),
    ).resolves.toMatchObject({
      systemFingerprint: undefined,
      usage: { reasoningTokens: undefined },
    });
  });

  it("records termination diagnostics when a model emits no answer", async () => {
    process.env.OPENROUTER_API_KEY = "test-only";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            id: "generation-3",
            choices: [
              { finish_reason: "length", message: { content: "", reasoning: "internal trace" } },
            ],
            usage: {
              completion_tokens: 128,
              completion_tokens_details: { reasoning_tokens: 128 },
            },
          }),
          { status: 200 },
        )),
    );

    await expect(
      openRouterAdapter.evaluate(request, {
        mimeType: "video/mp4",
        bytes: new Uint8Array([1, 2, 3]),
      }),
    ).resolves.toMatchObject({
      rawResponse: "",
      finishReason: "length",
      emptyResponse: true,
      usage: { reasoningTokens: 128 },
    });
  });
});
