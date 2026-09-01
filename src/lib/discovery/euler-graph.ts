import { z } from "zod";
import { sha256 } from "../evaluation/hash";
export const eulerGraphVersion = "dense-euler-graph-v1";
export const eulerAnswers = ["A", "B", "C", "D"] as const;
const edgeSchema = z.tuple([z.number().int().min(0).max(9), z.number().int().min(0).max(9)]);
export const eulerCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("visual-graph-degree-topology"),
  question: z.string(),
  answerOptions: z.array(z.enum(eulerAnswers)).length(4),
  expectedAnswer: z.enum(eulerAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    correctPanel: z.number().int().min(0).max(3),
    panels: z.array(z.array(edgeSchema)).length(4),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type EulerCandidate = z.infer<typeof eulerCandidateSchema>;
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
function key(a: number, b: number) {
  return a < b ? `${a},${b}` : `${b},${a}`;
}
function evenGraph(seed: number) {
  const random = rng(seed),
    edges = new Map<string, [number, number]>();
  const add = (a: number, b: number) => edges.set(key(a, b), [Math.min(a, b), Math.max(a, b)]);
  for (let i = 0; i < 10; i++) add(i, (i + 1) % 10);
  for (let cycle = 0; cycle < 2; cycle++) {
    let vertices: number[] = [];
    for (let attempt = 0; attempt < 10000; attempt++) {
      const proposal = shuffled(
        Array.from({ length: 10 }, (_, i) => i),
        random,
      );
      if (proposal.every((value, i) => !edges.has(key(value, proposal[(i + 1) % proposal.length]!)))) {
        vertices = proposal;
        break;
      }
    }
    if (!vertices.length) throw new Error("Could not construct edge-disjoint cycle");
    for (let i = 0; i < vertices.length; i++) add(vertices[i]!, vertices[(i + 1) % vertices.length]!);
  }
  return [...edges.values()];
}
export function graphDegrees(edges: readonly (readonly [number, number])[]) {
  const degrees = Array(10).fill(0) as number[];
  for (const [a, b] of edges) {
    degrees[a]++;
    degrees[b]++;
  }
  return degrees;
}
function panelGraph(seed: number, correct: boolean) {
  let edges = evenGraph(seed);
  if (correct) return edges;
  const existing = new Set(edges.map(([a, b]) => key(a, b)));
  outer: for (let a = 0; a < 10; a++)
    for (let b = a + 1; b < 10; b++)
      if (!existing.has(key(a, b))) {
        edges = [...edges, [a, b]];
        break outer;
      }
  return edges;
}
export function createEulerCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  correctPanel: number;
  visualVariant?: number;
}) {
  const panels = Array.from({ length: 4 }, (_, panel) =>
      panelGraph(input.seed * 7 + panel * 991, panel === input.correctPanel),
    ),
    visualVariant = input.visualVariant ?? input.seed % 223;
  return eulerCandidateSchema.parse({
    id: `eg-${sha256(JSON.stringify({ ...input, panels, visualVariant })).slice(0, 16)}`,
    cellId: "cell-four-ten-node-euler-graphs",
    split: input.split,
    seed: input.seed,
    failureModeId: "visual-graph-degree-topology",
    question:
      "Which graph has an Eulerian CIRCUIT: one closed route that uses every edge exactly once? Line crossings without a dot are not vertices.",
    answerOptions: shuffled(eulerAnswers, rng(input.seed + 29)),
    expectedAnswer: eulerAnswers[input.correctPanel],
    humanSolvability: "unverified",
    parameters: { correctPanel: input.correctPanel, panels, visualVariant },
  });
}
export function createEulerGrid() {
  const out: EulerCandidate[] = [];
  let seed = 3_500_000;
  for (let rep = 0; rep < 2; rep++)
    for (let correctPanel = 0; correctPanel < 4; correctPanel++)
      out.push(
        createEulerCandidate({
          split: "discovery",
          seed: seed++,
          correctPanel,
          visualVariant: rep * 4 + correctPanel,
        }),
      );
  return out;
}
export function createEulerHoldout() {
  const out: EulerCandidate[] = [];
  let seed = 3_510_000;
  for (let rep = 0; rep < 4; rep++)
    for (let correctPanel = 0; correctPanel < 4; correctPanel++)
      out.push(
        createEulerCandidate({
          split: "confirmatory",
          seed: seed++,
          correctPanel,
          visualVariant: 100 + rep * 4 + correctPanel,
        }),
      );
  return out;
}
function panelSvg(
  edges: readonly (readonly [number, number])[],
  ox: number,
  oy: number,
  label: string,
  oracle: boolean,
) {
  const points = Array.from({ length: 10 }, (_, i) => {
      const angle = -Math.PI / 2 + (i * Math.PI * 2) / 10,
        radius = i % 2 ? 118 : 145;
      return [ox + Math.cos(angle) * radius, oy + Math.sin(angle) * radius] as const;
    }),
    lines = edges
      .map(
        ([a, b]) =>
          `<line x1="${points[a]![0]}" y1="${points[a]![1]}" x2="${points[b]![0]}" y2="${points[b]![1]}" stroke="#59605d" stroke-width="4"/>`,
      )
      .join(""),
    nodes = points
      .map(
        ([x, y], i) =>
          `<circle cx="${x}" cy="${y}" r="15" fill="#fffef9" stroke="#202322" stroke-width="5"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700">${i + 1}</text>`,
      )
      .join("");
  return `${oracle ? `<circle cx="${ox}" cy="${oy}" r="174" fill="none" stroke="#1d9b5f" stroke-width="8"/>` : ""}<text x="${ox - 174}" y="${oy - 150}" font-family="Arial" font-size="32" font-weight="700">${label}</text>${lines}${nodes}`;
}
export function renderEulerSvg(candidate: EulerCandidate, oracle = false) {
  const positions = [
      [230, 285],
      [680, 285],
      [230, 660],
      [680, 660],
    ] as const,
    panels = candidate.parameters.panels
      .map((edges, i) =>
        panelSvg(
          edges,
          positions[i]![0],
          positions[i]![1],
          eulerAnswers[i]!,
          oracle && i === candidate.parameters.correctPanel,
        ),
      )
      .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="910" height="860"><rect width="100%" height="100%" fill="#eeeae0"/><text x="455" y="48" text-anchor="middle" font-family="Arial" font-size="29" font-weight="700">WHICH GRAPH HAS AN EULERIAN CIRCUIT?</text><text x="455" y="82" text-anchor="middle" font-family="Arial" font-size="18" fill="#59605d">Use every edge once · return to the start · crossings without dots do not connect</text>${panels}</svg>`;
}
