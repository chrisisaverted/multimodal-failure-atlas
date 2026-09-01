import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const coflashVersion = "distributed-coflash-counting-v1";
export const coflashHardVersion = "distributed-coflash-counting-v2";
export const coflashAnswers = ["A+B", "A+C", "B+D", "C+D"] as const;
const pairIndices = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
] as const;
const beatSchema = z.tuple([z.number().int().min(0).max(3), z.number().int().min(0).max(3)]);
export const coflashCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("distributed-temporal-cooccurrence-counting"),
  question: z.string(),
  answerOptions: z.array(z.enum(coflashAnswers)).length(4),
  expectedAnswer: z.enum(coflashAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetPair: z.number().int().min(0).max(3),
    beats: z.array(beatSchema).min(18).max(30),
    pairCounts: z.array(z.number().int().nonnegative()).length(4),
    targetCount: z.number().int().min(4).max(7).optional(),
    videoDurationMs: z.union([z.literal(12800), z.literal(14500)]),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type CoflashCandidate = z.infer<typeof coflashCandidateSchema>;
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
export function coflashPairCounts(beats: readonly (readonly [number, number])[]) {
  return pairIndices.map(
    ([a, b]) => beats.filter(([x, y]) => (x === a && y === b) || (x === b && y === a)).length,
  );
}
function makeBeats(seed: number, target: number, targetCount = 4, totalBeats = 18) {
  const random = rng(seed),
    desired = targetCount === 4 ? [1, 2, 3, 4] : [3, 4, 5, 7];
  const targetIndex = desired.indexOf(targetCount);
  [desired[target], desired[targetIndex]] = [desired[targetIndex]!, desired[target]!];
  const beats: [number, number][] = [];
  for (let pair = 0; pair < 4; pair++)
    for (let n = 0; n < desired[pair]!; n++) beats.push([...pairIndices[pair]!] as [number, number]);
  const otherPairs = [
    [0, 3],
    [1, 2],
  ] as const;
  while (beats.length < totalBeats)
    beats.push([...otherPairs[Math.floor(random() * otherPairs.length)]!] as [number, number]);
  return shuffled(beats, random);
}
export function createCoflashHardCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetPair: number;
  visualVariant?: number;
}) {
  const beats = makeBeats(input.seed, input.targetPair, 7, 30),
    pairCounts = coflashPairCounts(beats),
    visualVariant = input.visualVariant ?? input.seed % 269;
  if (pairCounts[input.targetPair] !== 7 || pairCounts.filter((value) => value === 7).length !== 1)
    throw new Error("Hard coflash binding failed");
  return coflashCandidateSchema.parse({
    id: `cfh-${sha256(JSON.stringify({ ...input, beats, visualVariant })).slice(0, 16)}`,
    cellId: "cell-thirty-distributed-coflashes",
    split: input.split,
    seed: input.seed,
    failureModeId: "distributed-temporal-cooccurrence-counting",
    question:
      "Which listed pair flashes together exactly SEVEN times across the complete video? Count only simultaneous flashes within one beat.",
    answerOptions: shuffled(coflashAnswers, rng(input.seed + 23)),
    expectedAnswer: coflashAnswers[input.targetPair],
    humanSolvability: "unverified",
    parameters: { targetPair: input.targetPair, beats, pairCounts, targetCount: 7, videoDurationMs: 14500, fps: 30, visualVariant },
  });
}
export function createCoflashHardGrid() {
  const out: CoflashCandidate[] = [];
  let seed = 4_400_000;
  for (let rep = 0; rep < 2; rep++)
    for (let targetPair = 0; targetPair < 4; targetPair++)
      out.push(createCoflashHardCandidate({ split: "discovery", seed: seed++, targetPair, visualVariant: rep * 4 + targetPair }));
  return out;
}
export function createCoflashCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetPair: number;
  visualVariant?: number;
}) {
  const beats = makeBeats(input.seed, input.targetPair),
    pairCounts = coflashPairCounts(beats),
    visualVariant = input.visualVariant ?? input.seed % 191;
  if (pairCounts[input.targetPair] !== 4 || pairCounts.filter((value) => value === 4).length !== 1)
    throw new Error("Coflash binding failed");
  return coflashCandidateSchema.parse({
    id: `cf-${sha256(JSON.stringify({ ...input, beats, visualVariant })).slice(0, 16)}`,
    cellId: "cell-eighteen-distributed-coflashes",
    split: input.split,
    seed: input.seed,
    failureModeId: "distributed-temporal-cooccurrence-counting",
    question:
      "Which listed pair flashes together exactly FOUR times across the complete video? Count only simultaneous flashes within one beat.",
    answerOptions: shuffled(coflashAnswers, rng(input.seed + 23)),
    expectedAnswer: coflashAnswers[input.targetPair],
    humanSolvability: "unverified",
    parameters: {
      targetPair: input.targetPair,
      beats,
      pairCounts,
      videoDurationMs: 12800,
      fps: 30,
      visualVariant,
    },
  });
}
export function createCoflashGrid() {
  const out: CoflashCandidate[] = [];
  let seed = 3_200_000;
  for (let rep = 0; rep < 2; rep++)
    for (let targetPair = 0; targetPair < 4; targetPair++)
      out.push(
        createCoflashCandidate({
          split: "discovery",
          seed: seed++,
          targetPair,
          visualVariant: rep * 4 + targetPair,
        }),
      );
  return out;
}
const laneColors = ["#df3c30", "#2466cc", "#1d9b5f", "#9146c7"];
export function renderCoflashSvg(candidate: CoflashCandidate, timestampMs: number, control = false) {
  const hard = candidate.parameters.beats.length === 30,
    start = hard ? 600 : 800,
    beatMs = hard ? 440 : 620,
    activeMs = control ? (hard ? 350 : 500) : hard ? 260 : 360,
    index = Math.floor((timestampMs - start) / beatMs),
    phase = (((timestampMs - start) % beatMs) + beatMs) % beatMs,
    active =
      index >= 0 && index < candidate.parameters.beats.length && phase < activeMs
        ? candidate.parameters.beats[index]
        : null;
  const lanes = [0, 1, 2, 3]
    .map((i) => {
      const y = 190 + i * 90,
        on = active?.includes(i);
      return `<rect x="120" y="${y - 35}" width="500" height="70" rx="18" fill="${on ? laneColors[i] : "#d4d0c7"}" stroke="#202322" stroke-width="4"/><text x="70" y="${y + 13}" text-anchor="middle" font-family="Arial" font-size="38" font-weight="700">${String.fromCharCode(65 + i)}</text>${control && on ? `<text x="580" y="${y + 8}" text-anchor="end" font-family="Arial" font-size="18" font-weight="700" fill="#fff">FLASH</text>` : ""}`;
    })
    .join("");
  const status = index < 0 ? "GET READY" : index < candidate.parameters.beats.length ? `BEAT ${index + 1} OF ${candidate.parameters.beats.length}` : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="650"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="48" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700">COUNT SIMULTANEOUS PAIRS</text><text x="360" y="84" text-anchor="middle" font-family="Arial" font-size="18" fill="#59605d">Exactly two lanes flash on every beat</text><text x="360" y="126" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">${status}</text>${lanes}<text x="360" y="604" text-anchor="middle" font-family="Arial" font-size="18" fill="#59605d">Find the listed pair that co-flashes exactly ${candidate.parameters.targetCount ?? 4} times.</text></svg>`;
}
