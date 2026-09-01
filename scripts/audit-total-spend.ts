import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";
import { auditUniqueSpend } from "../src/lib/evaluation/spend-audit";

const resultsRoot = resolve("evaluation/results");
const names = (await readdir(resultsRoot, { recursive: true })).filter((name) => name.endsWith(".jsonl"));
const runs = (
  await Promise.all(
    names.map(async (name) => {
      const path = resolve(resultsRoot, name);
      return (await readFile(path, "utf8"))
        .split("\n")
        .filter(Boolean)
        .map((line, index) => {
          const parsed = evaluationRunSchema.safeParse(JSON.parse(line));
          if (!parsed.success)
            throw new Error(`${name}:${index + 1}: invalid evaluation record: ${parsed.error.message}`);
          return { ...parsed.data, sourceRecordKey: `${name}:${index + 1}` };
        });
    }),
  )
).flat();

const budgetUsd = Number.parseFloat(process.env.ATLAS_TOTAL_EXPERIMENT_BUDGET_USD ?? "500");
const audit = auditUniqueSpend(runs, budgetUsd);
console.log(JSON.stringify({ files: names.length, ...audit }));
