import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import { z } from "zod";
import { sha256 } from "../src/lib/evaluation/hash";
import { renderDiagnosticSvg } from "../src/lib/evaluation/render";
import { generateInstance, generatorVersion } from "../src/lib/generators";
import type { GeneratorKey } from "../src/lib/types";

const planSchema = z.object({
  id: z.string().min(1),
  generatorVersion: z.string(),
  difficulty: z.number().min(0).max(100),
  variant: z.number().int().nonnegative(),
  samplesPerFamily: z.number().int().positive().max(100),
  families: z.array(
    z.object({
      generator: z.enum([
        "small-object",
        "patch-phase",
        "attribute-binding",
        "numerosity-density",
        "brief-event",
        "event-order",
        "identity-occlusion",
        "event-counting",
      ]),
      failureModeId: z.string().min(1),
      firstSeed: z.number().int().nonnegative(),
    }),
  ),
});

const sourcePlan = resolve(process.argv[2] ?? "evaluation/plans/frontier-pilot.json");
const planBody = await readFile(sourcePlan, "utf8");
const plan = planSchema.parse(JSON.parse(planBody));
if (plan.generatorVersion !== generatorVersion) {
  throw new Error(`Plan expects generator ${plan.generatorVersion}; code is ${generatorVersion}.`);
}

const output = resolve(process.argv[3] ?? `public/evaluations/${plan.id}`);
await mkdir(output, { recursive: true });
const videoGenerators = new Set<GeneratorKey>([
  "brief-event",
  "event-order",
  "identity-occlusion",
  "event-counting",
]);
const fps = 30;
const cases: Array<Record<string, unknown>> = [];

async function encodeVideo(instance: ReturnType<typeof generateInstance>, target: string) {
  const durationMs = Number(instance.latent.videoDurationMs);
  const frameCount = Math.ceil((durationMs / 1000) * fps);
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
  for (let frame = 0; frame < frameCount; frame += 1) {
    const png = await sharp(Buffer.from(renderDiagnosticSvg(instance, frame / frameCount)))
      .png()
      .toBuffer();
    if (!process.stdin.write(png))
      await new Promise((resolveDrain) => process.stdin.once("drain", resolveDrain));
  }
  process.stdin.end();
  const status = await new Promise<number | null>((resolveExit) => process.once("close", resolveExit));
  if (status !== 0) throw new Error(`ffmpeg failed for ${target}: ${stderr}`);
  return durationMs;
}

for (const family of plan.families) {
  for (let index = 0; index < plan.samplesPerFamily; index += 1) {
    const seed = family.firstSeed + index;
    const params = { seed, difficulty: plan.difficulty, variant: plan.variant };
    const instance = generateInstance(family.generator, params);
    const extension = videoGenerators.has(family.generator) ? ".mp4" : ".png";
    const filename = `${family.generator}-${seed}${extension}`;
    const artifact = join(output, filename);
    let durationMs: number | undefined;
    if (extension === ".mp4") {
      durationMs = await encodeVideo(instance, artifact);
    } else {
      await sharp(Buffer.from(renderDiagnosticSvg(instance)))
        .png()
        .toFile(artifact);
    }
    cases.push({
      failureModeId: family.failureModeId,
      generator: family.generator,
      seed,
      difficulty: plan.difficulty,
      variant: plan.variant,
      artifact: artifact.slice(resolve(".").length + 1),
      mimeType: extension === ".mp4" ? "video/mp4" : "image/png",
      durationMs,
      question: instance.question,
      answerOptions: instance.answerOptions,
      expectedAnswer: instance.answer,
      sha256: sha256(new Uint8Array(await readFile(artifact))),
      latent: instance.latent,
    });
  }
}

const manifestPath = join(output, "manifest.json");
await mkdir(dirname(manifestPath), { recursive: true });
await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      id: plan.id,
      planSha256: sha256(planBody),
      generatorVersion,
      renderer: "reference-svg-raster-v1",
      fps,
      cases,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Materialized ${cases.length} exact stimuli in ${output} (${extname(cases[0]!.artifact as string)}…)`,
);
