import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

const evidenceSchema = z.object({
  families: z.array(
    z.object({
      planId: z.string(),
      planSha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
});

const evidence = evidenceSchema.parse(
  JSON.parse(await readFile(resolve("src/data/admitted-families.json"), "utf8")),
);
const outputDirectory = resolve("evaluation/plans/replication-v1");
await mkdir(outputDirectory, { recursive: true });
const completionOutputDirectory = resolve("evaluation/plans/replication-v1-completion");
await mkdir(completionOutputDirectory, { recursive: true });
const answerOutputDirectory = resolve("evaluation/plans/replication-v1-no-reasoning");
await mkdir(answerOutputDirectory, { recursive: true });
const replacementOutputDirectory = resolve("evaluation/plans/replication-v1-mimo-replacement");
await mkdir(replacementOutputDirectory, { recursive: true });

const cohort = [
  {
    modelId: "z-ai/glm-5.3-flash",
    modelRevision: "z-ai/glm-5.3-flash-20260826",
    upstreamProvider: "Z.AI",
    quantization: "fp8",
  },
  {
    modelId: "bytedance-seed/seed-2-1-turbo",
    modelRevision: "bytedance-seed/seed-2-1-turbo-20260810",
    upstreamProvider: "Seed",
    quantization: "fp8",
  },
] as const;
const mimoReplacement = {
  modelId: "xiaomi/mimo-v2.5",
  modelRevision: "xiaomi/mimo-v2.5-20260422",
  upstreamProvider: "Xiaomi",
  quantization: "fp8",
} as const;

for (const family of evidence.families) {
  const common = {
    cohortId: "external-replication-v1-2026-09-01",
    analysisRole: "Untouched post-confirmatory route replication; never used for generator selection.",
    evaluationPlanId: family.planId,
    evaluationPlanSha256: family.planSha256,
    temperature: 0,
    reasoning: { effort: "minimal", exclude: true },
    scorer: "terminal-option-v3",
    allowProviderFallbacks: false,
    dataCollection: "deny",
    substantiveMinimumPerNativeCondition: 16,
    models: cohort,
  } as const;
  const protocol = {
    ...common,
    id: `${family.planId}-external-replication-v1`,
    frozenAt: "2026-09-01T11:12:00.000Z",
    maxOutputTokens: 4096,
    campaignCostCeilingUsd: 2,
    canaryPolicy: {
      cases: [0, 1],
      requireNativeAndControlSubstantiveBeforeFullRun: true,
    },
  };
  const completionProtocol = {
    ...common,
    id: `${family.planId}-external-replication-v1-completion`,
    frozenAt: "2026-09-01T11:18:00.000Z",
    amendmentReason:
      "Native canaries exhausted the 4,096-token allowance entirely on hidden reasoning. The original records remain immutable and non-substantive; this prospective protocol raises only the output allowance.",
    maxOutputTokens: 16384,
    campaignCostCeilingUsd: 5,
  };
  const answerProtocol = {
    ...common,
    id: `${family.planId}-external-replication-v1-no-reasoning`,
    frozenAt: "2026-09-01T11:27:00.000Z",
    amendmentReason:
      "Both added routes exhausted 16,384 hidden-reasoning tokens on native canaries without emitting an answer. Their non-substantive attempts remain immutable; this route-specific repair disables hidden reasoning, matching the answer-emission repair used for Kimi in the original cohort.",
    maxOutputTokens: 4096,
    reasoning: { effort: "none", exclude: true },
    campaignCostCeilingUsd: 2,
  };
  const replacementProtocol = {
    ...common,
    id: `${family.planId}-external-replication-v1-mimo-replacement`,
    cohortId: "external-replication-v1-mimo-replacement-2026-09-01",
    frozenAt: "2026-09-01T11:34:00.000Z",
    analysisRole:
      "Untouched post-confirmatory replacement route. GLM was operationally unscorable after 4,096- and 16,384-token answer-exhaustion canaries and rejection of no-reasoning mode; no GLM outcome affected generator selection.",
    maxOutputTokens: 4096,
    reasoning: { effort: "none", exclude: true },
    campaignCostCeilingUsd: 2,
    models: [mimoReplacement],
  };
  const protocolPath = resolve(outputDirectory, `${family.planId}.json`);
  try {
    await access(protocolPath);
  } catch {
    await writeFile(protocolPath, `${JSON.stringify(protocol, null, 2)}\n`, "utf8");
  }
  await writeFile(
    resolve(completionOutputDirectory, `${family.planId}.json`),
    `${JSON.stringify(completionProtocol, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    resolve(replacementOutputDirectory, `${family.planId}.json`),
    `${JSON.stringify(replacementProtocol, null, 2)}\n`,
    "utf8",
  );
  await writeFile(
    resolve(answerOutputDirectory, `${family.planId}.json`),
    `${JSON.stringify(answerProtocol, null, 2)}\n`,
    "utf8",
  );
}

console.log(
  JSON.stringify({
    protocols: evidence.families.length,
    completionProtocols: evidence.families.length,
    noReasoningProtocols: evidence.families.length,
    replacementProtocols: evidence.families.length,
    cohort: cohort.map(({ modelId }) => modelId),
  }),
);
