import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const symbolSequenceVersion = "temporal-symbol-sequence-recall-v1";
export const symbolSequenceAnswers = ["A", "B", "C", "D"] as const;
const sequenceSchema = z.array(z.number().int().min(0).max(3)).length(12);

export const symbolSequenceCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-twelve-symbol-near-permutation"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("temporal-sequence-reconstruction"),
  question: z.string(),
  answerOptions: z.array(z.enum(symbolSequenceAnswers)).length(4),
  expectedAnswer: z.enum(symbolSequenceAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    correctPanel: z.number().int().min(0).max(3),
    sequence: sequenceSchema,
    options: z.array(sequenceSchema).length(4),
    videoDurationMs: z.literal(11_800),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type SymbolSequenceCandidate = z.infer<typeof symbolSequenceCandidateSchema>;

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

function makeSequence(random: () => number) {
  const sequence: number[] = [];
  while (sequence.length < 12) {
    const symbol = Math.floor(random() * 4);
    if (symbol !== sequence.at(-1)) sequence.push(symbol);
  }
  return sequence;
}

function makeDistractor(sequence: readonly number[], random: () => number, used: Set<string>) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const output = [...sequence];
    const first = Math.floor(random() * 11);
    let second = first + 1 + Math.floor(random() * Math.min(3, 11 - first));
    second = Math.min(11, second);
    if (output[first] === output[second]) continue;
    [output[first], output[second]] = [output[second]!, output[first]!];
    const key = output.join("");
    if (!used.has(key)) {
      used.add(key);
      return output;
    }
  }
  throw new Error("Could not construct a unique sequence distractor.");
}

export function createSymbolSequenceCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  correctPanel: number;
  visualVariant?: number;
}) {
  const random = rng(input.seed + 181);
  const sequence = makeSequence(random);
  const used = new Set([sequence.join("")]);
  const options = Array.from({ length: 4 }, (_, panel) =>
    panel === input.correctPanel ? [...sequence] : makeDistractor(sequence, random, used),
  );
  const visualVariant = input.visualVariant ?? input.seed % 239;
  return symbolSequenceCandidateSchema.parse({
    id: `ss-${sha256(JSON.stringify({ ...input, sequence, options, visualVariant })).slice(0, 16)}`,
    cellId: "cell-twelve-symbol-near-permutation",
    split: input.split,
    seed: input.seed,
    failureModeId: "temporal-sequence-reconstruction",
    question: "Which option reproduces the COMPLETE twelve-symbol sequence in the exact order shown?",
    answerOptions: shuffled(symbolSequenceAnswers, rng(input.seed + 37)),
    expectedAnswer: symbolSequenceAnswers[input.correctPanel],
    humanSolvability: "unverified",
    parameters: {
      correctPanel: input.correctPanel,
      sequence,
      options,
      videoDurationMs: 11_800,
      fps: 30,
      visualVariant,
    },
  });
}

export function createSymbolSequenceGrid() {
  const candidates: SymbolSequenceCandidate[] = [];
  let seed = 5_000_000;
  for (let replicate = 0; replicate < 2; replicate += 1) {
    for (let panel = 0; panel < 4; panel += 1) {
      candidates.push(
        createSymbolSequenceCandidate({
          split: "discovery",
          seed: seed++,
          correctPanel: panel,
          visualVariant: replicate * 4 + panel,
        }),
      );
    }
  }
  return candidates;
}

const colors = ["#2466cc", "#f4d934", "#df3c30", "#9146c7"];

function symbolSvg(symbol: number, x: number, y: number, size: number) {
  if (symbol === 0) return `<circle cx="${x}" cy="${y}" r="${size * 0.42}" fill="${colors[symbol]}"/>`;
  if (symbol === 1)
    return `<polygon points="${x},${y - size * 0.5} ${x - size * 0.48},${y + size * 0.42} ${x + size * 0.48},${y + size * 0.42}" fill="${colors[symbol]}"/>`;
  if (symbol === 2)
    return `<rect x="${x - size * 0.42}" y="${y - size * 0.42}" width="${size * 0.84}" height="${size * 0.84}" rx="${size * 0.08}" fill="${colors[symbol]}"/>`;
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / 5;
    const radius = index % 2 ? size * 0.2 : size * 0.5;
    return `${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`;
  }).join(" ");
  return `<polygon points="${points}" fill="${colors[symbol]}"/>`;
}

export function renderSymbolSequenceSvg(
  candidate: SymbolSequenceCandidate,
  timestampMs: number,
  historyControl = false,
) {
  const start = 700;
  const eventMs = 480;
  const index = Math.floor((timestampMs - start) / eventMs);
  const local = timestampMs - start - index * eventMs;
  const active = index >= 0 && index < 12 && local < 390 ? candidate.parameters.sequence[index] : -1;
  const optionsVisible = timestampMs >= start + 12 * eventMs + 500;
  const history = historyControl
    ? candidate.parameters.sequence
        .slice(0, Math.max(0, Math.min(12, index + 1)))
        .map((symbol, position) => symbolSvg(symbol, 78 + position * 51, 590, 30))
        .join("")
    : "";
  const panels = optionsVisible
    ? candidate.parameters.options
        .map((sequence, panel) => {
          const y = 205 + panel * 92;
          const icons = sequence
            .map((symbol, position) => symbolSvg(symbol, 118 + position * 46, y, 28))
            .join("");
          return `<text x="58" y="${y + 9}" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700">${symbolSequenceAnswers[panel]}</text>${icons}`;
        })
        .join("")
    : "";
  const status =
    index < 0
      ? "GET READY"
      : index < 12
        ? `SYMBOL ${index + 1} OF 12`
        : optionsVisible
          ? "CHOOSE THE MATCHING SEQUENCE"
          : "REMEMBER THE ORDER";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="680"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="48" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700">REMEMBER THE EXACT SYMBOL ORDER</text><text x="360" y="86" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${status}</text>${active >= 0 ? symbolSvg(active, 360, 335, 180) : ""}${panels}${historyControl ? `<rect x="48" y="552" width="624" height="76" rx="12" fill="#fffef9" stroke="#1d9b5f" stroke-width="4"/>${history}` : ""}</svg>`;
}
