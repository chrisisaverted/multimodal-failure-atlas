import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const rotationCorrespondenceVersion = "rotation-correspondence-v1";
export const correspondenceAnswers = ["A", "B", "C", "D"] as const;

export const rotationCorrespondenceCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("rotation-invariant-visual-correspondence"),
  question: z.string(),
  answerOptions: z.array(z.enum(correspondenceAnswers)).length(4),
  expectedAnswer: z.enum(correspondenceAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    vertices: z.number().int().min(6).max(18),
    perturbation: z.number().min(0.02).max(0.3),
    correctSlot: z.number().int().min(0).max(3),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type RotationCorrespondenceCandidate = z.infer<typeof rotationCorrespondenceCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function shuffle<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

export function createRotationCorrespondenceCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  vertices: number;
  perturbation: number;
  correctSlot: number;
  visualVariant?: number;
}) {
  const visualVariant = input.visualVariant ?? input.seed % 101;
  return rotationCorrespondenceCandidateSchema.parse({
    id: stableId("rc", { ...input, visualVariant }),
    cellId: stableId("cell", {
      vertices: input.vertices,
      perturbation: input.perturbation,
    }),
    split: input.split,
    seed: input.seed,
    failureModeId: "rotation-invariant-visual-correspondence",
    question:
      "Which candidate is EXACTLY the same connected shape as the reference after rotation only (no reflection)?",
    answerOptions: shuffle(correspondenceAnswers, rng(input.seed + 17)),
    expectedAnswer: correspondenceAnswers[input.correctSlot],
    humanSolvability: "unverified",
    parameters: {
      vertices: input.vertices,
      perturbation: input.perturbation,
      correctSlot: input.correctSlot,
      visualVariant,
    },
  });
}

export function createRotationCorrespondenceDiscoveryGrid() {
  const candidates: RotationCorrespondenceCandidate[] = [];
  let seed = 1_300_000;
  const cells = [
    { vertices: 9, perturbation: 0.15 },
    { vertices: 13, perturbation: 0.07 },
  ];
  for (const cell of cells) {
    for (let replicate = 0; replicate < 2; replicate += 1) {
      for (let correctSlot = 0; correctSlot < 4; correctSlot += 1) {
        candidates.push(
          createRotationCorrespondenceCandidate({
            split: "discovery",
            seed,
            ...cell,
            correctSlot,
          }),
        );
        seed += 1;
      }
    }
  }
  return candidates;
}

type Point = { x: number; y: number };

function referencePoints(candidate: RotationCorrespondenceCandidate) {
  const random = rng(candidate.seed + candidate.parameters.visualVariant * 3571);
  return Array.from({ length: candidate.parameters.vertices }, (_, index) => {
    const angle = (index / candidate.parameters.vertices) * Math.PI * 2;
    const radius = 0.58 + random() * 0.38;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

function transform(points: Point[], angle: number, reflect = false) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return points.map((point) => {
    const x = reflect ? -point.x : point.x;
    return { x: x * cosine - point.y * sine, y: x * sine + point.y * cosine };
  });
}

function candidatePoints(candidate: RotationCorrespondenceCandidate, slot: number) {
  const base = referencePoints(candidate);
  const random = rng(candidate.seed + slot * 65537 + 991);
  const rotated = transform(
    base,
    random() * Math.PI * 2,
    slot === (candidate.parameters.correctSlot + 2) % 4,
  );
  if (slot === candidate.parameters.correctSlot) return rotated;
  const changed = rotated.map((point) => ({ ...point }));
  const vertex = (slot * 3 + candidate.seed) % changed.length;
  const neighbour = changed[(vertex + 1) % changed.length]!;
  changed[vertex] = {
    x: changed[vertex]!.x + (neighbour.x - changed[vertex]!.x) * candidate.parameters.perturbation,
    y: changed[vertex]!.y + (neighbour.y - changed[vertex]!.y) * candidate.parameters.perturbation,
  };
  return changed;
}

function shape(points: Point[], cx: number, cy: number, scale: number, color: string, width: number) {
  const d = `${points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${(cx + point.x * scale).toFixed(1)} ${(cy + point.y * scale).toFixed(1)}`,
    )
    .join(" ")} Z`;
  const nodes = points
    .map(
      (point, index) =>
        `<circle cx="${(cx + point.x * scale).toFixed(1)}" cy="${(cy + point.y * scale).toFixed(1)}" r="${index === 0 ? 9 : 6}" fill="${index === 0 ? "#e23e31" : color}"/>`,
    )
    .join("");
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>${nodes}`;
}

export function renderRotationCorrespondenceSvg(candidate: RotationCorrespondenceCandidate, oracle = false) {
  const reference = referencePoints(candidate);
  const slots = [
    { x: 1080, y: 305 },
    { x: 1490, y: 305 },
    { x: 1080, y: 720 },
    { x: 1490, y: 720 },
  ];
  const candidates = slots
    .map((slot, index) => {
      const correct = index === candidate.parameters.correctSlot;
      const border = oracle && correct ? "#2466cc" : "#c7cbc7";
      return `<rect x="${slot.x - 175}" y="${slot.y - 175}" width="350" height="350" rx="18" fill="#fff" stroke="${border}" stroke-width="${oracle && correct ? 9 : 3}"/>${shape(candidatePoints(candidate, index), slot.x, slot.y, 135, oracle && correct ? "#2466cc" : "#252928", 6)}<circle cx="${slot.x - 145}" cy="${slot.y - 145}" r="22" fill="#eceee9"/><text x="${slot.x - 145}" y="${slot.y - 137}" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">${correspondenceAnswers[index]}</text>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000"><rect width="100%" height="100%" fill="#faf9f4"/><text x="65" y="64" font-family="Arial" font-size="32" font-weight="700">MATCH UNDER ROTATION — NOT REFLECTION</text><text x="65" y="104" font-family="Arial" font-size="21" fill="#59605d">The red node marks the same vertex in every shape.</text><rect x="80" y="180" width="650" height="650" rx="24" fill="#fff" stroke="#252928" stroke-width="4"/><text x="405" y="875" text-anchor="middle" font-family="Arial" font-size="24" font-weight="700">REFERENCE</text>${shape(reference, 405, 505, 245, "#252928", 8)}${candidates}</svg>`;
}
