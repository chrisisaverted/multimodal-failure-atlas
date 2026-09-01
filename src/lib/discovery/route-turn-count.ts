import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const routeTurnVersion = "hidden-trail-route-turn-count-v1";
export const routeTurnAnswers = ["10", "11", "12", "13"] as const;
const pointSchema = z.tuple([z.number().int(), z.number().int()]);

export const routeTurnCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-twenty-four-step-hidden-trail"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("dynamic-route-turn-integration"),
  question: z.string(),
  answerOptions: z.array(z.enum(routeTurnAnswers)).length(4),
  expectedAnswer: z.enum(routeTurnAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    turnCount: z.number().int().min(10).max(13),
    path: z.array(pointSchema).length(25),
    videoDurationMs: z.literal(14_400),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type RouteTurnCandidate = z.infer<typeof routeTurnCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000;
}

function shuffled<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

const directions = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;

function turns(path: readonly (readonly [number, number])[]) {
  let count = 0;
  for (let index = 2; index < path.length; index += 1) {
    const previous = [path[index - 1]![0] - path[index - 2]![0], path[index - 1]![1] - path[index - 2]![1]];
    const current = [path[index]![0] - path[index - 1]![0], path[index]![1] - path[index - 1]![1]];
    if (previous[0] !== current[0] || previous[1] !== current[1]) count += 1;
  }
  return count;
}

function makePath(seed: number, targetTurns: number) {
  for (let attempt = 0; attempt < 20_000; attempt += 1) {
    const random = rng(seed + attempt * 1543);
    const changeSlots = new Set(
      shuffled(
        Array.from({ length: 23 }, (_, index) => index + 1),
        random,
      ).slice(0, targetTurns),
    );
    let direction = Math.floor(random() * 4);
    const path: [number, number][] = [[6, 6]];
    let valid = true;
    for (let step = 0; step < 24; step += 1) {
      if (step > 0 && changeSlots.has(step)) direction = (direction + (random() < 0.5 ? 1 : 3)) % 4;
      const previous = path[path.length - 1]!;
      const next: [number, number] = [
        previous[0] + directions[direction]![0],
        previous[1] + directions[direction]![1],
      ];
      if (next[0] < 1 || next[0] > 10 || next[1] < 1 || next[1] > 10) {
        valid = false;
        break;
      }
      path.push(next);
    }
    if (valid && path.length === 25 && turns(path) === targetTurns) return path;
  }
  throw new Error("Could not construct a bounded path with the requested turn count.");
}

export function createRouteTurnCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  turnCount: number;
  visualVariant?: number;
}) {
  const path = makePath(input.seed + 97, input.turnCount);
  const visualVariant = input.visualVariant ?? input.seed % 241;
  return routeTurnCandidateSchema.parse({
    id: `rt-${sha256(JSON.stringify({ ...input, path, visualVariant })).slice(0, 16)}`,
    cellId: "cell-twenty-four-step-hidden-trail",
    split: input.split,
    seed: input.seed,
    failureModeId: "dynamic-route-turn-integration",
    question: "How many times does the moving gold disk CHANGE DIRECTION during the complete route?",
    answerOptions: shuffled(routeTurnAnswers, rng(input.seed + 59)),
    expectedAnswer: String(input.turnCount),
    humanSolvability: "unverified",
    parameters: { turnCount: input.turnCount, path, videoDurationMs: 14_400, fps: 30, visualVariant },
  });
}

export function createRouteTurnGrid() {
  const candidates: RouteTurnCandidate[] = [];
  let seed = 4_900_000;
  for (let replicate = 0; replicate < 2; replicate += 1) {
    for (let count = 10; count <= 13; count += 1) {
      candidates.push(
        createRouteTurnCandidate({
          split: "discovery",
          seed: seed++,
          turnCount: count,
          visualVariant: replicate * 4 + count - 10,
        }),
      );
    }
  }
  return candidates;
}

export const countRouteTurns = turns;

export function renderRouteTurnSvg(candidate: RouteTurnCandidate, timestampMs: number, trailControl = false) {
  const start = 900;
  const stepMs = 520;
  const step = Math.floor((timestampMs - start) / stepMs);
  const progress = Math.max(0, Math.min(1, (timestampMs - start - step * stepMs) / 430));
  const boundedStep = Math.max(0, Math.min(23, step));
  const from = candidate.parameters.path[boundedStep]!;
  const to = candidate.parameters.path[boundedStep + 1]!;
  const x = 90 + (from[0] + (to[0] - from[0]) * progress) * 49;
  const y = 125 + (from[1] + (to[1] - from[1]) * progress) * 43;
  const trailPoints = candidate.parameters.path
    .slice(0, Math.max(1, Math.min(25, step + 2)))
    .map(([px, py]) => `${90 + px * 49},${125 + py * 43}`)
    .join(" ");
  const grid = Array.from({ length: 12 }, (_, index) => {
    const gx = 90 + index * 49;
    const gy = 125 + index * 43;
    return `<line x1="${gx}" y1="168" x2="${gx}" y2="598" stroke="#d7d2c8"/><line x1="139" y1="${gy}" x2="629" y2="${gy}" stroke="#d7d2c8"/>`;
  }).join("");
  const status = step < 0 ? "GET READY" : step < 24 ? `MOVE ${step + 1} OF 24` : "ROUTE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="680"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="48" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700">COUNT DIRECTION CHANGES</text><text x="360" y="83" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Continue straight = no turn; left or right = one turn</text><text x="360" y="126" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${status}</text><rect x="125" y="155" width="520" height="460" fill="#fffef9" stroke="#202322" stroke-width="5"/>${grid}${trailControl ? `<polyline points="${trailPoints}" fill="none" stroke="#1d9b5f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : ""}<circle cx="${x}" cy="${y}" r="22" fill="#f4d934" stroke="#202322" stroke-width="5"/><text x="360" y="650" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">${trailControl ? "CONTROL: the traversed route remains visible" : "The route leaves no trail"}</text></svg>`;
}
