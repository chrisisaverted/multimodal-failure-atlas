import type { EvaluationAdapter } from "./adapters/types";

export interface RetryEvent {
  attempt: number;
  delayMs: number;
  message: string;
}

export function isTransientProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:\b408\b|\b409\b|\b429\b|\b5\d\d\b|timeout|temporar|overload|rate.?limit)/iu.test(message);
}

export function withTransientRetries(
  adapter: EvaluationAdapter,
  options: {
    maximumAttempts?: number;
    delaysMs?: number[];
    onRetry?: (event: RetryEvent) => void;
    wait?: (milliseconds: number) => Promise<void>;
  } = {},
): EvaluationAdapter {
  const maximumAttempts = options.maximumAttempts ?? 4;
  const delays = options.delaysMs ?? [2_000, 8_000, 20_000];
  const wait =
    options.wait ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  return {
    ...adapter,
    async evaluate(request, media) {
      for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
        try {
          return await adapter.evaluate(request, media);
        } catch (error) {
          if (attempt === maximumAttempts || !isTransientProviderError(error)) throw error;
          const delayMs = delays[Math.min(attempt - 1, delays.length - 1)]!;
          options.onRetry?.({
            attempt,
            delayMs,
            message: error instanceof Error ? error.message : String(error),
          });
          await wait(delayMs);
        }
      }
      throw new Error("Unreachable retry state.");
    },
  };
}
