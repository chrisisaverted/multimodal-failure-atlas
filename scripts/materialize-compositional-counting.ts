import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  compositionalCountingCandidateSchema,
  compositionalCountingGeneratorVersion,
  renderCompositionalCountingSvg,
} from "../src/lib/discovery/compositional-counting";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/compositional-counting-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z.object({ id: z.string(), generatorVersion: z.string(), candidates: z.array(compositionalCountingCandidateSchema) }).parse(JSON.parse(bytes.toString()));
if (plan.generatorVersion !== compositionalCountingGeneratorVersion) throw new Error("Stale plan.");
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const artifact = join(output, `${candidate.id}.png`);
  await sharp(Buffer.from(renderCompositionalCountingSvg(candidate))).png().toFile(artifact);
  cases.push({
    candidateId: candidate.id, cellId: candidate.cellId, split: candidate.split,
    condition: "native-image", interventionDescription: "Exact generated grid without target highlighting.",
    failureModeId: candidate.failureModeId, generator: "numerosity-density", seed: candidate.seed,
    difficulty: Math.round(candidate.parameters.gridSize * 4 + candidate.parameters.hardNegativeRate * 25), variant: index,
    artifact: artifact.slice(resolve(".").length + 1), mimeType: "image/png", question: candidate.question,
    answerOptions: candidate.answerOptions, expectedAnswer: candidate.expectedAnswer,
    sha256: sha256(new Uint8Array(await readFile(artifact))), parameters: candidate.parameters,
    humanSolvability: candidate.humanSolvability,
    systemMessage: "This is an exact visual counting diagnostic. Inspect the entire grid, bind all three requested attributes, and return exactly one allowed count without explanation.",
  });
  process.stdout.write(`[${index + 1}/${plan.candidates.length}] ${candidate.id}\n`);
}
await writeFile(join(output, "manifest.json"), `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "compositional-counting-svg-v1", fps: 0, cases }, null, 2)}\n`);
console.log(JSON.stringify({ output, cases: cases.length }, null, 2));
