import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { renderWireTracingSvg, wireTracingCandidateSchema, wireTracingGeneratorVersion } from "../src/lib/discovery/wire-tracing";
import { sha256 } from "../src/lib/evaluation/hash";
const planPath = resolve(process.argv[2] ?? "evaluation/discovery/wire-tracing-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z.object({ id: z.string(), generatorVersion: z.string(), candidates: z.array(wireTracingCandidateSchema) }).parse(JSON.parse(bytes.toString()));
if (plan.generatorVersion !== wireTracingGeneratorVersion) throw new Error("Stale plan.");
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const artifact = join(output, `${candidate.id}.png`);
  await sharp(Buffer.from(renderWireTracingSvg(candidate))).png().toFile(artifact);
  cases.push({ candidateId: candidate.id, cellId: candidate.cellId, split: candidate.split, condition: "native-image", interventionDescription: "Four continuous same-color wires with explicit non-joining crossings.", failureModeId: candidate.failureModeId, generator: "identity-occlusion", seed: candidate.seed, difficulty: Math.min(100, 20 + candidate.parameters.crossings * 2), variant: index, artifact: artifact.slice(resolve(".").length + 1), mimeType: "image/png", question: candidate.question, answerOptions: candidate.answerOptions, expectedAnswer: candidate.expectedAnswer, sha256: sha256(new Uint8Array(await readFile(artifact))), parameters: candidate.parameters, humanSolvability: candidate.humanSolvability, systemMessage: "This is an exact visual path-tracing diagnostic. Follow the requested continuous wire through every crossing and return exactly one allowed endpoint symbol without explanation." });
}
await writeFile(join(output, "manifest.json"), `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "wire-tracing-svg-v1", fps: 0, cases }, null, 2)}\n`);
console.log(JSON.stringify({ output, cases: cases.length }, null, 2));
