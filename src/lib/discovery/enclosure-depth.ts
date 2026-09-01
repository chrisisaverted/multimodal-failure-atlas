import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const enclosureDepthVersion = "enclosure-depth-v1";
export const enclosureAnswerSets = [
  ["9", "10", "11", "12"],
  ["13", "14", "15", "16"],
] as const;

export const enclosureDepthCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("topological-enclosure-depth"),
  question: z.string(),
  answerOptions: z.array(z.string()).length(4),
  expectedAnswer: z.string(),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    enclosingLoops: z.number().int().min(4).max(20),
    openDecoys: z.number().int().min(0).max(32),
    irregularity: z.number().min(0).max(1),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type EnclosureDepthCandidate = z.infer<typeof enclosureDepthCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function shuffled<T>(values: readonly T[], random: () => number) {
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

export function createEnclosureDepthCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  enclosingLoops: number;
  answerSet: readonly string[];
  openDecoys: number;
  irregularity?: number;
  visualVariant?: number;
}) {
  const random = rng(input.seed);
  const visualVariant = input.visualVariant ?? input.seed % 97;
  if (input.answerSet.length !== 4 || !input.answerSet.includes(String(input.enclosingLoops))) {
    throw new Error("A balanced four-value answer set must contain the enclosure depth.");
  }
  return enclosureDepthCandidateSchema.parse({
    id: stableId("ed", { ...input, visualVariant }),
    cellId: stableId("cell", {
      answerSet: input.answerSet,
      openDecoys: input.openDecoys,
      irregularity: input.irregularity ?? 0.55,
    }),
    split: input.split,
    seed: input.seed,
    failureModeId: "topological-enclosure-depth",
    question: "How many CLOSED boundaries must a path from the red dot cross to reach the outer margin?",
    answerOptions: shuffled(input.answerSet, random),
    expectedAnswer: String(input.enclosingLoops),
    humanSolvability: "unverified",
    parameters: {
      enclosingLoops: input.enclosingLoops,
      openDecoys: input.openDecoys,
      irregularity: input.irregularity ?? 0.55,
      visualVariant,
    },
  });
}

export function createEnclosureDepthDiscoveryGrid() {
  const candidates: EnclosureDepthCandidate[] = [];
  let seed = 1_100_000;
  enclosureAnswerSets.forEach((answerSet, cell) => {
    for (let replicate = 0; replicate < 2; replicate += 1) {
      answerSet.forEach((answer) => {
        candidates.push(
          createEnclosureDepthCandidate({
            split: "discovery",
            seed,
            enclosingLoops: Number(answer),
            answerSet,
            openDecoys: cell === 0 ? 12 : 20,
            irregularity: cell === 0 ? 0.45 : 0.65,
          }),
        );
        seed += 1;
      });
    }
  });
  return candidates;
}

export function createEnclosureDepthHoldout(representative: EnclosureDepthCandidate) {
  const answerSet = enclosureAnswerSets.find((set) =>
    (set as readonly string[]).includes(representative.expectedAnswer),
  );
  if (!answerSet) throw new Error("Representative does not belong to a declared answer set.");
  const candidates: EnclosureDepthCandidate[] = [];
  let seed = 1_200_000;
  for (let replicate = 0; replicate < 4; replicate += 1) {
    for (const answer of answerSet) {
      candidates.push(
        createEnclosureDepthCandidate({
          split: "confirmatory",
          seed,
          enclosingLoops: Number(answer),
          answerSet,
          openDecoys: representative.parameters.openDecoys,
          irregularity: representative.parameters.irregularity,
          visualVariant: 100 + replicate * 4 + Number(answer),
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

function loopPath(radius: number, profile: number[]) {
  const coords = profile.map((factor, index) => {
    const angle = (index / profile.length) * Math.PI * 2;
    const r = radius * factor;
    return [900 + Math.cos(angle) * r * 1.32, 530 + Math.sin(angle) * r] as const;
  });
  return `${coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")} Z`;
}

function openDecoyPath(index: number, total: number, random: () => number) {
  const radius = 62 + (index / Math.max(1, total - 1)) * 395;
  const start = random() * Math.PI * 2;
  const span = Math.PI * (0.22 + random() * 0.34);
  return Array.from({ length: 12 }, (_, point) => {
    const angle = start + (point / 11) * span;
    const r = radius + Math.sin(point * 1.7 + index) * 5;
    const x = 900 + Math.cos(angle) * r * 1.32;
    const y = 530 + Math.sin(angle) * r;
    return `${point ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export function renderEnclosureDepthSvg(candidate: EnclosureDepthCandidate, oracle = false) {
  const { enclosingLoops, openDecoys, irregularity, visualVariant } = candidate.parameters;
  const random = rng(candidate.seed + visualVariant * 7919);
  const phaseA = random() * Math.PI * 2;
  const phaseB = random() * Math.PI * 2;
  const profile = Array.from({ length: 48 }, (_, index) => {
    const angle = (index / 48) * Math.PI * 2;
    return (
      1 +
      irregularity * 0.055 * Math.sin(angle * 3 + phaseA) +
      irregularity * 0.03 * Math.sin(angle * 7 + phaseB)
    );
  });
  const loops = Array.from({ length: enclosingLoops }, (_, index) => {
    const radius = 52 + index * (395 / Math.max(1, enclosingLoops - 1));
    const path = loopPath(radius, profile);
    const marker = oracle
      ? `<circle cx="${(900 + radius * 1.32).toFixed(1)}" cy="530" r="17" fill="#ffe13b" stroke="#202322" stroke-width="2"/><text x="${(900 + radius * 1.32).toFixed(1)}" y="536" text-anchor="middle" font-family="Arial" font-size="16" font-weight="700">${index + 1}</text>`
      : "";
    return `<path d="${path}" fill="none" stroke="${oracle ? "#2466cc" : "#252928"}" stroke-width="5"/>${marker}`;
  }).join("");
  const decoys = Array.from(
    { length: openDecoys },
    (_, index) =>
      `<path d="${openDecoyPath(index, openDecoys, random)}" fill="none" stroke="#252928" stroke-width="5" stroke-linecap="round"/>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000"><rect width="100%" height="100%" fill="#faf9f4"/><text x="70" y="65" font-family="Arial" font-size="32" font-weight="700">COUNT ONLY CLOSED ENCLOSING BOUNDARIES</text><text x="70" y="104" font-family="Arial" font-size="21" fill="#59605d">Open contour fragments do not separate the dot from the outside.</text>${decoys}${loops}<circle cx="900" cy="530" r="20" fill="#e23e31" stroke="#fff" stroke-width="5"/><text x="900" y="538" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="#fff">S</text></svg>`;
}
