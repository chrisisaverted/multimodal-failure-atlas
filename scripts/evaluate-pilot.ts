import { readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { z } from "zod";
import { geminiAdapter } from "../src/lib/evaluation/adapters/gemini";
import { openRouterAdapter } from "../src/lib/evaluation/adapters/openrouter";
import { runEvaluationBatch, type EvaluationJob } from "../src/lib/evaluation/runner";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";
import { JsonlEvaluationStore } from "../src/lib/evaluation/store";
import { sha256 } from "../src/lib/evaluation/hash";
import { generatorVersion } from "../src/lib/generators";

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
  failureModeId: z.string(),
  generator: z.enum([
    "small-object",
    "patch-phase",
    "attribute-binding",
    "numerosity-density",
    "brief-event",
    "event-order",
    "identity-occlusion",
    "event-counting",
  ]),
  seed: z.number().int(),
  difficulty: z.number(),
  variant: z.number().int(),
  artifact: z.string(),
  mimeType: z.string(),
  durationMs: z.number().optional(),
  question: z.string(),
  answerOptions: z.array(z.string()),
  expectedAnswer: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
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
  temperature: z.number().min(0).max(2),
  maxOutputTokens: z.number().int().min(1).max(4096),
  reasoning: z
    .object({
      effort: z.enum(["none", "minimal", "low", "medium", "high"]),
      exclude: z.boolean(),
    })
    .optional(),
  allowProviderFallbacks: z.boolean(),
  dataCollection: z.enum(["allow", "deny"]),
  campaignCostCeilingUsd: z.number().positive(),
  models: z.array(
    z.object({
      modelId: z.string(),
      modelRevision: z.string(),
      upstreamProvider: z.string(),
    }),
  ),
});

const manifestPath = resolve(process.argv[2] ?? "public/evaluations/frontier-pilot-2026-08-30/manifest.json");
const manifest = manifestSchema.parse(JSON.parse(await readFile(manifestPath, "utf8")));
if (manifest.generatorVersion !== generatorVersion) throw new Error("Pilot manifest generator is stale.");
const protocolPath = process.env.ATLAS_EVALUATION_PROTOCOL_PATH;
const protocolBytes = protocolPath ? await readFile(resolve(protocolPath)) : undefined;
const protocol = protocolBytes ? protocolSchema.parse(JSON.parse(protocolBytes.toString("utf8"))) : undefined;
const protocolSha256 = protocolBytes ? sha256(protocolBytes) : undefined;
if (
  protocol &&
  (protocol.evaluationPlanId !== manifest.id || protocol.evaluationPlanSha256 !== manifest.planSha256)
) {
  throw new Error("Evaluation protocol does not commit to this exact stimulus plan.");
}
if (protocol && protocol.campaignCostCeilingUsd > Number(process.env.ATLAS_MAX_RUN_COST_USD ?? 25)) {
  throw new Error("Evaluation protocol cost ceiling exceeds the configured runner ceiling.");
}
const caseOffset = Number(process.env.ATLAS_CASE_OFFSET ?? 0);
if (!Number.isInteger(caseOffset) || caseOffset < 0 || caseOffset >= manifest.cases.length) {
  throw new Error(`ATLAS_CASE_OFFSET must be an integer from 0 to ${manifest.cases.length - 1}.`);
}
const maximumCaseLimit = manifest.cases.length - caseOffset;
const caseLimit = Number(process.env.ATLAS_CASE_LIMIT ?? maximumCaseLimit);
if (!Number.isInteger(caseLimit) || caseLimit < 1 || caseLimit > maximumCaseLimit) {
  throw new Error(`ATLAS_CASE_LIMIT must be an integer from 1 to ${maximumCaseLimit} at this offset.`);
}
const selectedCases = manifest.cases.slice(caseOffset, caseOffset + caseLimit);

const provider = z.enum(["gemini", "openrouter"]).parse(process.env.ATLAS_PROVIDER ?? "gemini");
const modelId = process.env.ATLAS_MODEL_ID ?? process.env.ATLAS_GEMINI_MODEL_ID ?? "gemini-3.7-flash";
const protocolModel = protocol?.models.find((entry) => entry.modelId === modelId);
if (protocol && !protocolModel) throw new Error(`${modelId} is not in evaluation protocol ${protocol.id}.`);
const routingProvider = process.env.ATLAS_OPENROUTER_PROVIDER ?? protocolModel?.upstreamProvider;
if (provider === "openrouter" && !routingProvider) {
  throw new Error("ATLAS_OPENROUTER_PROVIDER is required so gateway routing is never ambiguous.");
}
if (protocolModel && routingProvider !== protocolModel.upstreamProvider) {
  throw new Error("Requested upstream provider does not match the frozen evaluation protocol.");
}
const estimatedCaseCostUsd =
  provider === "openrouter" ? Number(process.env.ATLAS_ESTIMATED_CASE_COST_USD ?? 0.25) : 0;
if (!Number.isFinite(estimatedCaseCostUsd) || estimatedCaseCostUsd < 0) {
  throw new Error("ATLAS_ESTIMATED_CASE_COST_USD must be a finite non-negative number.");
}
const systemMessage =
  "This is a controlled visual diagnostic. Inspect only the supplied media and return exactly one of the allowed answers. Do not explain your answer.";
const jobs: EvaluationJob[] = await Promise.all(
  selectedCases.map(async (entry) => {
    const bytes = new Uint8Array(await readFile(resolve(entry.artifact)));
    return {
      request: {
        provider,
        modelId,
        failureModeId: entry.failureModeId,
        generator: entry.generator,
        seed: entry.seed,
        difficulty: entry.difficulty,
        variant: entry.variant,
        inputCondition: entry.mimeType.startsWith("video/") ? "native-video" : "native-image",
        estimatedCostUsd: estimatedCaseCostUsd,
        systemMessage,
        prompt: `${entry.question}\nAllowed answers: ${entry.answerOptions.join(", ")}.`,
        temperature: protocol?.temperature ?? 0,
        maxOutputTokens: protocol?.maxOutputTokens ?? 128,
        trial: 1,
        reasoningEffort: protocol?.reasoning?.effort,
        excludeReasoning: protocol?.reasoning?.exclude,
        routingProvider,
        allowProviderFallbacks: protocol?.allowProviderFallbacks ?? false,
        dataCollection: protocol?.dataCollection ?? "deny",
      },
      media: {
        mimeType: entry.mimeType,
        bytes,
        sha256: entry.sha256,
        durationMs: entry.durationMs,
        preprocessingNotes: [
          `Exact ${manifest.renderer} artifact`,
          entry.mimeType.startsWith("video/") ? `${manifest.fps} FPS H.264 source` : "700×500 PNG source",
        ],
      },
      expectedAnswer: entry.expectedAnswer,
      answerOptions: entry.answerOptions,
      generatorVersion: manifest.generatorVersion,
      artifactPath: `/${entry.artifact.replace(/^public\//, "")}`,
      evaluationPlanId: manifest.id,
      evaluationPlanSha256: manifest.planSha256,
      evaluationProtocolId: protocol?.id,
      evaluationProtocolSha256: protocolSha256,
    };
  }),
);

const output = resolve(`evaluation/results/${manifest.id}.jsonl`);
const records = await runEvaluationBatch(jobs, {
  adapter: provider === "gemini" ? geminiAdapter : openRouterAdapter,
  store: new JsonlEvaluationStore(output),
  minimumIntervalMs: Number(process.env.ATLAS_MINIMUM_INTERVAL_MS ?? 4000),
  onProgress: ({ completed, total, cached }) =>
    process.stdout.write(`[${completed}/${total}] ${cached ? "cached" : "recorded"}\n`),
});

const publishedPath = resolve("src/data/published-runs.json");
const existing = z.array(evaluationRunSchema).parse(JSON.parse(await readFile(publishedPath, "utf8")));
const byId = new Map(existing.map((record) => [record.id, record]));
for (const record of records) byId.set(record.id, record);
const admitted = protocol
  ? [...byId.values()].filter((record) => record.evaluationProtocolId === protocol.id)
  : [...byId.values()];
const published = admitted.sort((left, right) => left.evaluatedAt.localeCompare(right.evaluatedAt));
await writeFile(publishedPath, `${JSON.stringify(published, null, 2)}\n`);

const verified = records.filter((record) => record.status === "verified");
console.log(
  JSON.stringify(
    {
      modelId,
      evaluationProtocolId: protocol?.id,
      evaluationProtocolSha256: protocolSha256,
      records: records.length,
      verified: verified.length,
      correct: verified.filter((record) => record.correct).length,
      pendingReview: records.filter((record) => record.status === "pending-review").length,
      costUsd: records.reduce((sum, record) => sum + record.costUsd, 0),
      output,
      publishedPath,
      mediaTypes: [...new Set(records.map((record) => extname(record.artifactPath ?? "")))],
    },
    null,
    2,
  ),
);
