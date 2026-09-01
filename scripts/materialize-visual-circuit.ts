import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  renderVisualCircuitSvg,
  visualCircuitCandidateSchema,
  visualCircuitVersion,
} from "../src/lib/discovery/visual-circuit";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/visual-circuit-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(visualCircuitVersion),
    status: z.string(),
    candidates: z.array(visualCircuitCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];

for (const candidate of plan.candidates) {
  const conditions = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const oracle of conditions) {
    const artifact = join(output, `${candidate.id}${oracle ? "-oracle" : ""}.png`);
    await sharp(Buffer.from(renderVisualCircuitSvg(candidate, oracle)))
      .png()
      .toFile(artifact);
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: oracle ? "intermediate-values-revealed" : "native-image",
      interventionDescription: oracle
        ? "Every gate is annotated with its correct intermediate output bit."
        : "Only the input bits, gate types, wiring, and output labels are visible.",
      failureModeId: candidate.failureModeId,
      generator: "visual-circuit",
      seed: candidate.seed,
      difficulty: 88,
      variant: candidate.parameters.visualVariant + (oracle ? 1000 : 0),
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: "image/png",
      question: candidate.question,
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      parameters: candidate.parameters,
      humanSolvability: candidate.humanSolvability,
      systemMessage: oracle
        ? "Read the yellow intermediate values and evaluate the final output gates. Return exactly one allowed two-bit answer."
        : "Follow the visible wires and evaluate every Boolean gate. Return exactly one allowed two-bit answer without explanation.",
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
      renderer: "visual-circuit-svg-v1",
      fps: 0,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, cases: cases.length });
