import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const wireCrossingCountVersion = "wire-crossing-count-v1";
export const crossingCountAnswers = ["4", "6", "8", "10"] as const;
export const precisionCrossingCountVersion = "wire-crossing-count-v2-precision";
export const precisionCrossingCountAnswers = ["7", "8", "9", "10"] as const;

export const wireCrossingCountCandidateSchema = z.object({
  id: z.string(), cellId: z.string(), split: z.enum(["discovery", "confirmatory"]), seed: z.number().int(),
  failureModeId: z.literal("identity-through-occlusion"), question: z.string(),
  answerOptions: z.array(z.string().regex(/^\d+$/)).length(4), expectedAnswer: z.string().regex(/^\d+$/),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({ totalCrossings: z.number().int().min(12).max(64), targetCrossings: z.number().int().min(2).max(20), targetWire: z.number().int().min(0).max(3), visualVariant: z.number().int().nonnegative() }),
});
export type WireCrossingCountCandidate = z.infer<typeof wireCrossingCountCandidateSchema>;

function stableId(prefix: string, value: unknown) { return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`; }
function rotate<T>(values: readonly T[], n: number) { return values.map((_, i) => values[(i + n) % values.length]!); }
function rng(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x1_0000_0000; }; }

export function createWireCrossingCountCandidate(input: { split: "discovery" | "confirmatory"; seed: number; totalCrossings: number; targetCrossings: string; targetWire: number; answerSet?: readonly string[]; visualVariant?: number }) {
  const visualVariant = input.visualVariant ?? input.seed % 19;
  const answerSet = input.answerSet ?? crossingCountAnswers;
  if (answerSet.length !== 4 || !answerSet.includes(input.targetCrossings)) throw new Error("A four-value answer set must contain the target count.");
  return wireCrossingCountCandidateSchema.parse({
    id: stableId("wc", { ...input, visualVariant }), cellId: stableId("cell", { totalCrossings: input.totalCrossings }),
    split: input.split, seed: input.seed, failureModeId: "identity-through-occlusion",
    question: `How many times does wire ${String.fromCharCode(65 + input.targetWire)} cross another wire?`,
    answerOptions: rotate(answerSet, input.seed % 4), expectedAnswer: input.targetCrossings,
    humanSolvability: "unverified", parameters: { totalCrossings: input.totalCrossings, targetCrossings: Number(input.targetCrossings), targetWire: input.targetWire, visualVariant },
  });
}

export function createPrecisionWireCrossingCountDiscoveryGrid() {
  const candidates: WireCrossingCountCandidate[] = []; let seed = 820_000; let cell = 0;
  for (const totalCrossings of [28, 40, 52]) {
    for (const [index, targetCrossings] of precisionCrossingCountAnswers.entries()) {
      candidates.push(createWireCrossingCountCandidate({ split: "discovery", seed, totalCrossings, targetCrossings, targetWire: (index + cell) % 4, answerSet: precisionCrossingCountAnswers })); seed += 1;
    }
    cell += 1;
  }
  return candidates;
}

export function createWireCrossingCountDiscoveryGrid() {
  const candidates: WireCrossingCountCandidate[] = []; let seed = 810_000; let cell = 0;
  for (const totalCrossings of [16, 28, 40]) {
    for (const [index, targetCrossings] of crossingCountAnswers.entries()) {
      candidates.push(createWireCrossingCountCandidate({ split: "discovery", seed, totalCrossings, targetCrossings, targetWire: (index + cell) % 4 })); seed += 1;
    }
    cell += 1;
  }
  return candidates;
}

export function createWireCrossingCountHoldout(representative: WireCrossingCountCandidate) {
  const candidates: WireCrossingCountCandidate[] = []; let seed = 940_000;
  for (let replicate = 0; replicate < 4; replicate += 1) for (const [index, targetCrossings] of crossingCountAnswers.entries()) {
    candidates.push(createWireCrossingCountCandidate({ split: "confirmatory", seed, totalCrossings: representative.parameters.totalCrossings, targetCrossings, targetWire: (index + replicate) % 4, visualVariant: 30 + replicate * 4 + index })); seed += 1;
  }
  return candidates;
}

export function createPrecisionWireCrossingCountHoldout(representative: WireCrossingCountCandidate) {
  const candidates: WireCrossingCountCandidate[] = []; let seed = 950_000;
  for (let replicate = 0; replicate < 4; replicate += 1) for (const [index, targetCrossings] of precisionCrossingCountAnswers.entries()) {
    candidates.push(createWireCrossingCountCandidate({ split: "confirmatory", seed, totalCrossings: representative.parameters.totalCrossings, targetCrossings, targetWire: (index + replicate + 1) % 4, answerSet: precisionCrossingCountAnswers, visualVariant: 60 + replicate * 4 + index })); seed += 1;
  }
  return candidates;
}

export function crossingSequence(candidate: WireCrossingCountCandidate) {
  const p = candidate.parameters; const random = rng(candidate.seed + p.visualVariant * 65537);
  const targetSteps = new Set<number>();
  for (let i = 0; i < p.targetCrossings; i += 1) targetSteps.add(Math.floor(((i + 0.5) * p.totalCrossings) / p.targetCrossings));
  const positions = [0, 1, 2, 3]; const sequence: number[] = [];
  for (let step = 0; step < p.totalCrossings; step += 1) {
    const targetRow = positions.indexOf(p.targetWire); let choices: number[];
    if (targetSteps.has(step)) choices = [targetRow - 1, targetRow].filter((row) => row >= 0 && row < 3);
    else choices = [0, 1, 2].filter((row) => row !== targetRow && row + 1 !== targetRow);
    const row = choices[Math.floor(random() * choices.length)]!; sequence.push(row);
    [positions[row], positions[row + 1]] = [positions[row + 1]!, positions[row]!];
  }
  return sequence;
}

export function countTargetCrossings(candidate: WireCrossingCountCandidate) {
  const positions = [0, 1, 2, 3]; let count = 0;
  for (const row of crossingSequence(candidate)) {
    if (positions[row] === candidate.parameters.targetWire || positions[row + 1] === candidate.parameters.targetWire) count += 1;
    [positions[row], positions[row + 1]] = [positions[row + 1]!, positions[row]!];
  }
  return count;
}

export function renderWireCrossingCountSvg(candidate: WireCrossingCountCandidate, oracle = false) {
  const sequence = crossingSequence(candidate); const width = 1800, height = 900, left = 150, right = 1650; const ys = [190, 360, 530, 700];
  const positions = [0, 1, 2, 3]; const segments: Array<{ wire: number; d: string; targetCrossing: boolean; cx: number; cy: number }> = [];
  for (let step = 0; step < sequence.length; step += 1) {
    const x0 = left + step * (right - left) / sequence.length, x1 = left + (step + 1) * (right - left) / sequence.length; const row = sequence[step]!; const next = [...positions];
    [next[row], next[row + 1]] = [next[row + 1]!, next[row]!]; const targetCrossing = positions[row] === candidate.parameters.targetWire || positions[row + 1] === candidate.parameters.targetWire;
    for (let r = 0; r < 4; r += 1) { const wire = positions[r]!, nr = next.indexOf(wire); segments.push({ wire, targetCrossing: targetCrossing && wire === candidate.parameters.targetWire, cx: (x0 + x1) / 2, cy: (ys[row]! + ys[row + 1]!) / 2, d: `M${x0.toFixed(2)} ${ys[r]} C${(x0 + (x1-x0)*.42).toFixed(2)} ${ys[r]},${(x0 + (x1-x0)*.58).toFixed(2)} ${ys[nr]},${x1.toFixed(2)} ${ys[nr]}` }); }
    positions.splice(0, 4, ...next);
  }
  const base = segments.map(s => `<path d="${s.d}" fill="none" stroke="#252928" stroke-width="9" stroke-linecap="round"/>`).join("");
  const target = oracle ? segments.filter(s => s.wire === candidate.parameters.targetWire).map(s => `<path d="${s.d}" fill="none" stroke="#e23e31" stroke-width="7"/>`).join("") : "";
  let marker = 0; const markers = oracle ? segments.filter(s => s.targetCrossing).map(s => { marker += 1; return `<circle cx="${s.cx}" cy="${s.cy}" r="18" fill="#ffe13b" stroke="#202322" stroke-width="3"/><text x="${s.cx}" y="${s.cy+7}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700">${marker}</text>`; }).join("") : "";
  const labels = ys.map((y,i) => `<circle cx="92" cy="${y}" r="33" fill="${i===candidate.parameters.targetWire?'#e23e31':'#e7e9e3'}"/><text x="92" y="${y+13}" text-anchor="middle" font-family="Arial" font-size="38" font-weight="700" fill="${i===candidate.parameters.targetWire?'#fff':'#202322'}">${String.fromCharCode(65+i)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#faf9f4"/><text x="70" y="70" font-family="Arial" font-size="34" font-weight="700">COUNT CROSSINGS ON WIRE ${String.fromCharCode(65+candidate.parameters.targetWire)}</text><text x="70" y="112" font-family="Arial" font-size="22" fill="#59605d">Follow that continuous wire. Count only crossings it participates in; ignore crossings between other wires.</text>${base}${target}${markers}${labels}</svg>`;
}
