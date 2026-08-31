import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const output = new URL("../public/generated/", import.meta.url).pathname;
await mkdir(output, { recursive: true });

const imageAssets = {
  "small-object.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#e8e5da"/><g fill="#aaa99f" opacity=".45">${Array.from({ length: 36 }, (_, i) => `<circle cx="${30 + ((i * 83) % 570)}" cy="${28 + ((i * 47) % 340)}" r="${3 + (i % 7)}"/>`).join("")}</g><path d="M497 302l10 18h-20z" fill="#2356c7"/></svg>`,
  "patch-phase.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#e8e5da"/><g stroke="#171915" opacity=".1">${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 40} 0v400"/>`).join("")}${Array.from({ length: 11 }, (_, i) => `<path d="M0 ${i * 40}h640"/>`).join("")}</g><circle cx="267" cy="200" r="94" fill="none" stroke="#2356c7" stroke-width="12"/><circle cx="440" cy="200" r="94" fill="none" stroke="#f04b32" stroke-width="12"/></svg>`,
  "attribute-binding.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#e8e5da"/><circle cx="115" cy="200" r="55" fill="#2356c7"/><rect x="232" y="145" width="110" height="110" rx="7" fill="#f04b32"/><path d="M430 140l63 115H367z" fill="#168e88"/><rect x="503" y="145" width="110" height="110" transform="rotate(45 558 200)" fill="#8062d6"/></svg>`,
  "numerosity-density.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#e8e5da"/><g fill="#8062d6" stroke="#e8e5da" stroke-width="5">${[
    [220, 130],
    [320, 105],
    [410, 155],
    [246, 235],
    [355, 215],
    [447, 275],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="39"/>`)
    .join("")}</g></svg>`,
};

for (const [name, svg] of Object.entries(imageAssets)) await writeFile(join(output, name), svg);

const fps = 30;
const width = 640;
const height = 400;
const durationSeconds = 5;

const svgFrame = (body) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e8e5da"/><path d="M0 330h640" stroke="#171915" opacity=".13"/>${body}</svg>`,
  );

const videos = {
  "brief-event.mp4": (t) => {
    const x = 55 + (t / durationSeconds) * 530;
    const y = 200 + Math.sin(t * Math.PI * 1.6) * 85;
    const color = t >= 2.33 && t < 2.53 ? "#8062d6" : "#2356c7";
    return `<circle cx="${x}" cy="${y}" r="34" fill="${color}"/>`;
  },
  "event-order.mp4": (t) => {
    const square = Math.abs(t - 1.35) < 0.28 ? "#d9f43c" : "#a5a49b";
    const circle = Math.abs(t - 3.15) < 0.28 ? "#f04b32" : "#a5a49b";
    return `<rect x="155" y="145" width="110" height="110" rx="7" fill="${square}"/><circle cx="430" cy="200" r="56" fill="${circle}"/>`;
  },
  "identity-occlusion.mp4": (t) => {
    const progress = t / durationSeconds;
    const x = 40 + progress * 560;
    const hidden = x > 260 && x < 380;
    const blueY = progress < 0.5 ? 135 : 265;
    const redY = progress < 0.5 ? 265 : 135;
    return `${hidden ? "" : `<circle cx="${x}" cy="${blueY}" r="28" fill="#2356c7"/><circle cx="${x}" cy="${redY}" r="28" fill="#f04b32"/>`}<rect x="260" y="45" width="120" height="310" rx="8" fill="#252821"/>`;
  },
  "event-counting.mp4": (t) => {
    const starts = [0.7, 1.35, 2, 2.65, 3.3, 3.95];
    const active = starts.some((start) => t >= start && t < start + 0.18);
    return `<circle cx="320" cy="200" r="82" fill="${active ? "#d9f43c" : "#35382f"}"/><circle cx="320" cy="200" r="105" fill="none" stroke="#d9f43c" stroke-width="7" opacity="${active ? 0.42 : 0.08}"/>`;
  },
};

for (const [name, render] of Object.entries(videos)) {
  const work = join(tmpdir(), `failure-atlas-${name.replace(".mp4", "")}-${process.pid}`);
  await mkdir(work, { recursive: true });
  for (let frame = 0; frame < fps * durationSeconds; frame += 1) {
    const png = join(work, `frame-${String(frame).padStart(4, "0")}.png`);
    await sharp(svgFrame(render(frame / fps)))
      .png()
      .toFile(png);
  }
  const result = spawnSync(
    ffmpegPath,
    [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      join(work, "frame-%04d.png"),
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "25",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      join(output, name),
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) throw new Error(`ffmpeg failed for ${name}`);
  await rm(work, { recursive: true, force: true });
}

await writeFile(
  join(output, "manifest.json"),
  JSON.stringify(
    {
      generatorVersion: "1.2.0",
      generatedAt: "2026-08-30T00:00:00.000Z",
      images: Object.keys(imageAssets),
      videos: Object.keys(videos),
      fps,
      durationSeconds,
    },
    null,
    2,
  ),
);
console.log(
  `Generated ${Object.keys(imageAssets).length} images and ${Object.keys(videos).length} videos in ${output}`,
);
