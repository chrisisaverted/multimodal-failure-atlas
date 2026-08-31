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
  choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
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
        provider: {
          only: [request.routingProvider],
          allow_fallbacks: request.allowProviderFallbacks ?? false,
          data_collection: request.dataCollection ?? "deny",
        },
      }),
    });
    const body = (await response.json()) as OpenRouterResponse;
    if (!response.ok || body.error) {
      throw new Error(
        `OpenRouter request failed (${response.status}): ${body.error?.code ?? "unknown error"}`,
      );
    }
    const rawResponse = responseText(body);
    if (!rawResponse) throw new Error("OpenRouter returned no text candidate; the run was not recorded.");
    const usage = body.usage;
    return {
      rawResponse,
      modelVersion: body.model ?? request.modelId,
      latencyMs: Math.round(performance.now() - started),
      requestId: body.id ?? undefined,
      upstreamProvider: body.provider ?? request.routingProvider,
      systemFingerprint: body.system_fingerprint ?? undefined,
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
