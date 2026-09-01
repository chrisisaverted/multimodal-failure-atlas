import { mkdir, readFile, writeFile } from "node:fs/promises";
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

for (const family of evidence.families) {
  const protocol = {
    id: `${family.planId}-external-replication-v1`,
    cohortId: "external-replication-v1-2026-09-01",
    frozenAt: "2026-09-01T11:12:00.000Z",
    analysisRole: "Untouched post-confirmatory route replication; never used for generator selection.",
    evaluationPlanId: family.planId,
    evaluationPlanSha256: family.planSha256,
    temperature: 0,
    maxOutputTokens: 4096,
    reasoning: { effort: "minimal", exclude: true },
    scorer: "terminal-option-v3",
    allowProviderFallbacks: false,
    dataCollection: "deny",
    campaignCostCeilingUsd: 2,
    substantiveMinimumPerNativeCondition: 16,
    canaryPolicy: {
      cases: [0, 1],
      requireNativeAndControlSubstantiveBeforeFullRun: true,
    },
    models: cohort,
  };
  await writeFile(
    resolve(outputDirectory, `${family.planId}.json`),
    `${JSON.stringify(protocol, null, 2)}\n`,
    "utf8",
  );
}

console.log(
  JSON.stringify({ protocols: evidence.families.length, cohort: cohort.map(({ modelId }) => modelId) }),
);
