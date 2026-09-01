import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  changeLocalizationCandidateSchema,
  changeLocalizationVersion,
  renderChangeLocalizationSvg,
} from "../src/lib/discovery/change-localization";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/change-localization-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(changeLocalizationVersion),
    status: z.string().optional(),
    candidates: z.array(changeLocalizationCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const conditions = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const oracle of conditions) {
    const artifact = join(output, `${candidate.id}${oracle ? "-oracle" : ""}.png`);
    await sharp(Buffer.from(renderChangeLocalizationSvg(candidate, oracle)))
      .png()
      .toFile(artifact);
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: oracle ? "changed-glyph-circled" : "native-image",
      interventionDescription: oracle
        ? "The one changed glyph is circled in the comparison grid."
        : "Two dense grids differ by one 90-degree glyph rotation.",
      failureModeId: candidate.failureModeId,
      generator: "dense-change-localization",
      seed: candidate.seed,
      difficulty: Math.min(100, candidate.parameters.gridSize * 3),
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
        ? "The changed glyph is circled. Return exactly one quadrant label."
        : "Compare the two grids exhaustively and return exactly one allowed quadrant label without explanation.",
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
      renderer: "dense-change-localization-svg-v1",
      fps: 0,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, cases: cases.length });
