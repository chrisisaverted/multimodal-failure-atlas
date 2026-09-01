import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

export async function encodeSvgVideo(input: {
  target: string;
  fps: number;
  durationMs: number;
  render: (timestampMs: number) => string;
}) {
  const child = spawn(
    ffmpegPath!,
    ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(input.fps),
      "-i", "pipe:0", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", input.target],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  let error = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (value) => error += String(value));
  const frames = Math.ceil(input.durationMs / 1000 * input.fps);
  for (let frame = 0; frame < frames; frame += 1) {
    const png = await sharp(Buffer.from(input.render(frame / input.fps * 1000))).png().toBuffer();
    if (!child.stdin.write(png)) await new Promise((done) => child.stdin.once("drain", done));
  }
  child.stdin.end();
  const status = await new Promise<number | null>((done) => child.once("close", done));
  if (status !== 0) throw new Error(error || `ffmpeg exited ${status}`);
}
