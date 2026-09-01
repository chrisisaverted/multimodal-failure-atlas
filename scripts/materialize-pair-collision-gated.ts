import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import {
  countGatedTargetPair,
  pairCollisionGatedCandidateSchema,
  pairCollisionGatedVersion,
  renderPairCollisionGatedSvg,
} from "../src/lib/discovery/pair-collision-gated";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/pair-collision-gated-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(pairCollisionGatedVersion),
    status: z.string(),
    candidates: z.array(pairCollisionGatedCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });

async function encode(
  candidate: z.infer<typeof pairCollisionGatedCandidateSchema>,
  target: string,
  control: boolean,
) {
  const process = spawn(
    ffmpegPath!,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      "30",
      "-i",
      "pipe:0",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      target,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let error = "";
  process.stderr.setEncoding("utf8");
  process.stderr.on("data", (value) => (error += String(value)));
  for (let frame = 0; frame < 540; frame += 1) {
    const png = await sharp(Buffer.from(renderPairCollisionGatedSvg(candidate, (frame / 30) * 1000, control)))
      .png()
      .toBuffer();
    if (!process.stdin.write(png)) await new Promise((done) => process.stdin.once("drain", done));
  }
  process.stdin.end();
  const status = await new Promise<number | null>((done) => process.once("close", done));
  if (status !== 0) throw new Error(error);
}

const cases = [];
const confirmatory = plan.status === "frozen-confirmatory-holdout";
for (const [index, candidate] of plan.candidates.entries()) {
  if (
    countGatedTargetPair(
      candidate.parameters.events,
      candidate.parameters.targetPair,
      candidate.parameters.targetGate,
    ) !== candidate.parameters.targetCount
  )
    throw new Error("Gated pair-collision oracle mismatch");
  for (const control of confirmatory ? [false, true] : [false]) {
    const suffix = control ? "-counter-control" : "";
    const artifact = join(output, `${candidate.id}${suffix}.mp4`);
    await encode(candidate, artifact, control);
    cases.push({
      candidateId: `${candidate.id}${suffix}`,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: control ? "oracle-counter-control" : "native-1x",
      interventionDescription: control
        ? "A running counter exposes only collisions satisfying both the identity-pair and frame-color predicates."
        : "Thirty-two events balance frame colors and include six target-pair traps under the wrong color.",
      failureModeId: candidate.failureModeId,
      generator: "pair-collision-gated",
      seed: candidate.seed,
      difficulty: control ? 5 : 98,
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
        ? "Read the final MATCH COUNT displayed in the video and return exactly one allowed count."
        : "Count only collisions satisfying both the displayed target-pair and target-frame-color conditions. Return exactly one allowed count.",
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
      renderer: "pair-collision-gated-svg-raster-v1",
      fps: 30,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, cases: cases.length });
