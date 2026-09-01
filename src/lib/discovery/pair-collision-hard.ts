import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const pairCollisionHardVersion = "identity-pair-collision-count-hard-v1";
export const pairCollisionHardAnswers = ["7", "8", "9", "10"] as const;
const pairSchema = z.tuple([z.number().int().min(0).max(5), z.number().int().min(0).max(5)]);

export const pairCollisionHardCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-thirty-two-variable-target-pair-collisions"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("identity-pair-interaction-counting"),
  question: z.string(),
  answerOptions: z.array(z.enum(pairCollisionHardAnswers)).length(4),
  expectedAnswer: z.enum(pairCollisionHardAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetCount: z.number().int().min(7).max(10),
    targetPair: pairSchema,
    events: z.array(pairSchema).length(32),
    singleTargetDistractors: z.literal(12),
    videoDurationMs: z.literal(18000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type PairCollisionHardCandidate = z.infer<typeof pairCollisionHardCandidateSchema>;

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

function normalizedPair(left: number, right: number): [number, number] {
  return left < right ? [left, right] : [right, left];
}

function samePair(left: readonly number[], right: readonly number[]) {
  return left[0] === right[0] && left[1] === right[1];
}

function makeEvents(seed: number, targetCount: number, targetPair: readonly [number, number]) {
  const random = rng(seed);
  const target = normalizedPair(targetPair[0], targetPair[1]);
  const other = [0, 1, 2, 3, 4, 5].filter((identity) => !target.includes(identity));
  const events: [number, number][] = Array.from({ length: targetCount }, () => [...target]);
  for (let index = 0; index < 12; index += 1) {
    const targetIdentity = target[index % 2]!;
    const distractor = other[Math.floor(random() * other.length)]!;
    events.push(normalizedPair(targetIdentity, distractor));
  }
  while (events.length < 32) {
    const leftIndex = Math.floor(random() * other.length);
    let rightIndex = Math.floor(random() * (other.length - 1));
    if (rightIndex >= leftIndex) rightIndex += 1;
    events.push(normalizedPair(other[leftIndex]!, other[rightIndex]!));
  }
  return shuffled(events, random);
}

export function countHardTargetPair(
  events: readonly (readonly [number, number])[],
  targetPair: readonly [number, number],
) {
  const target = normalizedPair(targetPair[0], targetPair[1]);
  return events.filter((event) => samePair(event, target)).length;
}

const targetPairs = [
  [0, 1],
  [2, 4],
  [3, 5],
  [1, 4],
  [0, 5],
  [2, 3],
  [1, 5],
  [0, 3],
] as const;

export function createPairCollisionHardCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetCount: number;
  targetPair: readonly [number, number];
  visualVariant: number;
}) {
  const targetPair = normalizedPair(input.targetPair[0], input.targetPair[1]);
  const events = makeEvents(input.seed + 313, input.targetCount, targetPair);
  const names = targetPair.map((identity) => String.fromCharCode(65 + identity));
  return pairCollisionHardCandidateSchema.parse({
    id: `pch-${sha256(JSON.stringify({ ...input, targetPair, events })).slice(0, 16)}`,
    cellId: "cell-thirty-two-variable-target-pair-collisions",
    split: input.split,
    seed: input.seed,
    failureModeId: "identity-pair-interaction-counting",
    question: `How many collision events involve the specific pair ${names[0]} AND ${names[1]} together? Ignore collisions involving any other pairing.`,
    answerOptions: shuffled(pairCollisionHardAnswers, rng(input.seed + 71)),
    expectedAnswer: String(input.targetCount),
    humanSolvability: "unverified",
    parameters: {
      targetCount: input.targetCount,
      targetPair,
      events,
      singleTargetDistractors: 12,
      videoDurationMs: 18000,
      fps: 30,
      visualVariant: input.visualVariant,
    },
  });
}

export function createPairCollisionHardSet(split: "discovery" | "confirmatory") {
  const replicates = split === "discovery" ? 2 : 4;
  const seedBase = split === "discovery" ? 5_200_000 : 5_210_000;
  const candidates: PairCollisionHardCandidate[] = [];
  for (let replicate = 0; replicate < replicates; replicate += 1)
    for (let targetCount = 7; targetCount <= 10; targetCount += 1) {
      const index = candidates.length;
      candidates.push(
        createPairCollisionHardCandidate({
          split,
          seed: seedBase + index,
          targetCount,
          targetPair: targetPairs[(index + (split === "confirmatory" ? 3 : 0)) % targetPairs.length]!,
          visualVariant: (split === "discovery" ? 200 : 500) + index,
        }),
      );
    }
  return candidates;
}

const colors = ["#df3c30", "#2466cc", "#1d9b5f", "#9146c7", "#e0a600", "#2a9292"];

export function renderPairCollisionHardSvg(
  candidate: PairCollisionHardCandidate,
  timestampMs: number,
  control = false,
) {
  const start = 700;
  const eventMs = 520;
  const activeMs = 430;
  const index = Math.floor((timestampMs - start) / eventMs);
  const phase = (((timestampMs - start) % eventMs) + eventMs) % eventMs;
  const pair =
    index >= 0 && index < candidate.parameters.events.length && phase < activeMs
      ? candidate.parameters.events[index]
      : null;
  const progress = pair ? Math.sin(Math.PI * Math.min(1, phase / activeMs)) : 0;
  const x1 = 150 + progress * 175;
  const x2 = 570 - progress * 175;
  const balls = pair
    ? [pair[0], pair[1]]
        .map((identity, side) => {
          const x = side ? x2 : x1;
          return `<circle cx="${x}" cy="350" r="58" fill="${colors[identity]}" stroke="#202322" stroke-width="6"/><text x="${x}" y="368" text-anchor="middle" font-family="Arial" font-size="46" font-weight="700" fill="#fff">${String.fromCharCode(65 + identity)}</text>`;
        })
        .join("")
    : "";
  const targetSoFar = countHardTargetPair(
    candidate.parameters.events.slice(0, Math.max(0, index + (phase > activeMs / 2 ? 1 : 0))),
    candidate.parameters.targetPair,
  );
  const names = candidate.parameters.targetPair.map((identity) => String.fromCharCode(65 + identity));
  const status =
    index < 0
      ? "GET READY"
      : index < candidate.parameters.events.length
        ? `COLLISION ${index + 1} OF ${candidate.parameters.events.length}`
        : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="650"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="47" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700">COUNT ${names[0]}+${names[1]} COLLISIONS ONLY</text><text x="360" y="82" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Ignore all other identity pairings</text><text x="360" y="130" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${status}</text><rect x="70" y="180" width="580" height="340" rx="26" fill="#fffef9" stroke="#202322" stroke-width="6"/>${balls}${control ? `<rect x="210" y="550" width="300" height="58" rx="14" fill="#202322"/><text x="360" y="589" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700" fill="#fff">${names[0]}+${names[1]} COUNT: ${targetSoFar}</text>` : ""}</svg>`;
}
