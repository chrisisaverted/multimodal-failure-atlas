import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { openRouterAdapter } from "../src/lib/evaluation/adapters/openrouter";
import { sha256 } from "../src/lib/evaluation/hash";
import { runEvaluationBatch, type EvaluationJob } from "../src/lib/evaluation/runner";
import { withTransientRetries } from "../src/lib/evaluation/retry";
import {
  scoreDeclaredAnswerV4,
  scoreTerminalOption,
  scoreTerminalOptionV3,
} from "../src/lib/evaluation/scorer";
import { JsonlEvaluationStore } from "../src/lib/evaluation/store";

async function loadLocalEnvironment() {
  try {
    const body = await readFile(resolve(".env.local"), "utf8");
    for (const line of body.split("\n")) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (match && process.env[match[1]!] === undefined) process.env[match[1]!] = match[2]!;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
await loadLocalEnvironment();

const caseSchema = z.object({
  candidateId: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  condition: z.string().min(1).default("native-1x"),
  interventionDescription: z.string().optional(),
  failureModeId: z.string(),
  generator: z.string().min(1).max(120),
  seed: z.number().int(),
  difficulty: z.number(),
  variant: z.number().int(),
  artifact: z.string(),
  mimeType: z.enum(["video/mp4", "image/png"]),
  durationMs: z.number().optional(),
  question: z.string(),
  answerOptions: z.array(z.string()),
  expectedAnswer: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  systemMessage: z.string().optional(),
});
const manifestSchema = z.object({
  id: z.string(),
  planSha256: z.string().regex(/^[a-f0-9]{64}$/),
  generatorVersion: z.string(),
  renderer: z.string(),
  fps: z.number(),
  cases: z.array(caseSchema),
});
const protocolSchema = z.object({
  id: z.string(),
  evaluationPlanId: z.string(),
  evaluationPlanSha256: z.string().regex(/^[a-f0-9]{64}$/),
  temperature: z.number(),
  maxOutputTokens: z.number().int(),
  reasoning: z.object({
    effort: z.enum(["none", "minimal", "low", "medium", "high"]),
    exclude: z.boolean(),
  }),
  scorer: z.enum(["terminal-option-v2", "terminal-option-v3", "declared-answer-v4"]),
  systemMessage: z.string().min(20).optional(),
  allowProviderFallbacks: z.literal(false),
  dataCollection: z.literal("deny"),
  campaignCostCeilingUsd: z.number().positive(),
  models: z.array(
    z.object({
      modelId: z.string(),
      modelRevision: z.string(),
      upstreamProvider: z.string(),
    }),
  ),
});

const manifestPath = resolve(
  process.argv[2] ?? "public/evaluations/lattice-counting-discovery-v1/manifest.json",
);
const protocolPath = resolve(
  process.env.ATLAS_EVALUATION_PROTOCOL_PATH ?? "evaluation/plans/lattice-counting-screen-v1.json",
);
const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
const protocolBytes = await readFile(protocolPath);
const protocol = protocolSchema.parse(JSON.parse(protocolBytes.toString("utf8")));
if (protocol.evaluationPlanId !== manifest.id || protocol.evaluationPlanSha256 !== manifest.planSha256) {
  throw new Error("Screening protocol does not commit to this exact discovery plan.");
}
if (protocol.campaignCostCeilingUsd > Number(process.env.ATLAS_MAX_RUN_COST_USD ?? 25)) {
  throw new Error("Screening protocol exceeds the configured runner ceiling.");
}

const modelId = process.env.ATLAS_MODEL_ID;
if (!modelId) throw new Error("ATLAS_MODEL_ID is required.");
const protocolModel = protocol.models.find((entry) => entry.modelId === modelId);
if (!protocolModel) throw new Error(`${modelId} is not in ${protocol.id}.`);
const routingProvider = process.env.ATLAS_OPENROUTER_PROVIDER ?? protocolModel.upstreamProvider;
if (routingProvider !== protocolModel.upstreamProvider) {
  throw new Error("Requested provider does not match the frozen protocol.");
}
const estimatedCaseCostUsd = Number(process.env.ATLAS_ESTIMATED_CASE_COST_USD ?? 0.02);
const offset = Number(process.env.ATLAS_CASE_OFFSET ?? 0);
const limit = Number(process.env.ATLAS_CASE_LIMIT ?? manifest.cases.length - offset);
if (!Number.isInteger(offset) || !Number.isInteger(limit) || offset < 0 || limit < 1) {
  throw new Error("Case offset and limit must be valid non-negative integers.");
}
const cases = manifest.cases.slice(offset, offset + limit);
if (cases.length !== limit) throw new Error("Requested discovery range exceeds the manifest.");

const defaultSystemMessage =
  "This is a controlled visual diagnostic. Inspect only the supplied media and return exactly one allowed answer. Do not explain.";
const jobs: EvaluationJob[] = await Promise.all(
  cases.map(async (entry) => ({
    request: {
      provider: "openrouter" as const,
      modelId,
      failureModeId: entry.failureModeId,
      generator: entry.generator,
      seed: entry.seed,
      difficulty: entry.difficulty,
      variant: entry.variant,
      inputCondition: entry.mimeType.startsWith("video/")
        ? ("native-video" as const)
        : ("native-image" as const),
      estimatedCostUsd: estimatedCaseCostUsd,
      systemMessage: entry.systemMessage ?? protocol.systemMessage ?? defaultSystemMessage,
      prompt: `${entry.question}\nAllowed answers: ${entry.answerOptions.join(", ")}.`,
      temperature: protocol.temperature,
      maxOutputTokens: protocol.maxOutputTokens,
      trial: 1,
      reasoningEffort: protocol.reasoning.effort,
      excludeReasoning: protocol.reasoning.exclude,
      routingProvider,
      allowProviderFallbacks: false,
      dataCollection: "deny" as const,
    },
    media: {
      mimeType: entry.mimeType,
      bytes: new Uint8Array(await readFile(resolve(entry.artifact))),
      sha256: entry.sha256,
      durationMs: entry.durationMs,
      preprocessingNotes: [
        `Exact ${manifest.renderer} artifact`,
        ...(entry.mimeType === "video/mp4" ? [`${manifest.fps} FPS H.264 source`] : []),
        `Condition: ${entry.condition}`,
        ...(entry.interventionDescription ? [entry.interventionDescription] : []),
      ],
    },
    expectedAnswer: entry.expectedAnswer,
    answerOptions: entry.answerOptions,
    generatorVersion: manifest.generatorVersion,
    artifactPath: `/${entry.artifact.replace(/^public\//, "")}`,
    evaluationPlanId: manifest.id,
    evaluationPlanSha256: manifest.planSha256,
    evaluationProtocolId: protocol.id,
    evaluationProtocolSha256: sha256(protocolBytes),
  })),
);

const output = resolve(process.env.ATLAS_DISCOVERY_RESULTS_PATH ?? `evaluation/results/${manifest.id}.jsonl`);
const records = await runEvaluationBatch(jobs, {
  adapter: withTransientRetries(openRouterAdapter, {
    onRetry: ({ attempt, delayMs, message }) =>
      process.stdout.write(`[retry ${attempt}] ${message.slice(0, 140)}; waiting ${delayMs}ms\n`),
  }),
  store: new JsonlEvaluationStore(output),
  scorer:
    protocol.scorer === "declared-answer-v4"
      ? scoreDeclaredAnswerV4
      : protocol.scorer === "terminal-option-v3"
        ? scoreTerminalOptionV3
        : scoreTerminalOption,
  minimumIntervalMs: Number(process.env.ATLAS_MINIMUM_INTERVAL_MS ?? 3300),
  onProgress: ({ completed, total, cached }) =>
    process.stdout.write(`[${completed}/${total}] ${cached ? "cached" : "recorded"}\n`),
});
const verified = records.filter((record) => record.status === "verified");
console.log(
  JSON.stringify(
    {
      modelId,
      records: records.length,
      substantiveAnswers: verified.filter((record) => !record.emptyResponse).length,
      correct: verified.filter((record) => record.correct).length,
      noAnswer: records.filter((record) => record.emptyResponse).length,
      pendingReview: records.filter((record) => record.status === "pending-review").length,
      costUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
      output,
    },
    null,
    2,
  ),
);
