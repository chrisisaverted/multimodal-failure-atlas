import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import { renderTemporalOrderSvg, temporalOrderCandidateSchema, temporalOrderSchedule, temporalOrderVersion } from "../src/lib/discovery/temporal-order";
import { sha256 } from "../src/lib/evaluation/hash";
const planPath = resolve(process.argv[2] ?? "evaluation/discovery/temporal-order-discovery-v1.json");
const bytes = await readFile(planPath);
const plan = z.object({ id: z.string(), generatorVersion: z.literal(temporalOrderVersion), status: z.string(), candidates: z.array(temporalOrderCandidateSchema) }).parse(JSON.parse(bytes.toString()));
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
async function encode(candidate: z.infer<typeof temporalOrderCandidateSchema>, target: string) {
  const fps = candidate.parameters.fps;
  const ffmpeg = spawn(ffmpegPath!, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-i", "pipe:0", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", target], { stdio: ["pipe", "ignore", "pipe"] });
  let stderr = ""; ffmpeg.stderr.setEncoding("utf8"); ffmpeg.stderr.on("data", (chunk) => stderr += String(chunk));
  for (let frame = 0; frame < candidate.parameters.videoDurationMs / 1000 * fps; frame += 1) {
    const png = await sharp(Buffer.from(renderTemporalOrderSvg(candidate, frame / fps * 1000))).png().toBuffer();
    if (!ffmpeg.stdin.write(png)) await new Promise((done) => ffmpeg.stdin.once("drain", done));
  }
  ffmpeg.stdin.end();
  const status = await new Promise<number | null>((done) => ffmpeg.once("close", done));
  if (status !== 0) throw new Error(`ffmpeg failed: ${stderr}`);
}
const cases = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const schedule = temporalOrderSchedule(candidate);
  if (schedule.map((event) => event.label).join("-") !== candidate.expectedAnswer) throw new Error("Temporal oracle mismatch.");
  const artifact = join(output, `${candidate.id}.mp4`); await encode(candidate, artifact);
  cases.push({ candidateId: candidate.id, cellId: candidate.cellId, split: candidate.split, condition: "native-1x", interventionDescription: "Four non-overlapping 200 ms flashes separated by 700 ms.", failureModeId: candidate.failureModeId, generator: "temporal-order", seed: candidate.seed, difficulty: 72, variant: index, artifact: artifact.slice(resolve(".").length + 1), mimeType: "video/mp4", durationMs: candidate.parameters.videoDurationMs, question: candidate.question, answerOptions: candidate.answerOptions, expectedAnswer: candidate.expectedAnswer, sha256: sha256(new Uint8Array(await readFile(artifact))), parameters: candidate.parameters, humanSolvability: candidate.humanSolvability, systemMessage: "Watch the complete video and remember the exact order of the four yellow flashes. Return exactly one allowed ordering and do not explain." });
}
await writeFile(join(output, "manifest.json"), `${JSON.stringify({ id: plan.id, planSha256: sha256(bytes), generatorVersion: plan.generatorVersion, renderer: "temporal-order-svg-raster-v1", fps: 30, cases }, null, 2)}\n`);
console.log({ output, cases: cases.length });
