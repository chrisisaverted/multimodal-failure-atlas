import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  renderXorSvg,
  xorCandidateSchema,
  xorCompositionHardVersion,
  xorCompositionVersion,
  xorMatrices,
} from "../src/lib/discovery/xor-composition";
import { sha256 } from "../src/lib/evaluation/hash";
const planPath = resolve(process.argv[2] ?? "evaluation/discovery/xor-composition-discovery-v1.json"),
  bytes = await readFile(planPath),
  plan = z
    .object({
      id: z.string(),
      generatorVersion: z.enum([xorCompositionVersion, xorCompositionHardVersion]),
      status: z.string(),
      candidates: z.array(xorCandidateSchema),
    })
    .parse(JSON.parse(bytes.toString())),
  output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const { truth, panels } = xorMatrices(candidate);
  if (panels.filter((panel) => JSON.stringify(panel) === JSON.stringify(truth)).length !== 1)
    throw new Error("XOR oracle mismatch");
  for (const control of plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false]) {
    const artifact = join(output, `${candidate.id}${control ? "-control" : ""}.png`);
    await sharp(Buffer.from(renderXorSvg(candidate, control)))
      .png()
      .toFile(artifact);
    cases.push({
    candidateId: candidate.id,
    cellId: candidate.cellId,
    split: candidate.split,
    condition: control ? "oracle-boxed-control" : "native-image",
    interventionDescription: control
      ? "The exact XOR output is explicitly boxed in green."
      : "Two dense binary inputs and four near-matching output candidates are shown together.",
    failureModeId: candidate.failureModeId,
    generator: "xor-composition",
    seed: candidate.seed,
    difficulty: control ? 0 : candidate.parameters.size === 20 ? 98 : 91,
    variant: index + (control ? 100 : 0),
    artifact: artifact.slice(resolve(".").length + 1),
    mimeType: "image/png",
    question: candidate.question,
    answerOptions: candidate.answerOptions,
    expectedAnswer: candidate.expectedAnswer,
    sha256: sha256(new Uint8Array(await readFile(artifact))),
    parameters: candidate.parameters,
    humanSolvability: candidate.humanSolvability,
    systemMessage: control
      ? "The correct output is explicitly boxed in green. Return exactly its option letter."
      : "Apply XOR independently to every aligned cell. Return exactly one option letter and do not explain.",
    });
  }
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: plan.status === "frozen-confirmatory-holdout" ? "xor-composition-svg-raster-v2-with-oracle-control" : "xor-composition-svg-raster-v1", fps: 0, cases }, null, 2)}\n`,
);
console.log({ output, cases: cases.length });
