import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const enclosurePanelsDenseVersion = "enclosure-panels-dense-v1";
export const enclosurePanelsDenseTarget = 18;

export const enclosurePanelsDenseCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("topological-enclosure-depth"),
  question: z.literal("Which panel contains exactly 18 CLOSED boundaries around its red dot?"),
  answerOptions: z.tuple([z.literal("A"), z.literal("B"), z.literal("C"), z.literal("D")]),
  expectedAnswer: z.enum(["A", "B", "C", "D"]),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetDepth: z.literal(18),
    panelDepths: z.array(z.number().int().min(16).max(20)).length(4),
    targetSlot: z.number().int().min(0).max(3),
    templateVariant: z.number().int().min(0).max(1),
    openDecoysPerPanel: z.literal(8),
    irregularity: z.literal(0.35),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type EnclosurePanelsDenseCandidate = z.infer<typeof enclosurePanelsDenseCandidateSchema>;

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

export function createEnclosurePanelsDenseCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetSlot: number;
  templateVariant: number;
  visualVariant: number;
}) {
  const random = rng(input.seed + input.visualVariant * 7919);
  const templates = [
    [16, 17, 19],
    [17, 19, 20],
  ] as const;
  const remaining = shuffled(templates[input.templateVariant]!, random);
  const panelDepths = Array.from({ length: 4 }, (_, slot) =>
    slot === input.targetSlot ? enclosurePanelsDenseTarget : remaining.shift()!,
  );
  return enclosurePanelsDenseCandidateSchema.parse({
    id: stableId("epd", input),
    cellId: stableId("cell", {
      targetDepth: enclosurePanelsDenseTarget,
      templates,
      openDecoysPerPanel: 8,
      irregularity: 0.35,
    }),
    split: input.split,
    seed: input.seed,
    failureModeId: "topological-enclosure-depth",
    question: "Which panel contains exactly 18 CLOSED boundaries around its red dot?",
    answerOptions: ["A", "B", "C", "D"],
    expectedAnswer: ["A", "B", "C", "D"][input.targetSlot],
    humanSolvability: "unverified",
    parameters: {
      targetDepth: enclosurePanelsDenseTarget,
      panelDepths,
      targetSlot: input.targetSlot,
      templateVariant: input.templateVariant,
      openDecoysPerPanel: 8,
      irregularity: 0.35,
      visualVariant: input.visualVariant,
    },
  });
}

export function createEnclosurePanelsDenseSet(split: "discovery" | "confirmatory") {
  const replicatesPerSlot = split === "discovery" ? 2 : 4;
  const seedBase = split === "discovery" ? 3_100_000 : 3_110_000;
  return Array.from({ length: replicatesPerSlot * 4 }, (_, index) =>
    createEnclosurePanelsDenseCandidate({
      split,
      seed: seedBase + index,
      targetSlot: index % 4,
      templateVariant: Math.floor(index / 4) % 2,
      visualVariant: (split === "discovery" ? 900 : 1100) + index,
    }),
  );
}

function closedLoopPath(cx: number, cy: number, radius: number, phase: number) {
  const points = 48;
  return (
    Array.from({ length: points }, (_, index) => {
      const angle = (index / points) * Math.PI * 2;
      const wobble = 1 + 0.009 * Math.sin(angle * 3 + phase) + 0.004 * Math.sin(angle * 7 - phase);
      return `${index ? "L" : "M"}${(cx + Math.cos(angle) * radius * 1.08 * wobble).toFixed(1)} ${(cy + Math.sin(angle) * radius * wobble).toFixed(1)}`;
    }).join(" ") + " Z"
  );
}

function openArcPath(cx: number, cy: number, radius: number, start: number, span: number, phase: number) {
  return Array.from({ length: 15 }, (_, index) => {
    const angle = start + (index / 14) * span;
    const offset = Math.sin(index * 1.1 + phase) * 1.5;
    return `${index ? "L" : "M"}${(cx + Math.cos(angle) * (radius + offset) * 1.08).toFixed(1)} ${(cy + Math.sin(angle) * (radius + offset)).toFixed(1)}`;
  }).join(" ");
}

export function renderEnclosurePanelsDenseSvg(candidate: EnclosurePanelsDenseCandidate, oracle = false) {
  const labels = ["A", "B", "C", "D"];
  const panelWidth = 820;
  const panelHeight = 600;
  const gap = 40;
  const left = 60;
  const top = 170;
  const panels = candidate.parameters.panelDepths.map((depth, slot) => {
    const random = rng(candidate.seed + candidate.parameters.visualVariant * 101 + slot * 10007);
    const column = slot % 2;
    const row = Math.floor(slot / 2);
    const x0 = left + column * (panelWidth + gap);
    const y0 = top + row * (panelHeight + gap);
    const cx = x0 + panelWidth / 2;
    const cy = y0 + panelHeight / 2 + 8;
    const minRadius = 50;
    const maxRadius = 250;
    const loops = Array.from({ length: depth }, (_, index) => {
      const radius = minRadius + (index * (maxRadius - minRadius)) / Math.max(1, depth - 1);
      const path = closedLoopPath(cx, cy, radius, random() * Math.PI * 2);
      const marker = oracle
        ? `<circle cx="${(cx + radius * 1.08).toFixed(1)}" cy="${cy}" r="13" fill="#ffe13b" stroke="#202322" stroke-width="1.5"/><text x="${(cx + radius * 1.08).toFixed(1)}" y="${cy + 4}" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700">${index + 1}</text>`
        : "";
      return `<path d="${path}" fill="none" stroke="${oracle ? "#2466cc" : "#252928"}" stroke-width="3"/>${marker}`;
    }).join("");
    const decoys = Array.from({ length: 8 }, (_, index) => {
      const radius = 65 + (index / 7) * 170;
      const start = random() * Math.PI * 2;
      const span = Math.PI * (0.13 + random() * 0.18);
      return `<path d="${openArcPath(cx, cy, radius, start, span, random() * 5)}" fill="none" stroke="#858b88" stroke-width="2.2" stroke-linecap="round"/>`;
    }).join("");
    return `<g><rect x="${x0}" y="${y0}" width="${panelWidth}" height="${panelHeight}" rx="5" fill="#faf9f4" stroke="#a9aaa4" stroke-width="2"/><text x="${x0 + 22}" y="${y0 + 44}" font-family="Arial" font-size="32" font-weight="700">${labels[slot]}</text>${decoys}${loops}<circle cx="${cx}" cy="${cy}" r="16" fill="#e23e31" stroke="#fff" stroke-width="4"/></g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1450"><rect width="100%" height="100%" fill="#f2efe5"/><text x="60" y="62" font-family="Arial" font-size="34" font-weight="700">FIND THE REQUESTED ENCLOSURE DEPTH</text><text x="60" y="105" font-family="Arial" font-size="22" fill="#555b58">Count complete dark boundaries. Lighter open fragments do not enclose the dot.</text>${panels.join("")}</svg>`;
}
