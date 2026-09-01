import { z } from "zod";
import { sha256 } from "../evaluation/hash";
export const symmetryVersion = "symmetry-search-v1";
export const symmetryAnswers = ["A", "B", "C", "D"] as const;
export const symmetryCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("global-bilateral-symmetry-verification"),
  question: z.string(),
  answerOptions: z.array(z.enum(symmetryAnswers)).length(4),
  expectedAnswer: z.enum(symmetryAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    correctPanel: z.number().int().min(0).max(3),
    gridSize: z.literal(24),
    visualVariant: z.number().int().nonnegative(),
  }),
});
export type SymmetryCandidate = z.infer<typeof symmetryCandidateSchema>;
function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000;
}
function shuffle<T>(v: readonly T[], r: () => number) {
  const a = [...v];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}
export function createSymmetryCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  correctPanel: number;
  visualVariant?: number;
}) {
  const visualVariant = input.visualVariant ?? input.seed % 193;
  return symmetryCandidateSchema.parse({
    id: `sy-${sha256(JSON.stringify({ ...input, visualVariant })).slice(0, 16)}`,
    cellId: "cell-24x24-single-defect",
    split: input.split,
    seed: input.seed,
    failureModeId: "global-bilateral-symmetry-verification",
    question:
      "Which panel is PERFECTLY mirror-symmetric across its red vertical axis? The other three each contain one mismatched dot.",
    answerOptions: shuffle(symmetryAnswers, rng(input.seed + 67)),
    expectedAnswer: symmetryAnswers[input.correctPanel],
    humanSolvability: "unverified",
    parameters: { correctPanel: input.correctPanel, gridSize: 24, visualVariant },
  });
}
export function createSymmetryGrid() {
  const r: SymmetryCandidate[] = [];
  let seed = 3_100_000;
  for (let rep = 0; rep < 2; rep++)
    for (let correctPanel = 0; correctPanel < 4; correctPanel++)
      r.push(
        createSymmetryCandidate({
          split: "discovery",
          seed: seed++,
          correctPanel,
          visualVariant: rep * 4 + correctPanel,
        }),
      );
  return r;
}
export function createSymmetryHoldout() {
  const candidates: SymmetryCandidate[] = [];
  let seed = 3_110_000;
  for (let rep = 0; rep < 4; rep++)
    for (let correctPanel = 0; correctPanel < 4; correctPanel++)
      candidates.push(
        createSymmetryCandidate({
          split: "confirmatory",
          seed: seed++,
          correctPanel,
          visualVariant: 300 + rep * 4 + correctPanel,
        }),
      );
  return candidates;
}
export function symmetryMatrix(c: SymmetryCandidate, panel: number) {
  const n = 24,
    random = rng(c.seed + panel * 7919 + c.parameters.visualVariant * 71),
    matrix = Array.from({ length: n }, () => Array(n).fill(false) as boolean[]);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n / 2; x++) {
      const value = random() < 0.42;
      matrix[y]![x] = value;
      matrix[y]![n - 1 - x] = value;
    }
  if (panel !== c.parameters.correctPanel) {
    const y = 2 + Math.floor(random() * (n - 4)),
      x = Math.floor(random() * (n / 2 - 1));
    matrix[y]![x] = !matrix[y]![x];
  }
  return matrix;
}
export function renderSymmetrySvg(c: SymmetryCandidate, oracle = false) {
  const panels = Array.from({ length: 4 }, (_, panel) => {
    const m = symmetryMatrix(c, panel),
      left = 65 + panel * 435,
      top = 180,
      side = 360,
      cell = side / 24;
    const dots = m
      .map((row, y) =>
        row
          .map((value, x) =>
            value
              ? `<circle cx="${left + (x + 0.5) * cell}" cy="${top + (y + 0.5) * cell}" r="${cell * 0.31}" fill="#28302d"/>`
              : "",
          )
          .join(""),
      )
      .join("");
    let marker =
      oracle && panel === c.parameters.correctPanel
        ? `<rect x="${left - 8}" y="${top - 8}" width="${side + 16}" height="${side + 16}" fill="none" stroke="#1d9b5f" stroke-width="9"/>`
        : "";
    if (oracle && panel !== c.parameters.correctPanel) {
      outer: for (let y = 0; y < 24; y++)
        for (let x = 0; x < 12; x++)
          if (m[y]![x] !== m[y]![23 - x]) {
            marker = `<circle cx="${left + (x + 0.5) * cell}" cy="${top + (y + 0.5) * cell}" r="${cell * 0.55}" fill="none" stroke="#e23e31" stroke-width="4"/>`;
            break outer;
          }
    }
    return `<text x="${left + side / 2}" y="145" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700">${symmetryAnswers[panel]}</text><rect x="${left}" y="${top}" width="${side}" height="${side}" fill="#fffef9" stroke="#202322" stroke-width="3"/><path d="M${left + side / 2} ${top}V${top + side}" stroke="#e23e31" stroke-width="3" stroke-dasharray="8 7"/>${dots}${marker}`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="620"><rect width="100%" height="100%" fill="#f4f1e8"/><text x="55" y="58" font-family="Arial" font-size="34" font-weight="700">FIND THE PERFECT MIRROR</text><text x="55" y="101" font-family="Arial" font-size="21" fill="#59605d">Compare every dot to its partner across the red axis.</text>${panels}</svg>`;
}
