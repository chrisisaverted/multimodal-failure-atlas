import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import {
  coflashCandidateSchema,
  coflashHardVersion,
  coflashPairCounts,
  coflashVersion,
  renderCoflashSvg,
} from "../src/lib/discovery/coflash-counting";
import { sha256 } from "../src/lib/evaluation/hash";
const planPath = resolve(process.argv[2] ?? "evaluation/discovery/coflash-discovery-v1.json"),
  bytes = await readFile(planPath),
  plan = z
    .object({
      id: z.string(),
      generatorVersion: z.enum([coflashVersion, coflashHardVersion]),
      status: z.string(),
      candidates: z.array(coflashCandidateSchema),
    })
    .parse(JSON.parse(bytes.toString())),
  output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
async function encode(candidate: z.infer<typeof coflashCandidateSchema>, target: string) {
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
  for (let i = 0; i < Math.round((candidate.parameters.videoDurationMs / 1000) * 30); i++) {
    const png = await sharp(Buffer.from(renderCoflashSvg(candidate, (i / 30) * 1000)))
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
  if (
    coflashPairCounts(candidate.parameters.beats)[candidate.parameters.targetPair] !==
    (candidate.parameters.targetCount ?? 4)
  )
    throw new Error("Coflash oracle mismatch");
  const artifact = join(output, `${candidate.id}.mp4`);
  await encode(candidate, artifact);
  cases.push({
    candidateId: candidate.id,
    cellId: candidate.cellId,
    split: candidate.split,
    condition: "native-1x",
    interventionDescription: "Eighteen discrete beats each activate two of four labeled streams.",
    failureModeId: candidate.failureModeId,
    generator: "coflash-counting",
    seed: candidate.seed,
    difficulty: candidate.parameters.targetCount === 7 ? 96 : 90,
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
      `Count pairwise simultaneous flashes over all ${candidate.parameters.beats.length} beats. Return exactly one allowed pair and do not explain.`,
  });
}
await writeFile(
  join(output, "manifest.json"),
  `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "coflash-svg-raster-v1", fps: 30, cases }, null, 2)}\n`,
);
console.log({ output, cases: cases.length });
