import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  enclosurePanelsCandidateSchema,
  enclosurePanelsVersion,
  renderEnclosurePanelsSvg,
} from "../src/lib/discovery/enclosure-panels";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/enclosure-panels-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(enclosurePanelsVersion),
    status: z.string(),
    candidates: z.array(enclosurePanelsCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const candidate of plan.candidates) {
  const conditions = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const oracle of conditions) {
    const artifact = join(output, `${candidate.id}${oracle ? "-oracle" : ""}.png`);
    await sharp(Buffer.from(renderEnclosurePanelsSvg(candidate, oracle)))
      .png()
      .toFile(artifact);
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: oracle ? "numbered-closed-boundaries" : "native-image",
      interventionDescription: oracle
        ? "Every closed boundary in every panel is highlighted and numbered."
        : "Every panel contains the same four depth values across the scene, plus open fragments.",
      failureModeId: candidate.failureModeId,
      generator: "enclosure-panels",
      seed: candidate.seed,
      difficulty: 84,
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
        ? "Use the highlighted boundary numbers. Return exactly one allowed panel letter."
        : "Count only complete closed boundaries in each panel. Return exactly one allowed panel letter without explanation.",
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
      renderer: "enclosure-panels-svg-v1",
      fps: 0,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, cases: cases.length });
