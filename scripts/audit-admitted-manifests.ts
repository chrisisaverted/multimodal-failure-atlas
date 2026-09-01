import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import admitted from "../src/data/admitted-families.json" with { type: "json" };

const caseSchema = z.object({
  candidateId: z.string(),
  split: z.literal("confirmatory"),
  condition: z.string(),
  seed: z.number().int(),
  difficulty: z.number(),
  artifact: z.string().startsWith("public/evaluations/"),
  mimeType: z.enum(["image/png", "video/mp4"]),
  question: z.string(),
  answerOptions: z.array(z.string()).min(2),
  expectedAnswer: z.string(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});
const manifestSchema = z.object({
  id: z.string(),
  planSha256: z.string().regex(/^[a-f0-9]{64}$/),
  cases: z.array(caseSchema),
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function balanced(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const frequencies = [...counts.values()];
  return frequencies.length >= 2 && Math.max(...frequencies) - Math.min(...frequencies) <= 1;
}

let files = 0;
let bytes = 0;
for (const family of admitted.families) {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(resolve(`public/evaluations/${family.planId}/manifest.json`), "utf8")),
  );
  assert(manifest.id === family.planId, `${family.planId}: manifest id mismatch`);
  assert(manifest.planSha256 === family.planSha256, `${family.planId}: plan digest mismatch`);
  assert(manifest.cases.length === 32, `${family.planId}: expected 32 cases`);
  assert(
    new Set(manifest.cases.map((candidate) => candidate.seed)).size === 16,
    `${family.planId}: expected 16 paired seeds`,
  );
  const native = manifest.cases.filter((candidate) => candidate.condition === family.nativeCondition);
  const control = manifest.cases.filter((candidate) => candidate.condition === family.controlCondition);
  assert(native.length === 16 && control.length === 16, `${family.planId}: conditions must be 16 + 16`);
  assert(
    new Set(native.map((candidate) => candidate.candidateId)).size === 16 &&
      new Set(control.map((candidate) => candidate.candidateId)).size === 16,
    `${family.planId}: candidate ids must be unique within each condition`,
  );
  assert(
    balanced(native.map((candidate) => candidate.expectedAnswer)),
    `${family.planId}: native answers are not balanced`,
  );
  assert(
    balanced(control.map((candidate) => candidate.expectedAnswer)),
    `${family.planId}: control answers are not balanced`,
  );
  const nativeDifficultyValues = [...new Set(native.map((candidate) => candidate.difficulty))].sort(
    (left, right) => left - right,
  );
  assert(
    JSON.stringify(nativeDifficultyValues) === JSON.stringify(family.difficultySetting.values),
    `${family.planId}: published difficulty stratum mismatch`,
  );
  assert(
    family.difficultySetting.nativeCases === 16,
    `${family.planId}: published difficulty denominator mismatch`,
  );

  for (const seed of new Set(manifest.cases.map((candidate) => candidate.seed))) {
    const pair = manifest.cases.filter((candidate) => candidate.seed === seed);
    assert(pair.length === 2, `${family.planId}: seed ${seed} is not a pair`);
    assert(
      new Set(pair.map((candidate) => candidate.condition)).size === 2,
      `${family.planId}: seed ${seed} repeats a condition`,
    );
    assert(
      pair[0]!.expectedAnswer === pair[1]!.expectedAnswer,
      `${family.planId}: seed ${seed} changes the answer under control`,
    );
    assert(
      JSON.stringify(pair[0]!.answerOptions) === JSON.stringify(pair[1]!.answerOptions),
      `${family.planId}: seed ${seed} changes answer options under control`,
    );
  }

  for (const candidate of manifest.cases) {
    assert(
      candidate.answerOptions.includes(candidate.expectedAnswer),
      `${candidate.candidateId}: expected answer absent from options`,
    );
    const body = await readFile(resolve(candidate.artifact));
    const digest = createHash("sha256").update(body).digest("hex");
    assert(digest === candidate.sha256, `${candidate.candidateId}: media digest mismatch`);
    files += 1;
    bytes += body.byteLength;
  }
}

console.log(JSON.stringify({ families: admitted.families.length, cases: files, bytes, status: "verified" }));
