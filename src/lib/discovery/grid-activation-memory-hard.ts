import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const hardGridActivationVersion = "unique-grid-activation-memory-v2";
export const hardGridActivationAnswers = ["13", "14", "15", "16"] as const;
export const hardGridActivationCandidateSchema = z.object({
  id: z.string(), cellId: z.literal("cell-forty-activations-six-by-six"), split: z.literal("confirmatory"),
  seed: z.number().int().nonnegative(), failureModeId: z.literal("temporal-set-cardinality"),
  question: z.string(), answerOptions: z.array(z.enum(hardGridActivationAnswers)).length(4),
  expectedAnswer: z.enum(hardGridActivationAnswers), humanSolvability: z.literal("unverified"),
  parameters: z.object({ uniqueCount: z.number().int().min(13).max(16),
    activations: z.array(z.number().int().min(0).max(35)).length(40), videoDurationMs: z.literal(18_500),
    fps: z.literal(30), visualVariant: z.number().int().nonnegative() }),
});
export type HardGridActivationCandidate = z.infer<typeof hardGridActivationCandidateSchema>;
function rng(seed: number) { let state = seed >>> 0; return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000; }
function shuffled<T>(values: readonly T[], random: () => number) { const output = [...values]; for (let i = output.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [output[i], output[j]] = [output[j]!, output[i]!]; } return output; }
export function createHardGridActivationCandidate(input: { seed: number; uniqueCount: number; visualVariant: number }) {
  const random = rng(input.seed + 137);
  const cells = shuffled(Array.from({ length: 36 }, (_, index) => index), random).slice(0, input.uniqueCount);
  const activations = [...cells];
  while (activations.length < 40) activations.push(cells[Math.floor(random() * cells.length)]!);
  const ordered = shuffled(activations, random);
  return hardGridActivationCandidateSchema.parse({
    id: `gah-${sha256(JSON.stringify({ ...input, ordered })).slice(0, 16)}`, cellId: "cell-forty-activations-six-by-six",
    split: "confirmatory", seed: input.seed, failureModeId: "temporal-set-cardinality",
    question: "How many DIFFERENT grid cells lit up at least once? Repeats count only once.",
    answerOptions: shuffled(hardGridActivationAnswers, rng(input.seed + 61)), expectedAnswer: String(input.uniqueCount),
    humanSolvability: "unverified", parameters: { uniqueCount: input.uniqueCount, activations: ordered,
      videoDurationMs: 18_500, fps: 30, visualVariant: input.visualVariant },
  });
}
export function createHardGridActivationHoldout() { const output: HardGridActivationCandidate[] = []; let seed = 4_810_000; for (let replicate = 0; replicate < 4; replicate += 1) for (let count = 13; count <= 16; count += 1) output.push(createHardGridActivationCandidate({ seed: seed++, uniqueCount: count, visualVariant: 100 + replicate * 4 + count - 13 })); return output; }
export function hardUniqueActivationCount(values: readonly number[]) { return new Set(values).size; }
export function renderHardGridActivationSvg(candidate: HardGridActivationCandidate, timestampMs: number, persistentControl = false) {
  const start = 800, eventMs = 400, index = Math.floor((timestampMs - start) / eventMs), local = timestampMs - start - index * eventMs;
  const active = index >= 0 && index < 40 && local < 315 ? candidate.parameters.activations[index] : -1;
  const seen = new Set(candidate.parameters.activations.slice(0, Math.max(0, Math.min(40, index + 1))));
  const cells = Array.from({ length: 36 }, (_, cell) => { const row = Math.floor(cell / 6), column = cell % 6, x = 130 + column * 78, y = 145 + row * 78, isActive = cell === active, wasSeen = persistentControl && seen.has(cell); return `<rect x="${x}" y="${y}" width="67" height="67" rx="8" fill="${isActive ? "#f4d934" : wasSeen ? "#9ad7b1" : "#fffef9"}" stroke="#202322" stroke-width="4"/>`; }).join("");
  const status = index < 0 ? "GET READY" : index < 40 ? `ACTIVATION ${index + 1} OF 40` : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="680"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="43" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700">COUNT UNIQUE ACTIVATED CELLS</text><text x="360" y="76" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">A repeated cell contributes only once</text><text x="360" y="116" text-anchor="middle" font-family="Arial" font-size="21" font-weight="700">${status}</text>${cells}<text x="360" y="646" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">${persistentControl ? `CONTROL: ${seen.size} distinct cells have appeared` : "Remember which positions appeared before"}</text></svg>`;
}
