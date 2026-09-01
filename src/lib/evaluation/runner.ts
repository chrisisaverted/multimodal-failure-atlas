import { createHash } from "node:crypto";
import type { EvaluationAdapter, MediaPayload } from "./adapters/types";
import { AdapterUnavailableError } from "./adapters/types";
import { assertWithinBudget } from "./cost";
import { sha256 } from "./hash";
import { scoreExactOption, type ScoreResult } from "./scorer";
import {
  evaluationRequestSchema,
  evaluationRunSchema,
  type EvaluationRequest,
  type EvaluationRunRecord,
} from "./schema";
import type { EvaluationStore } from "./store";

export interface EvaluationJob {
  request: EvaluationRequest;
  media: MediaPayload;
  expectedAnswer: string;
  answerOptions: string[];
  generatorVersion: string;
  artifactPath?: string;
  evaluationPlanId?: string;
  evaluationPlanSha256?: string;
  evaluationProtocolId?: string;
  evaluationProtocolSha256?: string;
}

export interface BatchOptions {
  adapter: EvaluationAdapter;
  store: EvaluationStore;
  env?: Record<string, string | undefined>;
  minimumIntervalMs?: number;
  now?: () => Date;
  onProgress?: (event: { completed: number; total: number; cached: boolean; id: string }) => void;
  scorer?: (rawResponse: string, expectedAnswer: string, options: string[]) => ScoreResult;
}

function mediaDigest(media: MediaPayload) {
  const digestForBytes = media.bytes ? sha256(media.bytes) : undefined;
  if (media.sha256) {
    if (!/^[a-f0-9]{64}$/.test(media.sha256))
      throw new Error("media.sha256 must be a lowercase SHA-256 digest.");
    if (digestForBytes && digestForBytes !== media.sha256) {
      throw new Error("media.sha256 does not match the supplied media bytes.");
    }
    return media.sha256;
  }
  if (digestForBytes) return digestForBytes;
  if (media.frames?.length) {
    const hash = createHash("sha256");
    for (const frame of media.frames) {
      const header = Buffer.from(
        JSON.stringify({
          mimeType: frame.mimeType,
          timestampMs: frame.timestampMs,
          bytes: frame.bytes.length,
        }),
      );
      hash
        .update(Buffer.from(String(header.length)))
        .update(Buffer.from([0]))
        .update(header)
        .update(frame.bytes);
    }
    return hash.digest("hex");
  }
  throw new Error("Evaluation media needs bytes, frames, or a trusted explicit SHA-256 digest.");
}

function runId(job: EvaluationJob, digest: string) {
  const inferenceRequest = { ...job.request, estimatedCostUsd: undefined };
  return sha256(
    JSON.stringify({
      request: inferenceRequest,
      expectedAnswer: job.expectedAnswer,
      answerOptions: job.answerOptions,
      generatorVersion: job.generatorVersion,
      mediaSha256: digest,
      evaluationProtocolId: job.evaluationProtocolId,
      evaluationProtocolSha256: job.evaluationProtocolSha256,
    }),
  );
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const exhaustedGeneration = (finishReason?: string) =>
  finishReason !== undefined && /^(?:length|max[_ -]?tokens?)$/iu.test(finishReason.trim());

export async function runEvaluationBatch(jobs: EvaluationJob[], options: BatchOptions) {
  if (jobs.length === 0) return [];
  if (jobs.length > 1000) throw new Error("A batch may contain at most 1,000 jobs.");

  const env = options.env ?? process.env;
  const parsedJobs = jobs.map((job) => ({ ...job, request: evaluationRequestSchema.parse(job.request) }));
  if (parsedJobs.some(({ request }) => request.provider !== options.adapter.provider)) {
    throw new Error("Every job provider must match the selected adapter.");
  }
  if (options.adapter.provider !== "fixture" && env.ATLAS_EVALUATION_ENABLED !== "true") {
    throw new AdapterUnavailableError(options.adapter.provider, "ATLAS_EVALUATION_ENABLED is not true");
  }

  const availability = options.adapter.availability(env);
  if (!availability.available) {
    throw new AdapterUnavailableError(options.adapter.provider, availability.reason ?? "not configured");
  }
  for (const { request } of parsedJobs) {
    if (!options.adapter.supports.includes(request.inputCondition)) {
      throw new AdapterUnavailableError(
        options.adapter.provider,
        `does not support ${request.inputCondition}`,
      );
    }
  }

  const prepared = await Promise.all(
    parsedJobs.map(async (job) => {
      const mediaSha256 = mediaDigest(job.media);
      const id = runId(job, mediaSha256);
      const cached = await options.store.find(id);
      const adapterEstimate = cached ? 0 : await options.adapter.estimate(job.request, job.media);
      const estimate = cached ? 0 : Math.max(adapterEstimate, job.request.estimatedCostUsd);
      return { ...job, id, mediaSha256, cached, estimate };
    }),
  );

  const recordedSpend = Number(env.ATLAS_RECORDED_SPEND_USD ?? 0);
  if (!Number.isFinite(recordedSpend) || recordedSpend < 0) {
    throw new Error("ATLAS_RECORDED_SPEND_USD must be a finite non-negative number.");
  }
  let projectedSpend = recordedSpend + (await options.store.spentUsd());
  for (const item of prepared) {
    assertWithinBudget(item.estimate, projectedSpend, env);
    projectedSpend += item.estimate;
  }

  const results: EvaluationRunRecord[] = [];
  let lastStartedAt = 0;
  const minimumIntervalMs = Math.max(0, options.minimumIntervalMs ?? 250);
  const now = options.now ?? (() => new Date());

  for (const item of prepared) {
    if (item.cached) {
      results.push(item.cached);
      options.onProgress?.({ completed: results.length, total: prepared.length, cached: true, id: item.id });
      continue;
    }

    const delay = minimumIntervalMs - (Date.now() - lastStartedAt);
    if (delay > 0) await wait(delay);
    lastStartedAt = Date.now();
    const response = await options.adapter.evaluate(item.request, item.media);
    const actualCost = response.reportedCostUsd ?? item.estimate;
    assertWithinBudget(actualCost, recordedSpend + (await options.store.spentUsd()), env);
    const score = (options.scorer ?? scoreExactOption)(
      response.rawResponse,
      item.expectedAnswer,
      item.answerOptions,
    );
    const record = evaluationRunSchema.parse({
      id: item.id,
      failureModeId: item.request.failureModeId,
      provider: item.request.provider,
      modelId: item.request.modelId,
      modelVersion: response.modelVersion,
      evaluatedAt: now().toISOString(),
      inputCondition: item.request.inputCondition,
      mediaSha256: item.mediaSha256,
      promptSha256: sha256(`${item.request.systemMessage}\n${item.request.prompt}`),
      generatorVersion: item.generatorVersion,
      seed: item.request.seed,
      params: { difficulty: item.request.difficulty, variant: item.request.variant },
      systemMessage: item.request.systemMessage,
      prompt: item.request.prompt,
      temperature: item.request.temperature,
      maxOutputTokens: item.request.maxOutputTokens,
      trial: item.request.trial,
      reasoningEffort: item.request.reasoningEffort,
      excludeReasoning: item.request.excludeReasoning,
      rawResponse: response.rawResponse,
      parsedAnswer: score.parsedAnswer,
      expectedAnswer: item.expectedAnswer,
      correct: score.correct,
      scorer: score.method,
      latencyMs: response.latencyMs,
      costUsd: actualCost,
      costBasis: response.reportedCostUsd === undefined ? "estimated" : "reported",
      requestId: response.requestId,
      upstreamProvider: response.upstreamProvider,
      systemFingerprint: response.systemFingerprint,
      finishReason: response.finishReason,
      emptyResponse: response.emptyResponse,
      usage: response.usage,
      routingProvider: item.request.routingProvider,
      allowProviderFallbacks: item.request.allowProviderFallbacks,
      dataCollection: item.request.dataCollection,
      artifactPath: item.artifactPath,
      evaluationPlanId: item.evaluationPlanId,
      evaluationPlanSha256: item.evaluationPlanSha256,
      evaluationProtocolId: item.evaluationProtocolId,
      evaluationProtocolSha256: item.evaluationProtocolSha256,
      preprocessingNotes: item.media.preprocessingNotes ?? [],
      status:
        item.request.provider === "fixture"
          ? "fixture"
          : response.emptyResponse || (!score.needsReview && !exhaustedGeneration(response.finishReason))
            ? "verified"
            : "pending-review",
    });
    await options.store.append(record);
    results.push(record);
    options.onProgress?.({ completed: results.length, total: prepared.length, cached: false, id: item.id });
  }
  return results;
}
