import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import {
  eulerCandidateSchema,
  eulerGraphVersion,
  graphDegrees,
  renderEulerSvg,
} from "../src/lib/discovery/euler-graph";
import { sha256 } from "../src/lib/evaluation/hash";
const planPath = resolve(process.argv[2] ?? "evaluation/discovery/euler-graph-discovery-v1.json"),
  bytes = await readFile(planPath),
  plan = z
    .object({
      id: z.string(),
      generatorVersion: z.literal(eulerGraphVersion),
      status: z.string(),
      candidates: z.array(eulerCandidateSchema),
    })
    .parse(JSON.parse(bytes.toString())),
  output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
const confirmatory = plan.status.includes("confirmatory");
for (const [index, candidate] of plan.candidates.entries()) {
  const valid = candidate.parameters.panels.map((edges) =>
    graphDegrees(edges).every((degree) => degree % 2 === 0),
  );
  if (valid.filter(Boolean).length !== 1 || !valid[candidate.parameters.correctPanel])
    throw new Error("Euler oracle mismatch");
  for (const oracle of confirmatory ? [false, true] : [false]) {
    const suffix = oracle ? "-oracle" : "";
    const artifact = join(output, `${candidate.id}${suffix}.png`);
    await sharp(Buffer.from(renderEulerSvg(candidate, oracle)))
      .png()
      .toFile(artifact);
    cases.push({
      candidateId: `${candidate.id}${suffix}`,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: oracle ? "correct-graph-ringed" : "native-image",
      interventionDescription: oracle
        ? "The unique even-degree graph is ringed in green."
        : "Four independently rendered dense graphs differ in degree parity; edge crossings are non-vertices.",
      failureModeId: candidate.failureModeId,
      generator: "euler-graph",
      seed: candidate.seed,
      difficulty: oracle ? 5 : 87,
      variant: index,
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: "image/png",
      question: candidate.question,
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      parameters: {
        correctPanel: candidate.parameters.correctPanel,
        visualVariant: candidate.parameters.visualVariant,
      },
      humanSolvability: candidate.humanSolvability,
      systemMessage: oracle
        ? "The correct graph is ringed in green. Return its option letter."
        : "An undirected connected graph has an Eulerian circuit exactly when every vertex has even degree. Inspect the drawn edges, treating only dots as vertices. Return one option letter.",
    });
  }
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "euler-graph-svg-raster-v1", fps: 0, cases }, null, 2)}\n`,
);
console.log({ output, cases: cases.length });
