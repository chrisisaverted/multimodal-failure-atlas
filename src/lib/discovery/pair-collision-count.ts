import { z } from "zod";
import { sha256 } from "../evaluation/hash";
export const pairCollisionVersion = "identity-pair-collision-count-v1";
export const pairCollisionAnswers = ["5", "6", "7", "8"] as const;
const pairSchema = z.tuple([z.number().int().min(0).max(5), z.number().int().min(0).max(5)]);
export const pairCollisionCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("identity-pair-interaction-counting"),
  question: z.string(),
  answerOptions: z.array(z.enum(pairCollisionAnswers)).length(4),
  expectedAnswer: z.enum(pairCollisionAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetCount: z.number().int().min(5).max(8),
    events: z.array(pairSchema).length(24),
    videoDurationMs: z.literal(14200),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type PairCollisionCandidate = z.infer<typeof pairCollisionCandidateSchema>;
function rng(seed: number) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000;
}
function shuffled<T>(values: readonly T[], random: () => number) {
  const out = [...values];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
function makeEvents(seed: number, targetCount: number) {
  const random = rng(seed),
    events: [number, number][] = Array.from({ length: targetCount }, () => [0, 1]);
  while (events.length < 24) {
    const a = Math.floor(random() * 6);
    let b = Math.floor(random() * 5);
    if (b >= a) b++;
    if ((a === 0 && b === 1) || (a === 1 && b === 0)) continue;
    events.push([a, b]);
  }
  return shuffled(events, random);
}
export function countTargetPair(events: readonly (readonly [number, number])[]) {
  return events.filter(([a, b]) => (a === 0 && b === 1) || (a === 1 && b === 0)).length;
}
export function createPairCollisionCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetCount: number;
  visualVariant?: number;
}) {
  const events = makeEvents(input.seed + 149, input.targetCount),
    visualVariant = input.visualVariant ?? input.seed % 277;
  return pairCollisionCandidateSchema.parse({
    id: `pc-${sha256(JSON.stringify({ ...input, events, visualVariant })).slice(0, 16)}`,
    cellId: "cell-twenty-four-pair-collisions",
    split: input.split,
    seed: input.seed,
    failureModeId: "identity-pair-interaction-counting",
    question:
      "How many collision events involve the specific pair A AND B together? Ignore collisions involving any other pairing.",
    answerOptions: shuffled(pairCollisionAnswers, rng(input.seed + 71)),
    expectedAnswer: String(input.targetCount),
    humanSolvability: "unverified",
    parameters: { targetCount: input.targetCount, events, videoDurationMs: 14200, fps: 30, visualVariant },
  });
}
export function createPairCollisionGrid() {
  const out: PairCollisionCandidate[] = [];
  let seed = 4_600_000;
  for (let rep = 0; rep < 2; rep++)
    for (let targetCount = 5; targetCount <= 8; targetCount++)
      out.push(
        createPairCollisionCandidate({
          split: "discovery",
          seed: seed++,
          targetCount,
          visualVariant: rep * 4 + targetCount - 5,
        }),
      );
  return out;
}
export function createPairCollisionHoldout() {
  const out: PairCollisionCandidate[] = [];
  let seed = 4_610_000;
  for (let rep = 0; rep < 4; rep++)
    for (let targetCount = 5; targetCount <= 8; targetCount++)
      out.push(
        createPairCollisionCandidate({
          split: "confirmatory",
          seed: seed++,
          targetCount,
          visualVariant: 100 + rep * 4 + targetCount - 5,
        }),
      );
  return out;
}
const colors = ["#df3c30", "#2466cc", "#1d9b5f", "#9146c7", "#e0a600", "#2a9292"];
export function renderPairCollisionSvg(
  candidate: PairCollisionCandidate,
  timestampMs: number,
  control = false,
) {
  const start = 700,
    eventMs = 540,
    activeMs = 440,
    index = Math.floor((timestampMs - start) / eventMs),
    phase = (((timestampMs - start) % eventMs) + eventMs) % eventMs,
    pair = index >= 0 && index < 24 && phase < activeMs ? candidate.parameters.events[index] : null,
    p = pair ? Math.sin(Math.PI * Math.min(1, phase / activeMs)) : 0,
    x1 = 150 + p * 175,
    x2 = 570 - p * 175,
    balls = pair
      ? [pair[0], pair[1]]
          .map((identity, side) => {
            const x = side ? x2 : x1;
            return `<circle cx="${x}" cy="350" r="58" fill="${colors[identity]}" stroke="#202322" stroke-width="6"/><text x="${x}" y="368" text-anchor="middle" font-family="Arial" font-size="46" font-weight="700" fill="#fff">${String.fromCharCode(65 + identity)}</text>`;
          })
          .join("")
      : "",
    targetSoFar = candidate.parameters.events
      .slice(0, Math.max(0, index + (phase > activeMs / 2 ? 1 : 0)))
      .filter(([a, b]) => (a === 0 && b === 1) || (a === 1 && b === 0)).length,
    status = index < 0 ? "GET READY" : index < 24 ? `COLLISION ${index + 1} OF 24` : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="650"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="47" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700">COUNT A+B COLLISIONS ONLY</text><text x="360" y="82" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Ignore all other identity pairings</text><text x="360" y="130" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${status}</text><rect x="70" y="180" width="580" height="340" rx="26" fill="#fffef9" stroke="#202322" stroke-width="6"/>${balls}${control ? `<rect x="230" y="550" width="260" height="58" rx="14" fill="#202322"/><text x="360" y="589" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700" fill="#fff">A+B COUNT: ${targetSoFar}</text>` : ""}</svg>`;
}
