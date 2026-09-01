import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const changeLocalizationVersion = "dense-change-localization-v1";
export const changeQuadrants = ["A", "B", "C", "D"] as const;

export const changeLocalizationCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("dense-cross-image-change-localization"),
  question: z.string(),
  answerOptions: z.array(z.enum(changeQuadrants)).length(4),
  expectedAnswer: z.enum(changeQuadrants),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    gridSize: z.number().int().min(8).max(36),
    changedQuadrant: z.number().int().min(0).max(3),
    changeRow: z.number().int().nonnegative(),
    changeColumn: z.number().int().nonnegative(),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type ChangeLocalizationCandidate = z.infer<typeof changeLocalizationCandidateSchema>;

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

export function createChangeLocalizationCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  gridSize: number;
  changedQuadrant: number;
  visualVariant?: number;
}) {
  const random = rng(input.seed + 71);
  const half = Math.floor(input.gridSize / 2);
  const rowBase = input.changedQuadrant >= 2 ? half : 1;
  const columnBase = input.changedQuadrant % 2 ? half : 1;
  const span = Math.max(2, half - 2);
  const changeRow = rowBase + Math.floor(random() * span);
  const changeColumn = columnBase + Math.floor(random() * span);
  const visualVariant = input.visualVariant ?? input.seed % 103;
  return changeLocalizationCandidateSchema.parse({
    id: stableId("cl", { ...input, changeRow, changeColumn, visualVariant }),
    cellId: stableId("cell", { gridSize: input.gridSize }),
    split: input.split,
    seed: input.seed,
    failureModeId: "dense-cross-image-change-localization",
    question: "In which labeled quadrant of the RIGHT grid is the one rotated glyph?",
    answerOptions: shuffle(changeQuadrants, random),
    expectedAnswer: changeQuadrants[input.changedQuadrant],
    humanSolvability: "unverified",
    parameters: {
      gridSize: input.gridSize,
      changedQuadrant: input.changedQuadrant,
      changeRow,
      changeColumn,
      visualVariant,
    },
  });
}

export function createChangeLocalizationDiscoveryGrid() {
  const candidates: ChangeLocalizationCandidate[] = [];
  let seed = 1_400_000;
  for (const gridSize of [20, 28]) {
    for (let replicate = 0; replicate < 2; replicate += 1) {
      for (let changedQuadrant = 0; changedQuadrant < 4; changedQuadrant += 1) {
        candidates.push(
          createChangeLocalizationCandidate({
            split: "discovery",
            seed,
            gridSize,
            changedQuadrant,
          }),
        );
        seed += 1;
      }
    }
  }
  return candidates;
}

export function createChangeLocalizationHardGrid() {
  const candidates: ChangeLocalizationCandidate[] = [];
  let seed = 1_410_000;
  for (let replicate = 0; replicate < 2; replicate += 1) {
    for (let changedQuadrant = 0; changedQuadrant < 4; changedQuadrant += 1) {
      candidates.push(
        createChangeLocalizationCandidate({
          split: "discovery",
          seed,
          gridSize: 34,
          changedQuadrant,
          visualVariant: 200 + replicate * 4 + changedQuadrant,
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

function orientationGrid(candidate: ChangeLocalizationCandidate) {
  const random = rng(candidate.seed + candidate.parameters.visualVariant * 6151);
  return Array.from({ length: candidate.parameters.gridSize }, () =>
    Array.from({ length: candidate.parameters.gridSize }, () => Math.floor(random() * 4)),
  );
}

function glyph(cx: number, cy: number, size: number, orientation: number) {
  const points = [
    [-0.34, -0.32],
    [0.36, 0],
    [-0.34, 0.32],
  ].map(([x, y]) => {
    let rx = x!;
    let ry = y!;
    for (let turn = 0; turn < orientation; turn += 1) [rx, ry] = [-ry, rx];
    return `${(cx + rx * size).toFixed(1)},${(cy + ry * size).toFixed(1)}`;
  });
  return `<polyline points="${points.join(" ")}" fill="none" stroke="#252928" stroke-width="${Math.max(2, size * 0.12).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function grid(candidate: ChangeLocalizationCandidate, right: boolean, oracle: boolean) {
  const { gridSize, changeRow, changeColumn } = candidate.parameters;
  const values = orientationGrid(candidate);
  const side = 720;
  const left = right ? 980 : 80;
  const top = 190;
  const cell = side / gridSize;
  let marks = "";
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const changed = right && row === changeRow && column === changeColumn;
      const orientation = (values[row]![column]! + (changed ? 1 : 0)) % 4;
      marks += glyph(left + (column + 0.5) * cell, top + (row + 0.5) * cell, cell * 0.72, orientation);
    }
  }
  const overlay =
    oracle && right
      ? `<circle cx="${(left + (changeColumn + 0.5) * cell).toFixed(1)}" cy="${(top + (changeRow + 0.5) * cell).toFixed(1)}" r="${(cell * 0.7).toFixed(1)}" fill="none" stroke="#e23e31" stroke-width="6"/>`
      : "";
  const half = side / 2;
  const labels = [
    ["A", left + 22, top + 30],
    ["B", left + half + 22, top + 30],
    ["C", left + 22, top + half + 30],
    ["D", left + half + 22, top + half + 30],
  ]
    .map(
      ([label, x, y]) =>
        `<text x="${x}" y="${y}" font-family="Arial" font-size="22" font-weight="700" fill="#e23e31">${label}</text>`,
    )
    .join("");
  return `<rect x="${left}" y="${top}" width="${side}" height="${side}" fill="#fff" stroke="#c7cbc7" stroke-width="3"/><path d="M${left + half} ${top}V${top + side} M${left} ${top + half}H${left + side}" stroke="#e23e31" stroke-width="2" stroke-dasharray="10 10"/>${marks}${right ? labels : ""}${overlay}`;
}

export function renderChangeLocalizationSvg(candidate: ChangeLocalizationCandidate, oracle = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000"><rect width="100%" height="100%" fill="#faf9f4"/><text x="65" y="62" font-family="Arial" font-size="32" font-weight="700">FIND THE ONE ROTATED GLYPH</text><text x="65" y="103" font-family="Arial" font-size="21" fill="#59605d">The grids are identical except for one glyph in the right grid.</text>${grid(candidate, false, oracle)}${grid(candidate, true, oracle)}<text x="440" y="950" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">REFERENCE</text><text x="1340" y="950" text-anchor="middle" font-family="Arial" font-size="23" font-weight="700">COMPARE — ANSWER A, B, C, OR D</text></svg>`;
}
