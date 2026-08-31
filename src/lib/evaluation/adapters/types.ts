import type { EvaluationRequest } from "../schema";

export interface MediaPayload {
  mimeType: string;
  bytes?: Uint8Array;
  uri?: string;
  frames?: Array<{ mimeType: string; bytes: Uint8Array; timestampMs: number }>;
  durationMs?: number;
  sha256?: string;
  preprocessingNotes?: string[];
}

export interface AdapterResponse {
  rawResponse: string;
  modelVersion: string;
  latencyMs: number;
  reportedCostUsd?: number;
  requestId?: string;
}

export interface EvaluationAdapter {
  readonly provider: EvaluationRequest["provider"];
  readonly supports: ReadonlyArray<EvaluationRequest["inputCondition"]>;
  availability(env?: Record<string, string | undefined>): { available: boolean; reason?: string };
  estimate(request: EvaluationRequest, media: MediaPayload): Promise<number>;
  evaluate(request: EvaluationRequest, media: MediaPayload): Promise<AdapterResponse>;
}

export class AdapterUnavailableError extends Error {
  constructor(provider: string, reason: string) {
    super(`${provider} adapter unavailable: ${reason}`);
    this.name = "AdapterUnavailableError";
  }
}
