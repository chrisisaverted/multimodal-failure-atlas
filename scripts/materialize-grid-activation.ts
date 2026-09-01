import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import {
  gridActivationCandidateSchema,
  gridActivationVersion,
  renderGridActivationSvg,
  uniqueActivationCount,
} from "../src/lib/discovery/grid-activation-memory";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/grid-activation-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.literal(gridActivationVersion),
    status: z.string(),
    candidates: z.array(gridActivationCandidateSchema),
  })
  .parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });

async function encode(candidate: z.infer<typeof gridActivationCandidateSchema>, target: string) {
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
  for (let frame = 0; frame < 432; frame += 1) {
    const png = await sharp(Buffer.from(renderGridActivationSvg(candidate, (frame / 30) * 1000)))
      .png()
      .toBuffer();
    if (!process.stdin.write(png)) await new Promise((done) => process.stdin.once("drain", done));
  }
  process.stdin.end();
  const status = await new Promise<number | null>((done) => process.once("close", done));
  if (status !== 0) throw new Error(error);
}

const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  if (uniqueActivationCount(candidate.parameters.activations) !== candidate.parameters.uniqueCount) {
    throw new Error("Grid activation oracle mismatch");
  }
  const artifact = join(output, `${candidate.id}.mp4`);
  await encode(candidate, artifact);
  cases.push({
    candidateId: candidate.id,
    cellId: candidate.cellId,
    split: candidate.split,
    condition: "native-1x",
    interventionDescription:
      "Twenty-four brief activations contain repeats over a five-by-five spatial grid.",
    failureModeId: candidate.failureModeId,
    generator: "grid-activation-memory",
    seed: candidate.seed,
    difficulty: 91,
    variant: index,
    artifact: artifact.slice(resolve(".").length + 1),
    mimeType: "video/mp4",
    durationMs: candidate.parameters.videoDurationMs,
    question: candidate.question,
    answerOptions: candidate.answerOptions,
    expectedAnswer: candidate.expectedAnswer,
    sha256: sha256(new Uint8Array(await readFile(artifact))),
    parameters: candidate.parameters,
    humanSolvability: candidate.humanSolvability,
    systemMessage:
      "Track the set of grid positions that activate at least once and return exactly one allowed count.",
  });
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "grid-activation-svg-raster-v1", fps: 30, cases }, null, 2)}\n`,
);
console.log({ output, cases: cases.length });
