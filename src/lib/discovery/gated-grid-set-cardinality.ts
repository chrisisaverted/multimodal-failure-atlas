import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const gatedGridSetVersion = "gated-grid-set-cardinality-v1";
export const gatedGridSetAnswers = ["9", "10", "11", "12"] as const;
const gateSchema = z.enum(["AMBER", "CYAN"]);
const eventSchema = z.object({ cell: z.number().int().min(0).max(35), gate: gateSchema });

export const gatedGridSetCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-color-gated-grid-set-cardinality"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("temporal-set-cardinality"),
  question: z.string(),
  answerOptions: z.array(z.enum(gatedGridSetAnswers)).length(4),
  expectedAnswer: z.enum(gatedGridSetAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    uniqueTargetCount: z.number().int().min(9).max(12),
    targetGate: gateSchema,
    events: z.array(eventSchema).length(40),
    targetGateEvents: z.literal(20),
    wrongGateEchoes: z.literal(8),
    videoDurationMs: z.literal(20_000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type GatedGridSetCandidate = z.infer<typeof gatedGridSetCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0) / 0x1_0000_0000;
}
function shuffled<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}
function otherGate(gate: "AMBER" | "CYAN") {
  return gate === "AMBER" ? ("CYAN" as const) : ("AMBER" as const);
}

export function gatedGridTargetSet(events: readonly { cell: number; gate: string }[], targetGate: string) {
  return new Set(events.filter((event) => event.gate === targetGate).map((event) => event.cell));
}

export function createGatedGridSetCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  uniqueTargetCount: number;
  targetGate: "AMBER" | "CYAN";
  visualVariant: number;
}) {
  const random = rng(input.seed + 991);
  const targetCells = shuffled(
    Array.from({ length: 36 }, (_, index) => index),
    random,
  ).slice(0, input.uniqueTargetCount);
  const otherCells = Array.from({ length: 36 }, (_, index) => index).filter(
    (cell) => !targetCells.includes(cell),
  );
  const targetEvents = [...targetCells];
  while (targetEvents.length < 20) targetEvents.push(targetCells[Math.floor(random() * targetCells.length)]!);
  const wrongGateEvents = [
    ...shuffled(targetCells, random).slice(0, 8),
    ...shuffled(otherCells, random).slice(0, 12),
  ];
  const events = shuffled(
    [
      ...shuffled(targetEvents, random).map((cell) => ({ cell, gate: input.targetGate })),
      ...shuffled(wrongGateEvents, random).map((cell) => ({
        cell,
        gate: otherGate(input.targetGate),
      })),
    ],
    random,
  );
  return gatedGridSetCandidateSchema.parse({
    id: `ggs-${sha256(JSON.stringify({ ...input, events })).slice(0, 16)}`,
    cellId: "cell-color-gated-grid-set-cardinality",
    split: input.split,
    seed: input.seed,
    failureModeId: "temporal-set-cardinality",
    question: `How many DIFFERENT grid cells flashed during ${input.targetGate} frames? Count repeats once and ignore every ${otherGate(input.targetGate)} frame.`,
    answerOptions: shuffled(gatedGridSetAnswers, rng(input.seed + 73)),
    expectedAnswer: String(input.uniqueTargetCount),
    humanSolvability: "unverified",
    parameters: {
      uniqueTargetCount: input.uniqueTargetCount,
      targetGate: input.targetGate,
      events,
      targetGateEvents: 20,
      wrongGateEchoes: 8,
      videoDurationMs: 20_000,
      fps: 30,
      visualVariant: input.visualVariant,
    },
  });
}

export function createGatedGridSet(split: "discovery" | "confirmatory") {
  const repeats = split === "discovery" ? 2 : 4;
  const seedBase = split === "discovery" ? 5_400_000 : 5_410_000;
  const candidates: GatedGridSetCandidate[] = [];
  for (let repeat = 0; repeat < repeats; repeat += 1)
    for (let uniqueTargetCount = 9; uniqueTargetCount <= 12; uniqueTargetCount += 1) {
      const index = candidates.length;
      candidates.push(
        createGatedGridSetCandidate({
          split,
          seed: seedBase + index,
          uniqueTargetCount,
          targetGate: (index + repeat) % 2 ? "CYAN" : "AMBER",
          visualVariant: (split === "discovery" ? 400 : 800) + index,
        }),
      );
    }
  return candidates;
}

const gateColors = { AMBER: "#e1a600", CYAN: "#18a4b7" } as const;

export function renderGatedGridSetSvg(
  candidate: GatedGridSetCandidate,
  timestampMs: number,
  control = false,
) {
  const start = 650;
  const eventMs = 460;
  const activeMs = 350;
  const index = Math.floor((timestampMs - start) / eventMs);
  const phase = (((timestampMs - start) % eventMs) + eventMs) % eventMs;
  const event =
    index >= 0 && index < candidate.parameters.events.length && phase < activeMs
      ? candidate.parameters.events[index]
      : null;
  const elapsed = candidate.parameters.events.slice(0, Math.max(0, index + (phase > activeMs / 2 ? 1 : 0)));
  const targetSet = gatedGridTargetSet(elapsed, candidate.parameters.targetGate);
  const currentGate = event?.gate ?? candidate.parameters.targetGate;
  const cells = Array.from({ length: 36 }, (_, cell) => {
    const row = Math.floor(cell / 6);
    const column = cell % 6;
    const x = 154 + column * 70;
    const y = 190 + row * 62;
    const active = event?.cell === cell;
    const persisted = control && targetSet.has(cell);
    const fill = active ? gateColors[currentGate] : persisted ? "#315d43" : "#fffdf7";
    const label = `${String.fromCharCode(65 + column)}${row + 1}`;
    return `<rect x="${x}" y="${y}" width="62" height="54" rx="7" fill="${fill}" stroke="#262927" stroke-width="2"/><text x="${x + 31}" y="${y + 34}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="${active || persisted ? "#fff" : "#505552"}">${label}</text>`;
  }).join("");
  const status = index < 0 ? "GET READY" : index < 40 ? `FLASH ${index + 1} OF 40` : "SEQUENCE COMPLETE";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="650"><rect width="100%" height="100%" fill="#efebe1"/><text x="360" y="40" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700">COUNT DIFFERENT CELLS ONLY IN ${candidate.parameters.targetGate}</text><text x="360" y="72" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Repeats count once · ignore ${otherGate(candidate.parameters.targetGate)}</text><text x="360" y="116" text-anchor="middle" font-family="Arial" font-size="21" font-weight="700">${status}</text><rect x="124" y="142" width="472" height="434" rx="25" fill="#fffef9" stroke="${gateColors[currentGate]}" stroke-width="12"/><rect x="274" y="151" width="172" height="34" rx="17" fill="${gateColors[currentGate]}"/><text x="360" y="175" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#fff">${currentGate}</text>${cells}${control ? `<rect x="208" y="589" width="304" height="48" rx="12" fill="#202322"/><text x="360" y="621" text-anchor="middle" font-family="Arial" font-size="21" font-weight="700" fill="#fff">TARGET SET SIZE: ${targetSet.size}</text>` : ""}</svg>`;
}
