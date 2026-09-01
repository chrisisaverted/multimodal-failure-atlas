import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  enclosureDepthCandidateSchema,
  enclosureDepthVersion,
  renderEnclosureDepthSvg,
} from "../src/lib/discovery/enclosure-depth";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/enclosure-depth-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(enclosureDepthVersion),
    status: z.string().optional(),
    candidates: z.array(enclosureDepthCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const conditions = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const oracle of conditions) {
    const artifact = join(output, `${candidate.id}${oracle ? "-oracle" : ""}.png`);
    await sharp(Buffer.from(renderEnclosureDepthSvg(candidate, oracle)))
      .png()
      .toFile(artifact);
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: oracle ? "numbered-closed-boundaries" : "native-image",
      interventionDescription: oracle
        ? "Every genuinely closed enclosing loop is highlighted and numbered."
        : "Closed loops and visually similar open contour fragments share the same scene.",
      failureModeId: candidate.failureModeId,
      generator: "enclosure-depth",
      seed: candidate.seed,
      difficulty: Math.min(100, candidate.parameters.enclosingLoops * 5 + candidate.parameters.openDecoys),
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
        ? "The true closed enclosing boundaries are highlighted and numbered. Return exactly one allowed answer."
        : "Distinguish complete closed boundaries from open contour fragments. Return exactly one allowed answer without explanation.",
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
      renderer: "enclosure-depth-svg-v1",
      fps: 0,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, cases: cases.length });
