import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const gatedGridFrequencyVersion = "gated-grid-exact-frequency-v1";
export const gatedGridFrequencyAnswers = ["3", "4", "5", "6"] as const;
const gateSchema = z.enum(["AMBER", "CYAN"]);
const eventSchema = z.object({ cell: z.number().int().min(0).max(35), gate: gateSchema });

export const gatedGridFrequencyCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-color-gated-exact-frequency-histogram"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("temporal-set-cardinality"),
  question: z.string(),
  answerOptions: z.array(z.enum(gatedGridFrequencyAnswers)).length(4),
  expectedAnswer: z.enum(gatedGridFrequencyAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    qualifyingCount: z.number().int().min(3).max(6),
    targetMultiplicity: z.literal(2),
    targetGate: gateSchema,
    events: z.array(eventSchema).length(40),
    targetGateEvents: z.literal(20),
    wrongGateEchoes: z.literal(8),
    videoDurationMs: z.literal(20_000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type GatedGridFrequencyCandidate = z.infer<typeof gatedGridFrequencyCandidateSchema>;

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

export function targetGateFrequencies(events: readonly { cell: number; gate: string }[], targetGate: string) {
  const counts = new Map<number, number>();
  for (const event of events)
    if (event.gate === targetGate) counts.set(event.cell, (counts.get(event.cell) ?? 0) + 1);
  return counts;
}

export function exactFrequencyCount(
  events: readonly { cell: number; gate: string }[],
  targetGate: string,
  multiplicity = 2,
) {
  return [...targetGateFrequencies(events, targetGate).values()].filter((count) => count === multiplicity)
    .length;
}

export function createGatedGridFrequencyCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  qualifyingCount: number;
  targetGate: "AMBER" | "CYAN";
  visualVariant: number;
}) {
  const random = rng(input.seed + 1_173);
  const cells = shuffled(
    Array.from({ length: 36 }, (_, index) => index),
    random,
  );
  const qualifying = cells.slice(0, input.qualifyingCount);
  const singletonCount = 20 - input.qualifyingCount * 2;
  const singletons = cells.slice(input.qualifyingCount, input.qualifyingCount + singletonCount);
  const targetEvents = shuffled([...qualifying, ...qualifying, ...singletons], random);
  const targetCellSet = new Set([...qualifying, ...singletons]);
  const untouched = cells.filter((cell) => !targetCellSet.has(cell));
  const wrongGateEvents = [
    ...shuffled([...targetCellSet], random).slice(0, 8),
    ...shuffled(untouched, random).slice(0, 12),
  ];
  const events = shuffled(
    [
      ...targetEvents.map((cell) => ({ cell, gate: input.targetGate })),
      ...wrongGateEvents.map((cell) => ({ cell, gate: otherGate(input.targetGate) })),
    ],
    random,
  );
  return gatedGridFrequencyCandidateSchema.parse({
    id: `ggf-${sha256(JSON.stringify({ ...input, events })).slice(0, 16)}`,
    cellId: "cell-color-gated-exact-frequency-histogram",
    split: input.split,
    seed: input.seed,
    failureModeId: "temporal-set-cardinality",
    question: `How many DIFFERENT grid cells flashed EXACTLY TWICE during ${input.targetGate} frames? Ignore every ${otherGate(input.targetGate)} frame.`,
    answerOptions: shuffled(gatedGridFrequencyAnswers, rng(input.seed + 79)),
    expectedAnswer: String(input.qualifyingCount),
    humanSolvability: "unverified",
    parameters: {
      qualifyingCount: input.qualifyingCount,
      targetMultiplicity: 2,
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

export function createGatedGridFrequencySet(split: "discovery" | "confirmatory") {
  const repeats = split === "discovery" ? 2 : 4;
  const seedBase = split === "discovery" ? 5_420_000 : 5_430_000;
  const candidates: GatedGridFrequencyCandidate[] = [];
  for (let repeat = 0; repeat < repeats; repeat += 1)
    for (let qualifyingCount = 3; qualifyingCount <= 6; qualifyingCount += 1) {
      const index = candidates.length;
      candidates.push(
        createGatedGridFrequencyCandidate({
          split,
          seed: seedBase + index,
          qualifyingCount,
          targetGate: (index + repeat) % 2 ? "CYAN" : "AMBER",
          visualVariant: (split === "discovery" ? 500 : 900) + index,
        }),
      );
    }
  return candidates;
}

const gateColors = { AMBER: "#e1a600", CYAN: "#18a4b7" } as const;

export function renderGatedGridFrequencySvg(
  candidate: GatedGridFrequencyCandidate,
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
  const counts = targetGateFrequencies(elapsed, candidate.parameters.targetGate);
  const currentGate = event?.gate ?? candidate.parameters.targetGate;
  const cells = Array.from({ length: 36 }, (_, cell) => {
    const row = Math.floor(cell / 6);
    const column = cell % 6;
    const x = 154 + column * 70;
    const y = 190 + row * 62;
    const active = event?.cell === cell;
    const count = counts.get(cell) ?? 0;
    const qualifying = control && count === 2;
    const fill = active ? gateColors[currentGate] : qualifying ? "#315d43" : "#fffdf7";
    const label = control && count ? String(count) : `${String.fromCharCode(65 + column)}${row + 1}`;
    return `<rect x="${x}" y="${y}" width="62" height="54" rx="7" fill="${fill}" stroke="#262927" stroke-width="2"/><text x="${x + 31}" y="${y + 34}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="${active || qualifying ? "#fff" : "#505552"}">${label}</text>`;
  }).join("");
  const status = index < 0 ? "GET READY" : index < 40 ? `FLASH ${index + 1} OF 40` : "SEQUENCE COMPLETE";
  const qualifyingSoFar = [...counts.values()].filter((count) => count === 2).length;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="650"><rect width="100%" height="100%" fill="#efebe1"/><text x="360" y="40" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">EXACTLY TWICE · ONLY IN ${candidate.parameters.targetGate}</text><text x="360" y="72" text-anchor="middle" font-family="Arial" font-size="17" fill="#59605d">Count cells, not flashes · ignore ${otherGate(candidate.parameters.targetGate)}</text><text x="360" y="116" text-anchor="middle" font-family="Arial" font-size="21" font-weight="700">${status}</text><rect x="124" y="142" width="472" height="434" rx="25" fill="#fffef9" stroke="${gateColors[currentGate]}" stroke-width="12"/><rect x="274" y="151" width="172" height="34" rx="17" fill="${gateColors[currentGate]}"/><text x="360" y="175" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#fff">${currentGate}</text>${cells}${control ? `<rect x="198" y="589" width="324" height="48" rx="12" fill="#202322"/><text x="360" y="621" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#fff">EXACTLY-TWICE CELLS: ${qualifyingSoFar}</text>` : ""}</svg>`;
}
