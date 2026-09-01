import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { mazePanelEdges, mazeReachabilityCandidateSchema, mazeReachabilityVersion, renderMazeReachabilitySvg } from "../src/lib/discovery/maze-reachability";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/maze-reachability-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z.object({ id: z.string(), generatorVersion: z.literal(mazeReachabilityVersion), status: z.string(), candidates: z.array(mazeReachabilityCandidateSchema) }).parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const truth = Array.from({ length: 4 }, (_, panel) => mazePanelEdges(candidate, panel));
  if (truth.some((edges) => edges.size !== candidate.parameters.mazeSize ** 2 - 1)) throw new Error("Panel edge counts are not matched.");
  const controls = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const oracle of controls) {
    const artifact = join(output, `${candidate.id}${oracle ? "-oracle" : ""}.png`);
    await sharp(Buffer.from(renderMazeReachabilitySvg(candidate, oracle))).png().toFile(artifact);
    cases.push({ candidateId: candidate.id, cellId: candidate.cellId, split: candidate.split, condition: oracle ? "solution-path-highlighted" : "native-image", interventionDescription: oracle ? "The valid S-to-G route is highlighted in blue." : "Four edge-count-matched mazes; one retains S-to-G connectivity.", failureModeId: candidate.failureModeId, generator: "maze-reachability", seed: candidate.seed, difficulty: oracle ? 0 : candidate.parameters.mazeSize * 5, variant: index + (oracle ? 100 : 0), artifact: artifact.slice(resolve(".").length + 1), mimeType: "image/png", question: candidate.question, answerOptions: candidate.answerOptions, expectedAnswer: candidate.expectedAnswer, sha256: sha256(new Uint8Array(await readFile(artifact))), parameters: candidate.parameters, humanSolvability: candidate.humanSolvability, systemMessage: oracle ? "The valid route is highlighted. Return exactly one allowed panel letter." : "Trace maze connectivity from S to G. Return exactly one allowed panel letter and do not explain." });
  }
}
await writeFile(join(output, "manifest.json"), `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "maze-reachability-svg-v1", fps: 0, cases }, null, 2)}\n`);
console.log({ output, cases: cases.length });
