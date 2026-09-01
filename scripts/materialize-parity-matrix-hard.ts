import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  hardParityCandidateSchema,
  hardParityMatrices,
  hardParityVersion,
  hardParityViolations,
  renderHardParitySvg,
} from "../src/lib/discovery/parity-matrix-hard";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/confirmatory/parity-matrix-confirmatory-v2.json");
const bytes = await readFile(planPath);
const plan = z.object({
  id: z.string(),
  generatorVersion: z.literal(hardParityVersion),
  status: z.string(),
  candidates: z.array(hardParityCandidateSchema),
}).parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });

const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const validity = hardParityMatrices(candidate).map((matrix) => {
    const violations = hardParityViolations(matrix);
    return violations.oddRows.length === 0 && violations.oddColumns.length === 0;
  });
  if (validity.filter(Boolean).length !== 1 || !validity[candidate.parameters.correctPanel]) {
    throw new Error("Hard parity oracle mismatch");
  }
  for (const condition of ["native-image", "parity-audit-control"] as const) {
    const artifact = join(output, `${candidate.id}-${condition}.png`);
    await sharp(Buffer.from(renderHardParitySvg(candidate, condition === "parity-audit-control"))).png().toFile(artifact);
    cases.push({
      candidateId: `${candidate.id}-${condition}`,
      cellId: candidate.cellId,
      split: candidate.split,
      condition,
      interventionDescription: condition === "native-image"
        ? "Four dense 24×24 matrices require exact row-and-column parity verification."
        : "Diagnostic control highlights every odd row and column and labels each panel's audit result.",
      failureModeId: candidate.failureModeId,
      generator: "parity-matrix-hard",
      seed: candidate.seed,
      difficulty: condition === "native-image" ? 96 : 15,
      variant: index,
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: "image/png",
      question: candidate.question,
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      parameters: candidate.parameters,
      humanSolvability: candidate.humanSolvability,
      systemMessage: "Verify two-dimensional parity and return exactly one panel letter.",
    });
  }
}
await writeFile(join(output, "manifest.json"), `${JSON.stringify({
  id: plan.id,
  planSha256: sha256(bytes),
  generatorVersion: plan.generatorVersion,
  renderer: "parity-matrix-svg-raster-v2",
  fps: 0,
  cases,
}, null, 2)}\n`);
console.log({ output, cases: cases.length });
