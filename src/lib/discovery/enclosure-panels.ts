import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const enclosurePanelsVersion = "enclosure-panels-v1";
export const enclosurePanelTargets = [11, 12] as const;

export const enclosurePanelsCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("topological-enclosure-depth"),
  question: z.string(),
  answerOptions: z.tuple([z.literal("A"), z.literal("B"), z.literal("C"), z.literal("D")]),
  expectedAnswer: z.enum(["A", "B", "C", "D"]),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetDepth: z.number().int().min(11).max(12),
    panelDepths: z.array(z.number().int().min(8).max(16)).length(4),
    targetSlot: z.number().int().min(0).max(3),
    templateVariant: z.number().int().min(0).max(1),
    openDecoysPerPanel: z.number().int().min(0).max(16),
    irregularity: z.number().min(0).max(1),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type EnclosurePanelsCandidate = z.infer<typeof enclosurePanelsCandidateSchema>;

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

export function createEnclosurePanelsCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetDepth: number;
  targetSlot: number;
  templateVariant: number;
  openDecoysPerPanel: number;
  irregularity: number;
  visualVariant: number;
}) {
  const random = rng(input.seed + input.visualVariant * 7919);
  const templates =
    input.targetDepth === 11
      ? [
          [8, 13, 14],
          [9, 10, 16],
        ]
      : [
          [9, 13, 14],
          [10, 11, 15],
        ];
  const remaining = shuffled(templates[input.templateVariant]!, random);
  const panelDepths = Array.from({ length: 4 }, (_, slot) =>
    slot === input.targetSlot ? input.targetDepth : remaining.shift()!,
  );
  return enclosurePanelsCandidateSchema.parse({
    id: stableId("ep", input),
    cellId: stableId("cell", {
      targetDepths: enclosurePanelTargets,
      templateFamily: "rank-two-or-three-balanced",
      openDecoysPerPanel: input.openDecoysPerPanel,
      irregularity: input.irregularity,
    }),
    split: input.split,
    seed: input.seed,
    failureModeId: "topological-enclosure-depth",
    question: `Which panel contains exactly ${input.targetDepth} CLOSED boundaries around its red dot?`,
    answerOptions: ["A", "B", "C", "D"],
    expectedAnswer: ["A", "B", "C", "D"][input.targetSlot],
    humanSolvability: "unverified",
    parameters: {
      targetDepth: input.targetDepth,
      panelDepths,
      targetSlot: input.targetSlot,
      templateVariant: input.templateVariant,
      openDecoysPerPanel: input.openDecoysPerPanel,
      irregularity: input.irregularity,
      visualVariant: input.visualVariant,
    },
  });
}

export function createEnclosurePanelsSet(split: "discovery" | "confirmatory") {
  const replicates = split === "discovery" ? 4 : 8;
  const seedBase = split === "discovery" ? 2_900_000 : 2_910_000;
  const candidates: EnclosurePanelsCandidate[] = [];
  for (let replicate = 0; replicate < replicates; replicate += 1) {
    enclosurePanelTargets.forEach((targetDepth, targetIndex) => {
      candidates.push(
        createEnclosurePanelsCandidate({
          split,
          seed: seedBase + candidates.length,
          targetDepth,
          targetSlot: (replicate + targetIndex * 2) % 4,
          templateVariant: replicate % 2,
          openDecoysPerPanel: 9,
          irregularity: 0.48,
          visualVariant: (split === "discovery" ? 500 : 700) + candidates.length,
        }),
      );
    });
  }
  return candidates;
}

function closedLoopPath(cx: number, cy: number, radius: number, irregularity: number, phase: number) {
  const points = 36;
  return (
    Array.from({ length: points }, (_, index) => {
      const angle = (index / points) * Math.PI * 2;
      const wobble =
        1 +
        irregularity * 0.05 * Math.sin(angle * 3 + phase) +
        irregularity * 0.025 * Math.sin(angle * 7 - phase);
      const x = cx + Math.cos(angle) * radius * 1.08 * wobble;
      const y = cy + Math.sin(angle) * radius * wobble;
      return `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ") + " Z"
  );
}

function openArcPath(cx: number, cy: number, radius: number, start: number, span: number, phase: number) {
  return Array.from({ length: 11 }, (_, index) => {
    const angle = start + (index / 10) * span;
    const offset = Math.sin(index * 1.4 + phase) * 2.4;
    return `${index ? "L" : "M"}${(cx + Math.cos(angle) * (radius + offset) * 1.08).toFixed(1)} ${(cy + Math.sin(angle) * (radius + offset)).toFixed(1)}`;
  }).join(" ");
}

export function renderEnclosurePanelsSvg(candidate: EnclosurePanelsCandidate, oracle = false) {
  const { panelDepths, openDecoysPerPanel, irregularity, visualVariant } = candidate.parameters;
  const panelWidth = 405;
  const panelTop = 165;
  const panelHeight = 735;
  const gap = 20;
  const left = 60;
  const labels = ["A", "B", "C", "D"];
  const panels = panelDepths.map((depth, slot) => {
    const random = rng(candidate.seed + visualVariant * 101 + slot * 10007);
    const x0 = left + slot * (panelWidth + gap);
    const cx = x0 + panelWidth / 2;
    const cy = panelTop + panelHeight / 2 + 12;
    const maxRadius = 166;
    const loops = Array.from({ length: depth }, (_, index) => {
      const radius = 35 + (index * (maxRadius - 35)) / Math.max(1, depth - 1);
      const path = closedLoopPath(cx, cy, radius, irregularity, random() * Math.PI * 2);
      const marker = oracle
        ? `<circle cx="${(cx + radius * 1.08).toFixed(1)}" cy="${cy}" r="11" fill="#ffe13b" stroke="#202322" stroke-width="1.5"/><text x="${(cx + radius * 1.08).toFixed(1)}" y="${cy + 4}" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700">${index + 1}</text>`
        : "";
      return `<path d="${path}" fill="none" stroke="${oracle ? "#2466cc" : "#252928"}" stroke-width="3"/>${marker}`;
    }).join("");
    const decoys = Array.from({ length: openDecoysPerPanel }, (_, index) => {
      const radius = 43 + (index / Math.max(1, openDecoysPerPanel - 1)) * 118;
      const start = random() * Math.PI * 2;
      const span = Math.PI * (0.18 + random() * 0.28);
      return `<path d="${openArcPath(cx, cy, radius, start, span, random() * 5)}" fill="none" stroke="#252928" stroke-width="3" stroke-linecap="round"/>`;
    }).join("");
    return `<g><rect x="${x0}" y="${panelTop}" width="${panelWidth}" height="${panelHeight}" rx="4" fill="#faf9f4" stroke="#a9aaa4" stroke-width="2"/><text x="${x0 + 18}" y="${panelTop + 38}" font-family="Arial" font-size="29" font-weight="700">${labels[slot]}</text>${decoys}${loops}<circle cx="${cx}" cy="${cy}" r="15" fill="#e23e31" stroke="#fff" stroke-width="4"/></g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000"><rect width="100%" height="100%" fill="#f2efe5"/><text x="60" y="62" font-family="Arial" font-size="34" font-weight="700">FIND THE REQUESTED ENCLOSURE DEPTH</text><text x="60" y="105" font-family="Arial" font-size="22" fill="#555b58">Count only complete closed boundaries. Open fragments do not enclose the dot.</text>${panels.join("")}</svg>`;
}
