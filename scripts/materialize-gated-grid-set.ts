import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import {
  gatedGridSetCandidateSchema,
  gatedGridSetVersion,
  gatedGridTargetSet,
  renderGatedGridSetSvg,
} from "../src/lib/discovery/gated-grid-set-cardinality";
import { sha256 } from "../src/lib/evaluation/hash";
import { encodeSvgVideo } from "./lib/encode-svg-video";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/gated-grid-set-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(gatedGridSetVersion),
    status: z.string(),
    candidates: z.array(gatedGridSetCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
const confirmatory = plan.status === "frozen-confirmatory-holdout";
for (const [index, candidate] of plan.candidates.entries()) {
  if (
    gatedGridTargetSet(candidate.parameters.events, candidate.parameters.targetGate).size !==
    candidate.parameters.uniqueTargetCount
  )
    throw new Error("Gated grid-set oracle mismatch");
  for (const control of confirmatory ? [false, true] : [false]) {
    const suffix = control ? "-set-control" : "";
    const artifact = join(output, `${candidate.id}${suffix}.mp4`);
    await encodeSvgVideo({
      target: artifact,
      fps: candidate.parameters.fps,
      durationMs: candidate.parameters.videoDurationMs,
      render: (timestampMs) => renderGatedGridSetSvg(candidate, timestampMs, control),
    });
    cases.push({
      candidateId: `${candidate.id}${suffix}`,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: control ? "persistent-target-set-control" : "native-1x",
      interventionDescription: control
        ? "Only cells observed under the target frame color persist, with their exact running set size."
        : "Forty brief flashes balance frame colors and echo eight target cells under the wrong color.",
      failureModeId: candidate.failureModeId,
      generator: "gated-grid-set-cardinality",
      seed: candidate.seed,
      difficulty: control ? 5 : 97,
      variant: index + (control ? 100 : 0),
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: "video/mp4",
      durationMs: candidate.parameters.videoDurationMs,
      question: candidate.question,
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      parameters: candidate.parameters,
      humanSolvability: candidate.humanSolvability,
      systemMessage: control
        ? "Read the final TARGET SET SIZE and return exactly one allowed count."
        : "Track only distinct cells flashed under the displayed target frame color and return exactly one allowed count.",
    });
  }
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "gated-grid-set-svg-raster-v1", fps: 30, cases }, null, 2)}\n`,
);
console.log({ output, cases: cases.length });
