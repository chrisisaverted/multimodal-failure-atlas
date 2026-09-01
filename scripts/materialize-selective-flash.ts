import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import {
  renderSelectiveFlashSvg,
  selectiveFlashCandidateSchema,
  selectiveFlashVersion,
  targetFlashStarts,
} from "../src/lib/discovery/selective-flash-tracking";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/selective-flash-discovery-v1.json");
const planBytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.string(),
    status: z.enum(["discovery-only", "frozen-confirmatory-holdout"]),
    candidates: z.array(selectiveFlashCandidateSchema),
  })
  .parse(JSON.parse(planBytes.toString("utf8")));
if (plan.generatorVersion !== selectiveFlashVersion) throw new Error("Selective-flash plan is stale.");
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });

async function encodeVideo(candidate: z.infer<typeof selectiveFlashCandidateSchema>, target: string, control = false) {
  const { fps, videoDurationMs } = candidate.parameters;
  const ffmpeg = spawn(
    ffmpegPath!,
    [
      "-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps),
      "-i", "pipe:0", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt",
      "yuv420p", "-movflags", "+faststart", target,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let stderr = "";
  ffmpeg.stderr.setEncoding("utf8");
  ffmpeg.stderr.on("data", (chunk) => (stderr += String(chunk)));
  const frames = Math.ceil((videoDurationMs / 1000) * fps);
  for (let frame = 0; frame < frames; frame += 1) {
    const png = await sharp(Buffer.from(renderSelectiveFlashSvg(candidate, (frame / fps) * 1000, control)))
      .png()
      .toBuffer();
    if (!ffmpeg.stdin.write(png)) await new Promise((done) => ffmpeg.stdin.once("drain", done));
  }
  ffmpeg.stdin.end();
  const status = await new Promise<number | null>((done) => ffmpeg.once("close", done));
  if (status !== 0) throw new Error(`ffmpeg failed for ${candidate.id}: ${stderr}`);
}

const cases: Array<Record<string, unknown>> = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const starts = targetFlashStarts(candidate);
  if (starts.length !== candidate.parameters.targetCount) throw new Error("Target schedule is inconsistent.");
  if (starts.some((start, i) => i > 0 && start - starts[i - 1]! < candidate.parameters.flashDurationMs)) {
    throw new Error("Target flashes overlap.");
  }
  const controls = plan.status === "frozen-confirmatory-holdout" ? [false, true] : [false];
  for (const control of controls) {
  const artifact = join(output, `${candidate.id}${control ? "-control" : ""}.mp4`);
  await encodeVideo(candidate, artifact, control);
  cases.push({
    candidateId: candidate.id,
    cellId: candidate.cellId,
    split: candidate.split,
    condition: control ? "isolated-long-flash-control" : "native-1x",
    interventionDescription: control ? "Distractors removed and every target flash extended to 500 ms." : "Exact 30 FPS source video at native speed.",
    failureModeId: candidate.failureModeId,
    generator: "selective-flash-tracking",
    seed: candidate.seed,
    difficulty: Math.min(100, 45 + candidate.parameters.distractorObjects * 7 + Math.round((200 - candidate.parameters.flashDurationMs) / 5)),
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
      ? "This is a positive control with one disk and long flashes. Count its yellow flashes and return exactly one allowed integer."
      : "This is a controlled video diagnostic. Track the disk marked by the persistent red rings through the complete clip and count only its yellow flashes. Return exactly one allowed integer and do not explain.",
  });
  }
  process.stdout.write(`[${index + 1}/${plan.candidates.length}] ${candidate.id}\n`);
}

const manifestPath = join(output, "manifest.json");
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(
  manifestPath,
  `${JSON.stringify({
    id: plan.id,
    planSha256: sha256(planBytes),
    generatorVersion: plan.generatorVersion,
        renderer: plan.status === "frozen-confirmatory-holdout" ? "selective-flash-svg-raster-v1-with-isolated-control" : "selective-flash-svg-raster-v1",
    fps: 30,
    cases,
  }, null, 2)}\n`,
);
console.log(JSON.stringify({ manifestPath, cases: cases.length }, null, 2));
