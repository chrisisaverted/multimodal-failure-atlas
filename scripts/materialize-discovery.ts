import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import { discoveryGeneratorVersion, renderLatticeCountingSvg } from "../src/lib/discovery/lattice-counting";
import { discoveryCandidateSchema } from "../src/lib/discovery/schema";
import { sha256 } from "../src/lib/evaluation/hash";

const planSchema = z.object({
  id: z.string(),
  generatorVersion: z.string(),
  candidates: z.array(discoveryCandidateSchema),
  interventions: z
    .array(
      z.object({
        id: z.enum(["native-1x", "slow-motion-4x"]),
        description: z.string(),
      }),
    )
    .optional(),
});
const planPath = resolve(process.argv[2] ?? "evaluation/discovery/lattice-counting-discovery-v1.json");
const planBytes = await readFile(planPath);
const plan = planSchema.parse(JSON.parse(planBytes.toString("utf8")));
if (plan.generatorVersion !== discoveryGeneratorVersion) throw new Error("Discovery generator is stale.");
const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });

async function encodeVideo(
  candidate: z.infer<typeof discoveryCandidateSchema>,
  target: string,
  timeScale: number,
) {
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
  const outputDurationMs = videoDurationMs * timeScale;
  const frames = Math.ceil((outputDurationMs / 1000) * fps);
  for (let frame = 0; frame < frames; frame += 1) {
    const sourceTimestampMs = ((frame / fps) * 1000) / timeScale;
    const png = await sharp(Buffer.from(renderLatticeCountingSvg(candidate, sourceTimestampMs)))
      .png()
      .toBuffer();
    if (!process.stdin.write(png)) {
      await new Promise((resolveDrain) => process.stdin.once("drain", resolveDrain));
    }
  }
  process.stdin.end();
  const status = await new Promise<number | null>((resolveExit) => process.once("close", resolveExit));
  if (status !== 0) throw new Error(`ffmpeg failed for ${candidate.id}: ${stderr}`);
}

const cases: Array<Record<string, unknown>> = [];
const interventions = plan.interventions ?? [
  { id: "native-1x" as const, description: "Exact source video at its native temporal rate." },
];
const totalArtifacts = plan.candidates.length * interventions.length;
let completed = 0;
for (const [index, candidate] of plan.candidates.entries()) {
  for (const [conditionIndex, intervention] of interventions.entries()) {
    const timeScale = intervention.id === "slow-motion-4x" ? 4 : 1;
    const suffix = intervention.id === "native-1x" ? "" : `-${intervention.id}`;
    const artifact = join(output, `${candidate.id}${suffix}.mp4`);
    await encodeVideo(candidate, artifact, timeScale);
    cases.push({
      candidateId: candidate.id,
      cellId: candidate.cellId,
      split: candidate.split,
      condition: intervention.id,
      interventionDescription: intervention.description,
      failureModeId: candidate.failureModeId,
      generator: "event-counting",
      seed: candidate.seed,
      difficulty: Math.round(100 - candidate.parameters.flashDurationMs / 10),
      variant: index * interventions.length + conditionIndex,
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: "video/mp4",
      durationMs: candidate.parameters.videoDurationMs * timeScale,
      question: candidate.question,
      answerOptions: candidate.answerOptions,
      expectedAnswer: candidate.expectedAnswer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      parameters: candidate.parameters,
      humanSolvability: candidate.humanSolvability,
    });
    completed += 1;
    process.stdout.write(`[${completed}/${totalArtifacts}] ${candidate.id} ${intervention.id}\n`);
  }
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
      renderer: "lattice-counting-svg-raster-v1",
      fps: 30,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log(JSON.stringify({ manifestPath, cases: cases.length }, null, 2));
