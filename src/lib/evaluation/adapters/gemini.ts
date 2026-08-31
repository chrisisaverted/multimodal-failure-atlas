import type { EvaluationRequest } from "../schema";
import { AdapterUnavailableError, type EvaluationAdapter, type MediaPayload } from "./types";

const inputRateName = "ATLAS_GEMINI_INPUT_USD_PER_MILLION";
const outputRateName = "ATLAS_GEMINI_OUTPUT_USD_PER_MILLION";

function positiveRate(value: string | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function pricing(env: Record<string, string | undefined>) {
  const input = positiveRate(env[inputRateName]);
  const output = positiveRate(env[outputRateName]);
  return input === undefined || output === undefined ? undefined : { input, output };
}

function estimatedInputTokens(request: EvaluationRequest, media: MediaPayload) {
  const textTokens = Math.ceil((request.systemMessage.length + request.prompt.length) / 3);
  if (media.frames?.length) return textTokens + media.frames.length * 300;
  if (media.mimeType.startsWith("video/")) {
    if (!media.durationMs) throw new Error("Gemini video preflight requires media.durationMs.");
    return textTokens + Math.ceil(media.durationMs / 1000) * 320;
  }
  return textTokens + 300;
}

function contentParts(media: MediaPayload) {
  if (media.frames?.length) {
    return media.frames.map((frame) => ({
      inlineData: { mimeType: frame.mimeType, data: Buffer.from(frame.bytes).toString("base64") },
    }));
  }
  if (media.bytes) {
    return [{ inlineData: { mimeType: media.mimeType, data: Buffer.from(media.bytes).toString("base64") } }];
  }
  if (media.uri) return [{ fileData: { mimeType: media.mimeType, fileUri: media.uri } }];
  throw new Error("Gemini evaluation requires media bytes, frames, or a provider file URI.");
}

interface GeminiResponse {
  modelVersion?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string; status?: string };
}

export const geminiAdapter: EvaluationAdapter = {
  provider: "gemini",
  supports: ["native-image", "native-video", "standardized-frames"],
  availability: (env = process.env) => {
    if (!env.GEMINI_API_KEY) return { available: false, reason: "missing GEMINI_API_KEY" };
    if (!pricing(env)) {
      return {
        available: false,
        reason: `missing dated pricing inputs (${inputRateName} and ${outputRateName})`,
      };
    }
    return { available: true };
  },
  estimate: async (request, media) => {
    const rates = pricing(process.env);
    if (!rates) {
      throw new AdapterUnavailableError("gemini", "dated input and output pricing rates are required");
    }
    const inputCost = (estimatedInputTokens(request, media) / 1_000_000) * rates.input;
    const outputCost = (request.maxOutputTokens / 1_000_000) * rates.output;
    return Number((inputCost + outputCost).toFixed(6));
  },
  evaluate: async (request, media) => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new AdapterUnavailableError("gemini", "missing GEMINI_API_KEY");
    const started = performance.now();
    const generationConfig = {
      maxOutputTokens: request.maxOutputTokens,
      ...(request.modelId.startsWith("gemini-3") ? {} : { temperature: request.temperature }),
    };
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(request.modelId)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.systemMessage }] },
          contents: [
            {
              role: "user",
              parts: [...contentParts(media), { text: request.prompt }],
            },
          ],
          generationConfig,
        }),
      },
    );
    const body = (await response.json()) as GeminiResponse;
    if (!response.ok || body.error) {
      throw new Error(`Gemini request failed (${response.status}): ${body.error?.status ?? "unknown error"}`);
    }
    const rawResponse =
      body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() ?? "";
    if (!rawResponse) throw new Error("Gemini returned no text candidate; the run was not recorded.");
    return {
      rawResponse,
      modelVersion: body.modelVersion ?? request.modelId,
      latencyMs: Math.round(performance.now() - started),
      requestId: response.headers.get("x-request-id") ?? undefined,
    };
  },
};
