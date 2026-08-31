import type { EvaluationRequest } from "../schema";
import { AdapterUnavailableError, type EvaluationAdapter, type MediaPayload } from "./types";

function dataUrl(mimeType: string, bytes: Uint8Array) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

function mediaParts(media: MediaPayload) {
  if (media.frames?.length) {
    return media.frames.flatMap((frame) => [
      { type: "text", text: `[Frame at ${frame.timestampMs} ms]` },
      { type: "image_url", image_url: { url: dataUrl(frame.mimeType, frame.bytes) } },
    ]);
  }
  if (!media.bytes) throw new Error("OpenRouter evaluation requires exact media bytes or frames.");
  if (media.mimeType.startsWith("video/")) {
    return [{ type: "video_url", video_url: { url: dataUrl(media.mimeType, media.bytes) } }];
  }
  if (media.mimeType.startsWith("image/")) {
    return [{ type: "image_url", image_url: { url: dataUrl(media.mimeType, media.bytes) } }];
  }
  throw new Error(`OpenRouter media type ${media.mimeType} is not supported by this adapter.`);
}

interface OpenRouterResponse {
  id?: string | null;
  model?: string | null;
  provider?: string | null;
  system_fingerprint?: string | null;
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | Array<{ type?: string; text?: string }> | null;
      reasoning?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number | null;
    completion_tokens?: number | null;
    total_tokens?: number | null;
    completion_tokens_details?: { reasoning_tokens?: number | null } | null;
    cost?: number | null;
  };
  error?: { message?: string; code?: string | number };
}

function responseText(body: OpenRouterResponse) {
  const content = body.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content))
    return content
      .map((part) => part.text ?? "")
      .join("")
      .trim();
  return "";
}

export const openRouterAdapter: EvaluationAdapter = {
  provider: "openrouter",
  supports: ["native-image", "native-video", "standardized-frames"],
  availability: (env = process.env) => ({
    available: Boolean(env.OPENROUTER_API_KEY),
    reason: env.OPENROUTER_API_KEY ? undefined : "missing OPENROUTER_API_KEY",
  }),
  estimate: async (request) => request.estimatedCostUsd,
  evaluate: async (request: EvaluationRequest, media: MediaPayload) => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new AdapterUnavailableError("openrouter", "missing OPENROUTER_API_KEY");
    if (!request.routingProvider) {
      throw new AdapterUnavailableError("openrouter", "a pinned routingProvider is required");
    }

    const started = performance.now();
    const timeoutMs = Number(process.env.ATLAS_PROVIDER_TIMEOUT_MS ?? 180_000);
    if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 900_000) {
      throw new Error("ATLAS_PROVIDER_TIMEOUT_MS must be between 1,000 and 900,000 milliseconds.");
    }
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://chrisisaverted.github.io/multimodal-failure-atlas/",
        "X-Title": "Multimodal Failure Atlas",
        "X-OpenRouter-Metadata": "enabled",
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: [
          { role: "system", content: request.systemMessage },
          { role: "user", content: [...mediaParts(media), { type: "text", text: request.prompt }] },
        ],
        max_tokens: request.maxOutputTokens,
        ...(!request.modelId.includes("gemini-3.6") && !request.modelId.includes("gemini-3.7")
          ? { temperature: request.temperature }
          : {}),
        ...(request.reasoningEffort
          ? {
              reasoning: {
                effort: request.reasoningEffort,
                exclude: request.excludeReasoning ?? true,
              },
            }
          : {}),
        provider: {
          only: [request.routingProvider],
          allow_fallbacks: request.allowProviderFallbacks ?? false,
          data_collection: request.dataCollection ?? "deny",
        },
      }),
    });
    const body = (await response.json()) as OpenRouterResponse;
    if (!response.ok || body.error) {
      const detail = body.error?.message?.replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        `OpenRouter request failed (${response.status}): ${body.error?.code ?? "unknown error"}${detail ? ` — ${detail}` : ""}`,
      );
    }
    const rawResponse = responseText(body);
    const usage = body.usage;
    if (!body.choices?.length) throw new Error("OpenRouter returned no candidate; the run was not recorded.");
    const finishReason = body.choices[0]?.finish_reason ?? undefined;
    return {
      rawResponse,
      modelVersion: body.model ?? request.modelId,
      latencyMs: Math.round(performance.now() - started),
      requestId: body.id ?? undefined,
      upstreamProvider: body.provider ?? request.routingProvider,
      systemFingerprint: body.system_fingerprint ?? undefined,
      finishReason,
      emptyResponse: rawResponse.length === 0,
      reportedCostUsd: usage?.cost ?? undefined,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens ?? undefined,
            completionTokens: usage.completion_tokens ?? undefined,
            reasoningTokens: usage.completion_tokens_details?.reasoning_tokens ?? undefined,
            totalTokens: usage.total_tokens ?? undefined,
          }
        : undefined,
    };
  },
};
