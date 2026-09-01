import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";
import {
  exactFrequencyCount,
  gatedGridFrequencyCandidateSchema,
  gatedGridFrequencyVersion,
  renderGatedGridFrequencySvg,
} from "../src/lib/discovery/gated-grid-exact-frequency";
import { sha256 } from "../src/lib/evaluation/hash";
import { encodeSvgVideo } from "./lib/encode-svg-video";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/gated-grid-frequency-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(gatedGridFrequencyVersion),
    status: z.string(),
    candidates: z.array(gatedGridFrequencyCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const cases = [];
const confirmatory = plan.status === "frozen-confirmatory-holdout";
for (const [index, candidate] of plan.candidates.entries()) {
  if (
    exactFrequencyCount(candidate.parameters.events, candidate.parameters.targetGate) !==
    candidate.parameters.qualifyingCount
  )
    throw new Error("Gated grid-frequency oracle mismatch");
  for (const control of confirmatory ? [false, true] : [false]) {
    const suffix = control ? "-histogram-control" : "";
    const artifact = join(output, `${candidate.id}${suffix}.mp4`);
    await encodeSvgVideo({
      target: artifact,
      fps: candidate.parameters.fps,
      durationMs: candidate.parameters.videoDurationMs,
      render: (timestampMs) => renderGatedGridFrequencySvg(candidate, timestampMs, control),
    });
    cases.push({
      candidateId: `${candidate.id}${suffix}`,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: control ? "visible-target-histogram-control" : "native-1x",
      interventionDescription: control
        ? "Target-gate per-cell frequencies persist and the exact number currently equal to two is displayed."
        : "Forty flashes require a frame-color-gated per-cell frequency histogram; eight target cells echo under the wrong color.",
      failureModeId: candidate.failureModeId,
      generator: "gated-grid-exact-frequency",
      seed: candidate.seed,
      difficulty: control ? 6 : 99,
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
        ? "Read the final EXACTLY-TWICE CELLS value and return exactly one allowed count."
        : "Track per-cell frequencies only under the displayed target frame color and return how many cells occurred exactly twice.",
    });
  }
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "gated-grid-frequency-svg-raster-v1", fps: 30, cases }, null, 2)}\n`,
);
console.log({ output, cases: cases.length });
