import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const mazeReachabilityVersion = "maze-reachability-v1";
export const mazeAnswers = ["A", "B", "C", "D"] as const;

export const mazeReachabilityCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("visual-maze-reachability"),
  question: z.string(),
  answerOptions: z.array(z.enum(mazeAnswers)).length(4),
  expectedAnswer: z.enum(mazeAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    mazeSize: z.number().int().min(7).max(19),
    correctPanel: z.number().int().min(0).max(3),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type MazeReachabilityCandidate = z.infer<typeof mazeReachabilityCandidateSchema>;
type Edge = readonly [number, number];

function rng(seed: number) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000);
}

function shuffled<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function edgeKey(a: number, b: number) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function neighbors(node: number, size: number) {
  const x = node % size;
  const y = Math.floor(node / size);
  const result: number[] = [];
  if (x > 0) result.push(node - 1);
  if (x < size - 1) result.push(node + 1);
  if (y > 0) result.push(node - size);
  if (y < size - 1) result.push(node + size);
  return result;
}

function tree(seed: number, size: number) {
  const random = rng(seed);
  const visited = new Set([0]);
  const stack = [0];
  const edges = new Set<string>();
  while (stack.length) {
    const current = stack[stack.length - 1]!;
    const unvisited = shuffled(neighbors(current, size), random).filter((node) => !visited.has(node));
    if (!unvisited.length) {
      stack.pop();
      continue;
    }
    const next = unvisited[0]!;
    edges.add(edgeKey(current, next));
    visited.add(next);
    stack.push(next);
  }
  return edges;
}

function pathBetween(edges: Set<string>, size: number, start = 0, goal = size * size - 1) {
  const queue = [start];
  const parent = new Map<number, number>();
  const seen = new Set([start]);
  while (queue.length) {
    const node = queue.shift()!;
    if (node === goal) break;
    for (const next of neighbors(node, size)) {
      if (!seen.has(next) && edges.has(edgeKey(node, next))) {
        seen.add(next);
        parent.set(next, node);
        queue.push(next);
      }
    }
  }
  if (!seen.has(goal)) return [];
  const result: Edge[] = [];
  let node = goal;
  while (node !== start) {
    const previous = parent.get(node)!;
    result.push([previous, node]);
    node = previous;
  }
  return result.reverse();
}

function allGridEdges(size: number) {
  const result: Edge[] = [];
  for (let node = 0; node < size * size; node += 1)
    for (const next of neighbors(node, size)) if (node < next) result.push([node, next]);
  return result;
}

export function mazePanelEdges(candidate: MazeReachabilityCandidate, panel: number) {
  const size = candidate.parameters.mazeSize;
  const random = rng(candidate.seed + panel * 104729 + candidate.parameters.visualVariant * 31);
  const base = tree(candidate.seed + panel * 104729, size);
  const solution = pathBetween(base, size);
  const solutionKeys = new Set(solution.map(([a, b]) => edgeKey(a, b)));
  const removable = [...base].filter((key) =>
    panel === candidate.parameters.correctPanel ? !solutionKeys.has(key) : solutionKeys.has(key),
  );
  const removal = removable[Math.floor(random() * removable.length)]!;
  const modified = new Set(base);
  modified.delete(removal);
  const additions = shuffled(
    allGridEdges(size).filter(([a, b]) => !base.has(edgeKey(a, b))),
    random,
  );
  for (const [a, b] of additions) {
    const test = new Set(modified);
    test.add(edgeKey(a, b));
    const reachable = pathBetween(test, size).length > 0;
    if (reachable === (panel === candidate.parameters.correctPanel)) return test;
  }
  throw new Error("Could not construct a matched maze panel.");
}

export function createMazeReachabilityCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  mazeSize: number;
  correctPanel: number;
  visualVariant?: number;
}) {
  const visualVariant = input.visualVariant ?? input.seed % 113;
  return mazeReachabilityCandidateSchema.parse({
    id: `mr-${sha256(JSON.stringify({ ...input, visualVariant })).slice(0, 16)}`,
    cellId: `cell-${sha256(JSON.stringify({ mazeSize: input.mazeSize })).slice(0, 16)}`,
    split: input.split,
    seed: input.seed,
    failureModeId: "visual-maze-reachability",
    question: "In which panel is there an open route through the maze from S to G?",
    answerOptions: shuffled(mazeAnswers, rng(input.seed + 19)),
    expectedAnswer: mazeAnswers[input.correctPanel],
    humanSolvability: "unverified",
    parameters: { mazeSize: input.mazeSize, correctPanel: input.correctPanel, visualVariant },
  });
}

export function createMazeReachabilityDiscoveryGrid() {
  const result: MazeReachabilityCandidate[] = [];
  let seed = 1_700_000;
  for (const size of [11, 15])
    for (let replicate = 0; replicate < 2; replicate += 1)
      for (let panel = 0; panel < 4; panel += 1)
        result.push(createMazeReachabilityCandidate({ split: "discovery", seed: seed++, mazeSize: size, correctPanel: panel, visualVariant: replicate * 4 + panel }));
  return result;
}

function renderPanel(candidate: MazeReachabilityCandidate, panel: number, oracle: boolean) {
  const size = candidate.parameters.mazeSize;
  const edges = mazePanelEdges(candidate, panel);
  const x0 = 55 + panel * 435;
  const y0 = 180;
  const extent = 385;
  const cell = extent / size;
  const walls: string[] = [`<rect x="${x0}" y="${y0}" width="${extent}" height="${extent}" fill="#fffef9" stroke="#202322" stroke-width="5"/>`];
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const node = y * size + x;
    if (x < size - 1 && !edges.has(edgeKey(node, node + 1))) {
      const wx = x0 + (x + 1) * cell;
      walls.push(`<path d="M${wx} ${y0 + y * cell}V${y0 + (y + 1) * cell}"/>`);
    }
    if (y < size - 1 && !edges.has(edgeKey(node, node + size))) {
      const wy = y0 + (y + 1) * cell;
      walls.push(`<path d="M${x0 + x * cell} ${wy}H${x0 + (x + 1) * cell}"/>`);
    }
  }
  const solution = oracle && panel === candidate.parameters.correctPanel ? pathBetween(edges, size) : [];
  const route = solution.length ? `<polyline points="${[0, ...solution.map(([, b]) => b)].map((node) => `${x0 + (node % size + .5) * cell},${y0 + (Math.floor(node / size) + .5) * cell}`).join(" ")}" fill="none" stroke="#2466cc" stroke-width="${Math.max(3, cell * .24)}" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>` : "";
  return `<g stroke="#202322" stroke-width="3" fill="none">${walls.join("")}</g>${route}<text x="${x0 + extent / 2}" y="${y0 - 30}" text-anchor="middle" font-family="Arial" font-size="30" font-weight="700">${mazeAnswers[panel]}</text><circle cx="${x0 + cell / 2}" cy="${y0 + cell / 2}" r="${cell * .34}" fill="#e23e31"/><text x="${x0 + cell / 2}" y="${y0 + cell * .68}" text-anchor="middle" font-family="Arial" font-size="${cell * .48}" font-weight="700" fill="#fff">S</text><circle cx="${x0 + extent - cell / 2}" cy="${y0 + extent - cell / 2}" r="${cell * .34}" fill="#f4d934"/><text x="${x0 + extent - cell / 2}" y="${y0 + extent - cell * .32}" text-anchor="middle" font-family="Arial" font-size="${cell * .48}" font-weight="700">G</text>`;
}

export function renderMazeReachabilitySvg(candidate: MazeReachabilityCandidate, oracle = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="700"><rect width="100%" height="100%" fill="#f4f1e8"/><text x="55" y="62" font-family="Arial" font-size="34" font-weight="700">WHICH MAZE HAS AN OPEN ROUTE FROM S TO G?</text><text x="55" y="105" font-family="Arial" font-size="22" fill="#59605d">Walls are dark lines. Exactly one panel remains connected.</text>${Array.from({ length: 4 }, (_, panel) => renderPanel(candidate, panel, oracle)).join("")}</svg>`;
}
