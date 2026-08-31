import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { z } from "zod";
import { getAdapter } from "../src/lib/evaluation/adapters/registry";
import type { EvaluationJob } from "../src/lib/evaluation/runner";
import { runEvaluationBatch } from "../src/lib/evaluation/runner";
import { evaluationRequestSchema } from "../src/lib/evaluation/schema";
import { JsonlEvaluationStore } from "../src/lib/evaluation/store";
import { generateInstance, generatorVersion } from "../src/lib/generators";

const planSchema = z.object({
  provider: evaluationRequestSchema.shape.provider,
  modelId: z.string().min(1),
  systemMessage: z.string().min(1),
  temperature: z.number().min(0).max(2).default(0),
  maxOutputTokens: z.number().int().positive().default(64),
  minimumIntervalMs: z.number().int().nonnegative().default(250),
  cases: z.array(
    z.object({
      failureModeId: z.string().min(1),
      generator: evaluationRequestSchema.shape.generator,
      seed: z.number().int().nonnegative(),
      difficulty: z.number().min(0).max(100),
      variant: z.number().int().nonnegative(),
      trial: z.number().int().positive().default(1),
      inputCondition: evaluationRequestSchema.shape.inputCondition,
      artifact: z.string().min(1),
      durationMs: z.number().positive().optional(),
      estimatedCostUsd: z.number().nonnegative(),
      preprocessingNotes: z.array(z.string()).default([]),
    }),
  ),
});

const mimeTypes: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

const args = process.argv.slice(2);
const planArgument = args.find((argument) => !argument.startsWith("--"));
const execute = args.includes("--execute");
const outputIndex = args.indexOf("--output");
const outputPath = resolve(
  outputIndex >= 0 ? (args[outputIndex + 1] ?? "") : "evaluation/results/runs.jsonl",
);

if (!planArgument) {
  throw new Error(
    "Usage: npm run evaluate -- evaluation/plans/<plan>.json [--execute] [--output <runs.jsonl>]",
  );
}

const planPath = resolve(planArgument);
const plan = planSchema.parse(JSON.parse(await readFile(planPath, "utf8")));
const adapter = getAdapter(plan.provider);

if (plan.provider !== "fixture") {
  throw new Error(
    "This reference-artifact CLI is intentionally fixture-only. Real runs must materialize seed-specific media and call the audited runner library directly.",
  );
}

const jobs: EvaluationJob[] = await Promise.all(
  plan.cases.map(async (entry) => {
    const artifactPath = resolve(entry.artifact);
    const artifactStat = await stat(artifactPath);
    if (artifactStat.size > 100 * 1024 * 1024)
      throw new Error(`${entry.artifact} exceeds the 100 MB runner limit.`);
    const bytes = new Uint8Array(await readFile(artifactPath));
    const instance = generateInstance(entry.generator, entry);
    const options = instance.answerOptions ?? [instance.answer];
    return {
      request: evaluationRequestSchema.parse({
        provider: plan.provider,
        modelId: plan.modelId,
        failureModeId: entry.failureModeId,
        generator: entry.generator,
        seed: entry.seed,
        difficulty: entry.difficulty,
        variant: entry.variant,
        inputCondition: entry.inputCondition,
        estimatedCostUsd: entry.estimatedCostUsd,
        systemMessage: plan.systemMessage,
        prompt: `${instance.question}\nAllowed answers: ${options.join(", ")}.`,
        temperature: plan.temperature,
        maxOutputTokens: plan.maxOutputTokens,
        trial: entry.trial,
      }),
      media: {
        mimeType: mimeTypes[extname(artifactPath).toLowerCase()] ?? "application/octet-stream",
        bytes,
        durationMs: entry.durationMs,
        preprocessingNotes: entry.preprocessingNotes,
      },
      expectedAnswer: instance.answer,
      answerOptions: options,
      generatorVersion,
    };
  }),
);

const estimatedCeiling = plan.cases.reduce((sum, entry) => sum + entry.estimatedCostUsd, 0);
if (!execute) {
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "preflight-only",
        plan: planPath,
        provider: plan.provider,
        modelId: plan.modelId,
        cases: jobs.length,
        declaredCostCeilingUsd: estimatedCeiling,
        adapter: adapter.availability(),
        next: "Re-run with --execute only after reviewing the plan and cost ceiling.",
      },
      null,
      2,
    )}\n`,
  );
} else {
  const store = new JsonlEvaluationStore(outputPath);
  const results = await runEvaluationBatch(jobs, {
    adapter,
    store,
    minimumIntervalMs: plan.minimumIntervalMs,
    onProgress: ({ completed, total, cached }) =>
      process.stdout.write(`[${completed}/${total}] ${cached ? "cached" : "recorded"}\n`),
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        mode: "executed",
        output: outputPath,
        records: results.length,
        costUsd: results.reduce((sum, result) => sum + result.costUsd, 0),
      },
      null,
      2,
    )}\n`,
  );
}
