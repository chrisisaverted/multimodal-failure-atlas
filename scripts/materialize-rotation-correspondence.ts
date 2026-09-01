import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  renderRotationCorrespondenceSvg,
  rotationCorrespondenceCandidateSchema,
  rotationCorrespondenceVersion,
} from "../src/lib/discovery/rotation-correspondence";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/rotation-correspondence-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(rotationCorrespondenceVersion),
    status: z.string().optional(),
    candidates: z.array(rotationCorrespondenceCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const conditions = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const oracle of conditions) {
    const artifact = join(output, `${candidate.id}${oracle ? "-oracle" : ""}.png`);
    await sharp(Buffer.from(renderRotationCorrespondenceSvg(candidate, oracle)))
      .png()
      .toFile(artifact);
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: oracle ? "correct-candidate-highlighted" : "native-image",
      interventionDescription: oracle
        ? "The exact rotation-equivalent candidate is outlined in blue."
        : "One exact rotation match appears among reflection and vertex-perturbation distractors.",
      failureModeId: candidate.failureModeId,
      generator: "rotation-correspondence",
      seed: candidate.seed,
      difficulty: Math.min(
        100,
        candidate.parameters.vertices * 4 + Math.round((0.2 - candidate.parameters.perturbation) * 200),
      ),
      variant: index + (oracle ? 100 : 0),
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: "image/png",
      question: candidate.question,
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      parameters: candidate.parameters,
      humanSolvability: candidate.humanSolvability,
      systemMessage: oracle
        ? "The exact matching candidate is outlined in blue. Return exactly one allowed answer."
        : "Compare exact shape geometry under rotation only. Return exactly one allowed answer without explanation.",
    });
  }
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify(
    {
      id: plan.id,
      planSha256: sha256(bytes),
      generatorVersion: plan.generatorVersion,
      renderer: "rotation-correspondence-svg-v1",
      fps: 0,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, cases: cases.length });
