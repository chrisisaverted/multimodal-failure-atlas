import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const swapTrackingVersion = "sequential-identity-permutation-v1";
export const swapAnswers = ["1", "2", "3", "4"] as const;
const swapSchema = z.tuple([z.number().int().min(0).max(3), z.number().int().min(0).max(3)]);
export const swapTrackingCandidateSchema = z.object({
  id: z.string(), cellId: z.string(), split: z.enum(["discovery", "confirmatory"]), seed: z.number().int().nonnegative(),
  failureModeId: z.literal("sequential-identity-permutation"), question: z.string(), answerOptions: z.array(z.enum(swapAnswers)).length(4), expectedAnswer: z.enum(swapAnswers), humanSolvability: z.literal("unverified"),
  parameters: z.object({ initialTarget: z.number().int().min(0).max(3), targetFinal: z.number().int().min(0).max(3), swaps: z.array(swapSchema).length(12), videoDurationMs: z.literal(13200), fps: z.literal(30), visualVariant: z.number().int().nonnegative() }),
});
export type SwapTrackingCandidate = z.infer<typeof swapTrackingCandidateSchema>;
function rng(seed: number) { let state = seed >>> 0; return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000); }
function shuffled<T>(values: readonly T[], random: () => number) { const result = [...values]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j]!, result[i]!]; } return result; }
export function applySwaps(initial: number, swaps: readonly (readonly [number, number])[]) { let position = initial; for (const [a, b] of swaps) { if (position === a) position = b; else if (position === b) position = a; } return position; }
function makeSwaps(seed: number) { const random = rng(seed); return Array.from({ length: 12 }, () => { const a = Math.floor(random() * 4); let b = Math.floor(random() * 3); if (b >= a) b++; return [a, b] as [number, number]; }); }
export function createSwapTrackingCandidate(input: { split: "discovery" | "confirmatory"; seed: number; targetFinal: number; visualVariant?: number }) {
  let attempt = 0, swaps = makeSwaps(input.seed), initialTarget = input.seed % 4;
  while (applySwaps(initialTarget, swaps) !== input.targetFinal && attempt < 10000) { attempt++; swaps = makeSwaps(input.seed + attempt * 409); initialTarget = (input.seed + attempt) % 4; }
  if (applySwaps(initialTarget, swaps) !== input.targetFinal) throw new Error("Target binding failed");
  const visualVariant = input.visualVariant ?? input.seed % 173;
  return swapTrackingCandidateSchema.parse({ id: `st-${sha256(JSON.stringify({ ...input, swaps, initialTarget, visualVariant })).slice(0, 16)}`, cellId: "cell-twelve-sequential-swaps", split: input.split, seed: input.seed, failureModeId: "sequential-identity-permutation", question: "The gold token is shown at the start, then all tokens become identical. After the 12 shown swaps, which numbered slot contains the original gold token?", answerOptions: shuffled(swapAnswers, rng(input.seed + 13)), expectedAnswer: swapAnswers[input.targetFinal], humanSolvability: "unverified", parameters: { initialTarget, targetFinal: input.targetFinal, swaps, videoDurationMs: 13200, fps: 30, visualVariant } });
}
export function createSwapTrackingGrid() { const candidates: SwapTrackingCandidate[] = []; let seed = 3_100_000; for (let rep = 0; rep < 2; rep++) for (let answer = 0; answer < 4; answer++) candidates.push(createSwapTrackingCandidate({ split: "discovery", seed: seed++, targetFinal: answer, visualVariant: rep * 4 + answer })); return candidates; }
const xPositions = [105, 275, 445, 615];
function smoothstep(value: number) { return value * value * (3 - 2 * value); }
export function renderSwapTrackingSvg(candidate: SwapTrackingCandidate, timestampMs: number, control = false) {
  const introEnd = 1200, moveMs = 850, gapMs = 100, activeIndex = Math.floor((timestampMs - introEnd) / (moveMs + gapMs)), phase = Math.max(0, Math.min(1, ((timestampMs - introEnd) % (moveMs + gapMs)) / moveMs));
  const positions = [0, 1, 2, 3]; for (let i = 0; i < Math.min(12, Math.max(0, activeIndex)); i++) { const [a, b] = candidate.parameters.swaps[i]!; [positions[a], positions[b]] = [positions[b]!, positions[a]!]; }
  const [activeA, activeB] = activeIndex >= 0 && activeIndex < 12 ? candidate.parameters.swaps[activeIndex]! : [-1, -1], progress = smoothstep(phase);
  const tokens = positions.map((identity, slot) => { let x = xPositions[slot]!, y = 350; if (slot === activeA || slot === activeB) { const other = slot === activeA ? activeB : activeA; x += (xPositions[other]! - xPositions[slot]!) * progress; y -= Math.sin(Math.PI * progress) * (slot === activeA ? 95 : -70); } const target = identity === candidate.parameters.initialTarget, visibleTarget = timestampMs < introEnd || control; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="42" fill="${target && visibleTarget ? "#e0a600" : "#59605d"}" stroke="${target && control ? "#f4d934" : "#202322"}" stroke-width="${target && control ? 10 : 5}"/>`; }).join("");
  const labels = xPositions.map((x, i) => `<text x="${x}" y="475" text-anchor="middle" font-family="Arial" font-size="36" font-weight="700">${i + 1}</text>`).join(""), status = timestampMs < introEnd ? "MEMORIZE THE GOLD TOKEN" : activeIndex < 12 ? `SWAP ${Math.max(1, activeIndex + 1)} OF 12` : "WHICH SLOT HOLDS THE ORIGINAL?";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="600"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="54" text-anchor="middle" font-family="Arial" font-size="25" font-weight="700">TRACK ONE IDENTITY THROUGH SWAPS</text><text x="360" y="94" text-anchor="middle" font-family="Arial" font-size="18" fill="#59605d">${control ? "CONTROL: gold identity remains visible" : "The target becomes gray after the introduction"}</text><text x="360" y="145" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">${status}</text><line x1="55" y1="420" x2="665" y2="420" stroke="#202322" stroke-width="5"/>${tokens}${labels}<text x="360" y="555" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Only the two moving tokens swap slots.</text></svg>`;
}
