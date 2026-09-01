import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const execute = process.argv.includes("--execute");
const modelId = process.env.ATLAS_MODEL_ID;
const provider = process.env.ATLAS_OPENROUTER_PROVIDER;
if (!modelId || !provider) throw new Error("ATLAS_MODEL_ID and ATLAS_OPENROUTER_PROVIDER are required");
if (!execute) throw new Error("Pass --execute after reviewing the frozen replication protocols");

const evidence = z
  .object({ families: z.array(z.object({ planId: z.string() })) })
  .parse(JSON.parse(await readFile(resolve("src/data/admitted-families.json"), "utf8")));
const manifestSchema = z.object({
  cases: z.array(z.object({ seed: z.number().int(), condition: z.string() })),
});
const resultDirectories = [
  "evaluation/results/replication-v1",
  "evaluation/results/replication-v1-completion",
];

function conditionOf(run: EvaluationRunRecord) {
  return (
    run.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? run.inputCondition
  );
}

async function existingRuns() {
  const paths = (
    await Promise.all(
      resultDirectories.map(async (directory) => {
        try {
          return (await readdir(resolve(directory)))
            .filter((name) => name.endsWith(".jsonl"))
            .map((name) => resolve(directory, name));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
          throw error;
        }
      }),
    )
  ).flat();
  return (
    await Promise.all(
      paths.map(async (path) =>
        (await readFile(path, "utf8"))
          .split("\n")
          .filter(Boolean)
          .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
      ),
    )
  ).flat();
}

function contiguousRanges(indices: number[]) {
  const ranges: Array<{ offset: number; limit: number }> = [];
  for (const index of indices) {
    const previous = ranges.at(-1);
    if (previous && previous.offset + previous.limit === index) previous.limit += 1;
    else ranges.push({ offset: index, limit: 1 });
  }
  return ranges;
}

function runRange(planId: string, offset: number, limit: number) {
  const modelSlug = modelId!
    .replaceAll(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return new Promise<void>((resolvePromise, reject) => {
    const child = spawn(
      "npm",
      ["run", "evaluate:discovery", "--", `public/evaluations/${planId}/manifest.json`, "--execute"],
      {
        cwd: process.cwd(),
        stdio: "inherit",
        env: {
          ...process.env,
          ATLAS_MODEL_ID: modelId,
          ATLAS_OPENROUTER_PROVIDER: provider,
          ATLAS_EVALUATION_PROTOCOL_PATH: `evaluation/plans/replication-v1-completion/${planId}.json`,
          ATLAS_DISCOVERY_RESULTS_PATH: `evaluation/results/replication-v1-completion/${planId}-${modelSlug}.jsonl`,
          ATLAS_CASE_OFFSET: String(offset),
          ATLAS_CASE_LIMIT: String(limit),
          ATLAS_PROVIDER_TIMEOUT_MS: "600000",
          ATLAS_ESTIMATED_CASE_COST_USD: modelId!.includes("seed-2-1") ? "0.05" : "0.01",
        },
      },
    );
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`${planId} range ${offset}+${limit} exited ${code}`)),
    );
  });
}

for (const [familyIndex, { planId }] of evidence.families.entries()) {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(resolve(`public/evaluations/${planId}/manifest.json`), "utf8")),
  );
  const runs = (await existingRuns()).filter(
    (run) => run.modelId === modelId && run.evaluationPlanId === planId,
  );
  const missing = manifest.cases.flatMap((candidate, index) => {
    const answered = runs.some(
      (run) =>
        run.seed === candidate.seed &&
        conditionOf(run) === candidate.condition &&
        run.status === "verified" &&
        !run.emptyResponse,
    );
    return answered ? [] : [index];
  });
  process.stdout.write(
    `[family ${familyIndex + 1}/${evidence.families.length}] ${planId}: ${missing.length} missing\n`,
  );
  for (const { offset, limit } of contiguousRanges(missing)) await runRange(planId, offset, limit);
}
