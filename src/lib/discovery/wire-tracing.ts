import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const wireTracingGeneratorVersion = "wire-tracing-v1";
export const wireAnswers = ["circle", "triangle", "square", "star"] as const;

export const wireTracingCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int(),
  failureModeId: z.literal("identity-through-occlusion"),
  question: z.string(),
  answerOptions: z.array(z.enum(wireAnswers)).length(4),
  expectedAnswer: z.enum(wireAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    crossings: z.number().int().min(4).max(64),
    sourceWire: z.number().int().min(0).max(3),
    targetEndpoint: z.number().int().min(0).max(3),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type WireTracingCandidate = z.infer<typeof wireTracingCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

function rotate<T>(values: readonly T[], amount: number) {
  return values.map((_, index) => values[(index + amount) % values.length]!);
}

export function createWireTracingCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  crossings: number;
  sourceWire: number;
  targetEndpoint: number;
  visualVariant?: number;
}) {
  const visualVariant = input.visualVariant ?? input.seed % 13;
  return wireTracingCandidateSchema.parse({
    id: stableId("wt", { ...input, visualVariant }),
    cellId: stableId("cell", { crossings: input.crossings }),
    split: input.split,
    seed: input.seed,
    failureModeId: "identity-through-occlusion",
    question: `Starting at wire ${String.fromCharCode(65 + input.sourceWire)}, which symbol does that same wire reach?`,
    answerOptions: rotate(wireAnswers, input.seed % 4),
    expectedAnswer: wireAnswers[input.targetEndpoint],
    humanSolvability: "unverified",
    parameters: { ...input, visualVariant },
  });
}

function findSwapSequence(candidate: WireTracingCandidate) {
  const { crossings, sourceWire, targetEndpoint } = candidate.parameters;
  for (let attempt = 0; attempt < 100_000; attempt += 1) {
    const random = rng(candidate.seed + attempt * 104729);
    const sequence = Array.from({ length: crossings }, () => Math.floor(random() * 3));
    const positions = [0, 1, 2, 3];
    for (const row of sequence) [positions[row], positions[row + 1]] = [positions[row + 1]!, positions[row]!];
    if (positions[targetEndpoint] === sourceWire) return sequence;
  }
  throw new Error("Could not realize balanced wire endpoint.");
}

export function traceWireEndpoints(candidate: WireTracingCandidate) {
  const positions = [0, 1, 2, 3];
  for (const row of findSwapSequence(candidate))
    [positions[row], positions[row + 1]] = [positions[row + 1]!, positions[row]!];
  const endpoints = Array(4).fill(-1) as number[];
  positions.forEach((wire, endpoint) => (endpoints[wire] = endpoint));
  return endpoints;
}

export function createWireTracingDiscoveryGrid() {
  const candidates: WireTracingCandidate[] = [];
  let seed = 710_000;
  for (const crossings of [8, 16, 28, 40]) {
    for (let endpoint = 0; endpoint < 4; endpoint += 1) {
      candidates.push(
        createWireTracingCandidate({
          split: "discovery",
          seed,
          crossings,
          sourceWire: (seed + crossings) % 4,
          targetEndpoint: endpoint,
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

export function createWireTracingHoldout(representative: WireTracingCandidate) {
  const candidates: WireTracingCandidate[] = [];
  let seed = 930_000;
  for (let replicate = 0; replicate < 4; replicate += 1) {
    for (let endpoint = 0; endpoint < 4; endpoint += 1) {
      candidates.push(
        createWireTracingCandidate({
          split: "confirmatory",
          seed,
          crossings: representative.parameters.crossings,
          sourceWire: (replicate + endpoint) % 4,
          targetEndpoint: endpoint,
          visualVariant: 30 + replicate * 4 + endpoint,
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

function symbolMarkup(symbol: (typeof wireAnswers)[number], x: number, y: number) {
  if (symbol === "circle") return `<circle cx="${x}" cy="${y}" r="23" fill="#f4ce35" stroke="#151817" stroke-width="4"/>`;
  if (symbol === "triangle") return `<path d="M${x} ${y - 27}L${x + 27} ${y + 23}H${x - 27}Z" fill="#f4ce35" stroke="#151817" stroke-width="4"/>`;
  if (symbol === "square") return `<rect x="${x - 23}" y="${y - 23}" width="46" height="46" rx="3" fill="#f4ce35" stroke="#151817" stroke-width="4"/>`;
  return `<path d="m${x} ${y - 29} 8 19 21 2-16 13 5 21-18-11-18 11 5-21-16-13 21-2Z" fill="#f4ce35" stroke="#151817" stroke-width="4"/>`;
}

export function renderWireTracingSvg(candidate: WireTracingCandidate, oracle = false) {
  const sequence = findSwapSequence(candidate);
  const width = 1800;
  const height = 900;
  const left = 150;
  const right = 1650;
  const ys = [190, 360, 530, 700];
  const positions = [0, 1, 2, 3];
  const segments: Array<{ wire: number; d: string; crossing: boolean }> = [];
  for (let step = 0; step < sequence.length; step += 1) {
    const x0 = left + (step * (right - left)) / sequence.length;
    const x1 = left + ((step + 1) * (right - left)) / sequence.length;
    const swapRow = sequence[step]!;
    const next = [...positions];
    [next[swapRow], next[swapRow + 1]] = [next[swapRow + 1]!, next[swapRow]!];
    for (let row = 0; row < 4; row += 1) {
      const wire = positions[row]!;
      const nextRow = next.indexOf(wire);
      const d = `M${x0.toFixed(2)} ${ys[row]} C${(x0 + (x1 - x0) * 0.42).toFixed(2)} ${ys[row]}, ${(x0 + (x1 - x0) * 0.58).toFixed(2)} ${ys[nextRow]}, ${x1.toFixed(2)} ${ys[nextRow]}`;
      segments.push({ wire, d, crossing: row === swapRow });
    }
    positions.splice(0, 4, ...next);
  }
  const base = segments.map((segment) => `<path d="${segment.d}" fill="none" stroke="#242827" stroke-width="9" stroke-linecap="round"/>`).join("");
  const bridges = segments.filter((segment) => segment.crossing).map((segment) => `<path d="${segment.d}" fill="none" stroke="#faf9f4" stroke-width="21"/><path d="${segment.d}" fill="none" stroke="#242827" stroke-width="9" stroke-linecap="round"/>`).join("");
  const targetWire = candidate.parameters.sourceWire;
  const oraclePath = oracle ? segments.filter((segment) => segment.wire === targetWire).map((segment) => `<path d="${segment.d}" fill="none" stroke="#e43d30" stroke-width="7" stroke-linecap="round"/>`).join("") : "";
  const labels = ys.map((y, row) => `<circle cx="92" cy="${y}" r="33" fill="${row === targetWire ? "#e43d30" : "#e6e8e2"}"/><text x="92" y="${y + 13}" text-anchor="middle" font-family="Arial" font-size="38" font-weight="700" fill="${row === targetWire ? "#fff" : "#202322"}">${String.fromCharCode(65 + row)}</text>${symbolMarkup(wireAnswers[row]!, 1720, y)}`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#faf9f4"/><text x="70" y="73" font-family="Arial" font-size="34" font-weight="700" fill="#202322">TRACE WIRE ${String.fromCharCode(65 + targetWire)} TO ITS END SYMBOL</text><text x="70" y="115" font-family="Arial" font-size="22" fill="#59605d">At crossings, wires pass over or under; they never join. Follow the continuous wire.</text>${base}${bridges}${oraclePath}${labels}</svg>`;
}
