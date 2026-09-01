import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import admitted from "../src/data/admitted-families.json" with { type: "json" };
import study from "../src/data/human-study-manifest.json" with { type: "json" };
import { scoreHumanStudy, type HumanSourceBinding } from "../src/lib/human-study-scoring";

const sourceManifestSchema = z.object({
  cases: z.array(
    z.object({
      candidateId: z.string(),
      condition: z.string(),
      expectedAnswer: z.string(),
      answerOptions: z.array(z.string()),
      sha256: z.string(),
      question: z.string(),
    }),
  ),
});

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const inputDirectory = argument("--input");
const outputPath = argument("--output") ?? "evaluation/human-study-summary.json";
const allowPartial = process.argv.includes("--allow-partial");
if (!inputDirectory) throw new Error("Usage: npm run score:human-study -- --input <packet-directory>");

const sourceByCandidate = new Map<string, HumanSourceBinding>();
for (const family of admitted.families) {
  const source = sourceManifestSchema.parse(
    JSON.parse(await readFile(resolve(`public/evaluations/${family.planId}/manifest.json`), "utf8")),
  );
  for (const candidate of source.cases.filter(
    (candidate) => candidate.condition === family.nativeCondition,
  )) {
    if (sourceByCandidate.has(candidate.candidateId))
      throw new Error(`Duplicate native candidateId ${candidate.candidateId}`);
    sourceByCandidate.set(candidate.candidateId, {
      expectedAnswer: candidate.expectedAnswer,
      mediaSha256: candidate.sha256,
      answerOptions: candidate.answerOptions,
      question: candidate.question,
    });
  }
}

const packetNames = (await readdir(resolve(inputDirectory))).filter((name) => name.endsWith(".json"));
if (!packetNames.length) throw new Error(`No JSON response packets in ${resolve(inputDirectory)}`);
const packets = await Promise.all(
  packetNames.map(async (name) => ({
    name,
    packet: JSON.parse(await readFile(resolve(inputDirectory, name), "utf8")) as unknown,
  })),
);
const summary = scoreHumanStudy({
  study,
  families: admitted.families,
  sourceByCandidate,
  packets,
  allowPartial,
});
await writeFile(resolve(outputPath), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary));
