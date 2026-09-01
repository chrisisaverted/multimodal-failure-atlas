import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const gridActivationVersion = "unique-grid-activation-memory-v1";
export const gridActivationAnswers = ["8", "9", "10", "11"] as const;

export const gridActivationCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-twenty-four-activations-five-by-five"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("temporal-set-cardinality"),
  question: z.string(),
  answerOptions: z.array(z.enum(gridActivationAnswers)).length(4),
  expectedAnswer: z.enum(gridActivationAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    uniqueCount: z.number().int().min(8).max(11),
    activations: z.array(z.number().int().min(0).max(24)).length(24),
    videoDurationMs: z.literal(14_400),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type GridActivationCandidate = z.infer<typeof gridActivationCandidateSchema>;

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

export function createGridActivationCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  uniqueCount: number;
  visualVariant?: number;
}) {
  const random = rng(input.seed + 137);
  const cells = shuffled(
    Array.from({ length: 25 }, (_, index) => index),
    random,
  ).slice(0, input.uniqueCount);
  const activations = [...cells];
  while (activations.length < 24) activations.push(cells[Math.floor(random() * cells.length)]!);
  const ordered = shuffled(activations, random);
  const visualVariant = input.visualVariant ?? input.seed % 251;
  return gridActivationCandidateSchema.parse({
    id: `ga-${sha256(JSON.stringify({ ...input, ordered, visualVariant })).slice(0, 16)}`,
    cellId: "cell-twenty-four-activations-five-by-five",
    split: input.split,
    seed: input.seed,
    failureModeId: "temporal-set-cardinality",
    question:
      "How many DIFFERENT grid cells lit up at least once? Repeated activations of the same cell count only once.",
    answerOptions: shuffled(gridActivationAnswers, rng(input.seed + 61)),
    expectedAnswer: String(input.uniqueCount),
    humanSolvability: "unverified",
    parameters: {
      uniqueCount: input.uniqueCount,
      activations: ordered,
      videoDurationMs: 14_400,
      fps: 30,
      visualVariant,
    },
  });
}

export function createGridActivationGrid() {
  const candidates: GridActivationCandidate[] = [];
  let seed = 4_800_000;
  for (let replicate = 0; replicate < 2; replicate += 1) {
    for (let count = 8; count <= 11; count += 1) {
      candidates.push(
        createGridActivationCandidate({
          split: "discovery",
          seed: seed++,
          uniqueCount: count,
          visualVariant: replicate * 4 + count - 8,
        }),
      );
    }
  }
  return candidates;
}

export function uniqueActivationCount(activations: readonly number[]) {
  return new Set(activations).size;
}

export function renderGridActivationSvg(
  candidate: GridActivationCandidate,
  timestampMs: number,
  persistentControl = false,
) {
  const start = 900;
  const eventMs = 520;
  const index = Math.floor((timestampMs - start) / eventMs);
  const local = timestampMs - start - index * eventMs;
  const active = index >= 0 && index < 24 && local < 410 ? candidate.parameters.activations[index] : -1;
  const seen = new Set(candidate.parameters.activations.slice(0, Math.max(0, Math.min(24, index + 1))));
  const cells = Array.from({ length: 25 }, (_, cell) => {
    const row = Math.floor(cell / 5);
    const column = cell % 5;
    const x = 155 + column * 86;
    const y = 170 + row * 86;
    const isActive = cell === active;
    const wasSeen = persistentControl && seen.has(cell);
    return `<rect x="${x}" y="${y}" width="74" height="74" rx="9" fill="${isActive ? "#f4d934" : wasSeen ? "#9ad7b1" : "#fffef9"}" stroke="#202322" stroke-width="4"/>`;
  }).join("");
  const status = index < 0 ? "GET READY" : index < 24 ? `ACTIVATION ${index + 1} OF 24` : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="680"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="48" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700">COUNT UNIQUE ACTIVATED CELLS</text><text x="360" y="82" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">A repeated cell still contributes only one to the final total</text><text x="360" y="125" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${status}</text>${cells}<text x="360" y="638" text-anchor="middle" font-family="Arial" font-size="18" fill="#59605d">${persistentControl ? "CONTROL: previously activated cells remain green" : "Remember which positions have appeared before"}</text></svg>`;
}
