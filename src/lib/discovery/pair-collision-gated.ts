import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const pairCollisionGatedVersion = "identity-pair-collision-gated-v1";
export const pairCollisionGatedAnswers = ["5", "6", "7", "8"] as const;
const gateSchema = z.enum(["AMBER", "CYAN"]);
const pairSchema = z.tuple([z.number().int().min(0).max(5), z.number().int().min(0).max(5)]);
const eventSchema = z.object({ pair: pairSchema, gate: gateSchema });

export const pairCollisionGatedCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-gated-variable-target-pair-collisions"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("identity-pair-interaction-counting"),
  question: z.string(),
  answerOptions: z.array(z.enum(pairCollisionGatedAnswers)).length(4),
  expectedAnswer: z.enum(pairCollisionGatedAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetCount: z.number().int().min(5).max(8),
    targetPair: pairSchema,
    targetGate: gateSchema,
    events: z.array(eventSchema).length(32),
    wrongGateTargetPairEvents: z.literal(6),
    videoDurationMs: z.literal(18000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type PairCollisionGatedCandidate = z.infer<typeof pairCollisionGatedCandidateSchema>;

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
function pair(left: number, right: number): [number, number] {
  return left < right ? [left, right] : [right, left];
}
function equalPair(left: readonly number[], right: readonly number[]) {
  return left[0] === right[0] && left[1] === right[1];
}
function otherGate(gate: "AMBER" | "CYAN") {
  return gate === "AMBER" ? ("CYAN" as const) : ("AMBER" as const);
}

function constructEvents(
  seed: number,
  targetCount: number,
  targetPair: readonly [number, number],
  targetGate: "AMBER" | "CYAN",
) {
  const random = rng(seed);
  const target = pair(targetPair[0], targetPair[1]);
  const others = [0, 1, 2, 3, 4, 5].filter((identity) => !target.includes(identity));
  const events: Array<{ pair: [number, number]; gate: "AMBER" | "CYAN" }> = [];
  for (let index = 0; index < targetCount; index += 1) events.push({ pair: [...target], gate: targetGate });
  for (let index = 0; index < 6; index += 1) events.push({ pair: [...target], gate: otherGate(targetGate) });
  for (let index = 0; index < 6; index += 1)
    events.push({
      pair: pair(target[index % 2]!, others[Math.floor(random() * others.length)]!),
      gate: targetGate,
    });
  while (events.filter((event) => event.gate === targetGate).length < 16) {
    const left = Math.floor(random() * others.length);
    let right = Math.floor(random() * (others.length - 1));
    if (right >= left) right += 1;
    events.push({ pair: pair(others[left]!, others[right]!), gate: targetGate });
  }
  while (events.filter((event) => event.gate === otherGate(targetGate)).length < 16) {
    const first = random() < 0.65 ? target[Math.floor(random() * 2)]! : others[Math.floor(random() * 4)]!;
    let second = Math.floor(random() * 6);
    while (second === first || equalPair(pair(first, second), target)) second = Math.floor(random() * 6);
    events.push({ pair: pair(first, second), gate: otherGate(targetGate) });
  }
  return shuffled(events, random);
}

export function countGatedTargetPair(
  events: readonly { pair: readonly [number, number]; gate: string }[],
  targetPair: readonly [number, number],
  targetGate: string,
) {
  const target = pair(targetPair[0], targetPair[1]);
  return events.filter((event) => event.gate === targetGate && equalPair(event.pair, target)).length;
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

export function createPairCollisionGatedCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetCount: number;
  targetPair: readonly [number, number];
  targetGate: "AMBER" | "CYAN";
  visualVariant: number;
}) {
  const targetPair = pair(input.targetPair[0], input.targetPair[1]);
  const events = constructEvents(input.seed + 827, input.targetCount, targetPair, input.targetGate);
  const names = targetPair.map((identity) => String.fromCharCode(65 + identity));
  return pairCollisionGatedCandidateSchema.parse({
    id: `pcg-${sha256(JSON.stringify({ ...input, targetPair, events })).slice(0, 16)}`,
    cellId: "cell-gated-variable-target-pair-collisions",
    split: input.split,
    seed: input.seed,
    failureModeId: "identity-pair-interaction-counting",
    question: `How many ${names[0]}+${names[1]} collisions occurred during ${input.targetGate} frames? Count only events satisfying BOTH the pair and frame-color conditions.`,
    answerOptions: shuffled(pairCollisionGatedAnswers, rng(input.seed + 71)),
    expectedAnswer: String(input.targetCount),
    humanSolvability: "unverified",
    parameters: {
      targetCount: input.targetCount,
      targetPair,
      targetGate: input.targetGate,
      events,
      wrongGateTargetPairEvents: 6,
      videoDurationMs: 18000,
      fps: 30,
      visualVariant: input.visualVariant,
    },
  });
}

export function createPairCollisionGatedSet(split: "discovery" | "confirmatory") {
  const repeats = split === "discovery" ? 2 : 4;
  const seedBase = split === "discovery" ? 5_300_000 : 5_310_000;
  const candidates: PairCollisionGatedCandidate[] = [];
  for (let repeat = 0; repeat < repeats; repeat += 1)
    for (let targetCount = 5; targetCount <= 8; targetCount += 1) {
      const index = candidates.length;
      candidates.push(
        createPairCollisionGatedCandidate({
          split,
          seed: seedBase + index,
          targetCount,
          targetPair: targetPairs[(index + (split === "confirmatory" ? 5 : 0)) % targetPairs.length]!,
          targetGate: (index + repeat) % 2 ? "CYAN" : "AMBER",
          visualVariant: (split === "discovery" ? 300 : 700) + index,
        }),
      );
    }
  return candidates;
}

const colors = ["#df3c30", "#2466cc", "#1d9b5f", "#9146c7", "#e0a600", "#2a9292"];
const gateColors = { AMBER: "#e0a600", CYAN: "#22a8bc" } as const;

export function renderPairCollisionGatedSvg(
  candidate: PairCollisionGatedCandidate,
  timestampMs: number,
  control = false,
) {
  const start = 700,
    eventMs = 520,
    activeMs = 430,
    index = Math.floor((timestampMs - start) / eventMs),
    phase = (((timestampMs - start) % eventMs) + eventMs) % eventMs,
    event =
      index >= 0 && index < candidate.parameters.events.length && phase < activeMs
        ? candidate.parameters.events[index]
        : null,
    progress = event ? Math.sin(Math.PI * Math.min(1, phase / activeMs)) : 0,
    x1 = 150 + progress * 175,
    x2 = 570 - progress * 175,
    names = candidate.parameters.targetPair.map((identity) => String.fromCharCode(65 + identity)),
    balls = event
      ? event.pair
          .map((identity, side) => {
            const x = side ? x2 : x1;
            return `<circle cx="${x}" cy="350" r="58" fill="${colors[identity]}" stroke="#202322" stroke-width="6"/><text x="${x}" y="368" text-anchor="middle" font-family="Arial" font-size="46" font-weight="700" fill="#fff">${String.fromCharCode(65 + identity)}</text>`;
          })
          .join("")
      : "",
    currentGate = event?.gate ?? candidate.parameters.targetGate,
    targetSoFar = countGatedTargetPair(
      candidate.parameters.events.slice(0, Math.max(0, index + (phase > activeMs / 2 ? 1 : 0))),
      candidate.parameters.targetPair,
      candidate.parameters.targetGate,
    ),
    status = index < 0 ? "GET READY" : index < 32 ? `COLLISION ${index + 1} OF 32` : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="650"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="42" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">COUNT ${names[0]}+${names[1]} ONLY IN ${candidate.parameters.targetGate}</text><text x="360" y="76" text-anchor="middle" font-family="Arial" font-size="16" fill="#59605d">Both pair AND frame color must match</text><text x="360" y="122" text-anchor="middle" font-family="Arial" font-size="21" font-weight="700">${status}</text><rect x="64" y="166" width="592" height="366" rx="28" fill="#fffef9" stroke="${gateColors[currentGate]}" stroke-width="14"/><rect x="276" y="184" width="168" height="42" rx="21" fill="${gateColors[currentGate]}"/><text x="360" y="212" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#fff">${currentGate}</text>${balls}${control ? `<rect x="200" y="555" width="320" height="56" rx="14" fill="#202322"/><text x="360" y="592" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700" fill="#fff">MATCH COUNT: ${targetSoFar}</text>` : ""}</svg>`;
}
