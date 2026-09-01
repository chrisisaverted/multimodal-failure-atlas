import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import {
  isMomentaryEventActive,
  momentarySymbolCandidateSchema,
  momentarySymbolGeneratorVersion,
  renderMomentarySymbolSvg,
} from "../src/lib/discovery/momentary-symbol";
import { sha256 } from "../src/lib/evaluation/hash";

const planPath = resolve(process.argv[2] ?? "evaluation/discovery/momentary-symbol-discovery-v1.json");
const planBytes = await readFile(planPath);
const plan = z
  .object({
    id: z.string(),
    generatorVersion: z.string(),
    status: z.enum(["discovery-only", "frozen-confirmatory-holdout"]),
    candidates: z.array(momentarySymbolCandidateSchema),
  })
  .parse(JSON.parse(planBytes.toString("utf8")));
if (plan.generatorVersion !== momentarySymbolGeneratorVersion) throw new Error("Momentary plan is stale.");
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });

async function encodeVideo(candidate: z.infer<typeof momentarySymbolCandidateSchema>, target: string) {
  const { fps, videoDurationMs } = candidate.parameters;
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
      String(fps),
      "-i",
      "pipe:0",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      target,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let stderr = "";
  process.stderr.setEncoding("utf8");
  process.stderr.on("data", (chunk) => (stderr += String(chunk)));
  const frames = Math.ceil((videoDurationMs / 1000) * fps);
  for (let frame = 0; frame < frames; frame += 1) {
    const png = await sharp(Buffer.from(renderMomentarySymbolSvg(candidate, (frame / fps) * 1000)))
      .png()
      .toBuffer();
    if (!process.stdin.write(png))
      await new Promise((resolveDrain) => process.stdin.once("drain", resolveDrain));
  }
  process.stdin.end();
  const status = await new Promise<number | null>((resolveExit) => process.once("close", resolveExit));
  if (status !== 0) throw new Error(`ffmpeg failed for ${candidate.id}: ${stderr}`);
}

const cases: Array<Record<string, unknown>> = [];
for (const [index, candidate] of plan.candidates.entries()) {
  const artifact = join(output, `${candidate.id}.mp4`);
  await encodeVideo(candidate, artifact);
  const eventMiddleMs =
    candidate.parameters.eventSecond * 1000 +
    candidate.parameters.phaseMs +
    candidate.parameters.eventDurationMs / 2;
  if (!isMomentaryEventActive(candidate, eventMiddleMs)) throw new Error("Oracle frame missed its event.");
  const oracleArtifact = join(output, `${candidate.id}-oracle.png`);
  await sharp(Buffer.from(renderMomentarySymbolSvg(candidate, eventMiddleMs)))
    .png()
    .toFile(oracleArtifact);
  cases.push({
    candidateId: candidate.id,
    cellId: candidate.cellId,
    split: candidate.split,
    condition: "native-1x",
    interventionDescription: "Exact 30 FPS source video at native speed.",
    failureModeId: candidate.failureModeId,
    generator: "brief-event",
    seed: candidate.seed,
    difficulty: 100 - Math.round(candidate.parameters.eventDurationMs / 5),
    variant: index,
    artifact: artifact.slice(resolve(".").length + 1),
    mimeType: "video/mp4",
    durationMs: candidate.parameters.videoDurationMs,
    question: candidate.question,
    answerOptions: candidate.answerOptions,
    expectedAnswer: candidate.expectedAnswer,
    sha256: sha256(new Uint8Array(await readFile(artifact))),
    oracleArtifact: oracleArtifact.slice(resolve(".").length + 1),
    oracleSha256: sha256(new Uint8Array(await readFile(oracleArtifact))),
    parameters: candidate.parameters,
    humanSolvability: candidate.humanSolvability,
    systemMessage:
      "This is a controlled video diagnostic. Watch the complete clip for one brief, large black symbol at the center. Return exactly one allowed symbol name and do not explain.",
  });
  if (plan.status === "frozen-confirmatory-holdout") {
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: "oracle-critical-frame",
      interventionDescription:
        "Exact answer-bearing source frame presented as a still-image positive control.",
      failureModeId: candidate.failureModeId,
      generator: "brief-event",
      seed: candidate.seed,
      difficulty: 0,
      variant: 100 + index,
      artifact: oracleArtifact.slice(resolve(".").length + 1),
      mimeType: "image/png",
      question: "Which large black symbol is shown at the center of this image?",
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(oracleArtifact))),
      parameters: candidate.parameters,
      humanSolvability: candidate.humanSolvability,
      systemMessage:
        "This is a controlled visual diagnostic. Identify the large black symbol at the center. Return exactly one allowed symbol name and do not explain.",
    });
  }
  process.stdout.write(`[${index + 1}/${plan.candidates.length}] ${candidate.id}\n`);
}

const manifestPath = join(output, "manifest.json");
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      id: plan.id,
      planSha256: sha256(planBytes),
      generatorVersion: plan.generatorVersion,
      renderer:
        plan.status === "frozen-confirmatory-holdout"
          ? "momentary-symbol-svg-raster-v1-with-oracle-frames"
          : "momentary-symbol-svg-raster-v1",
      fps: 30,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log(JSON.stringify({ manifestPath, cases: cases.length }, null, 2));
