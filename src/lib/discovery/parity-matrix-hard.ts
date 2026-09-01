import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const hardParityVersion = "two-dimensional-parity-matrix-v2";
export const hardParityAnswers = ["A", "B", "C", "D"] as const;

export const hardParityCandidateSchema = z.object({
  id: z.string(),
  cellId: z.literal("cell-four-24x24-two-dimensional-parity"),
  split: z.literal("confirmatory"),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("global-visual-parity-verification"),
  question: z.string(),
  answerOptions: z.array(z.enum(hardParityAnswers)).length(4),
  expectedAnswer: z.enum(hardParityAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    correctPanel: z.number().int().min(0).max(3),
    gridSize: z.literal(24),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type HardParityCandidate = z.infer<typeof hardParityCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000;
}

function shuffled<T>(values: readonly T[], random: () => number) {
  const output = [...values];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target]!, output[index]!];
  }
  return output;
}

function validMatrix(seed: number) {
  const random = rng(seed);
  const size = 24;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false) as boolean[]);
  for (let row = 0; row < size - 1; row += 1) {
    for (let column = 0; column < size - 1; column += 1) matrix[row]![column] = random() < 0.5;
    matrix[row]![size - 1] = matrix[row]!.slice(0, size - 1).filter(Boolean).length % 2 === 1;
  }
  for (let column = 0; column < size - 1; column += 1) {
    matrix[size - 1]![column] = matrix.slice(0, size - 1).filter((row) => row[column]).length % 2 === 1;
  }
  matrix[size - 1]![size - 1] = matrix[size - 1]!.slice(0, size - 1).filter(Boolean).length % 2 === 1;
  return matrix;
}

export function hardParityMatrices(candidate: HardParityCandidate) {
  return Array.from({ length: 4 }, (_, panel) => {
    const matrix = validMatrix(candidate.seed + panel * 997 + candidate.parameters.visualVariant * 43);
    if (panel !== candidate.parameters.correctPanel) {
      const random = rng(candidate.seed + panel * 7919 + 17);
      const column = 1 + Math.floor(random() * 22);
      const row = 1 + Math.floor(random() * 22);
      matrix[row]![column] = !matrix[row]![column];
    }
    return matrix;
  });
}

export function hardParityViolations(matrix: readonly (readonly boolean[])[]) {
  const oddRows = matrix
    .map((row) => row.filter(Boolean).length % 2)
    .map((value, index) => (value ? index : -1))
    .filter((index) => index >= 0);
  const oddColumns = Array.from({ length: matrix.length }, (_, column) =>
    matrix.filter((row) => row[column]).length % 2 ? column : -1,
  ).filter((index) => index >= 0);
  return { oddRows, oddColumns };
}

export function createHardParityCandidate(input: {
  seed: number;
  correctPanel: number;
  visualVariant: number;
}) {
  return hardParityCandidateSchema.parse({
    id: `pmh-${sha256(JSON.stringify(input)).slice(0, 16)}`,
    cellId: "cell-four-24x24-two-dimensional-parity",
    split: "confirmatory",
    seed: input.seed,
    failureModeId: "global-visual-parity-verification",
    question:
      "Which panel has an EVEN number of black dots in EVERY row AND EVERY column? Each other panel has exactly one odd row and one odd column.",
    answerOptions: shuffled(hardParityAnswers, rng(input.seed + 61)),
    expectedAnswer: hardParityAnswers[input.correctPanel],
    humanSolvability: "unverified",
    parameters: { correctPanel: input.correctPanel, gridSize: 24, visualVariant: input.visualVariant },
  });
}

export function createHardParityHoldout() {
  const candidates: HardParityCandidate[] = [];
  let seed = 4_210_000;
  for (let replicate = 0; replicate < 4; replicate += 1) {
    for (let correctPanel = 0; correctPanel < 4; correctPanel += 1) {
      candidates.push(createHardParityCandidate({
        seed: seed++,
        correctPanel,
        visualVariant: 100 + replicate * 4 + correctPanel,
      }));
    }
  }
  return candidates;
}

function matrixSvg(
  matrix: readonly (readonly boolean[])[],
  x: number,
  y: number,
  label: string,
  audit: boolean,
) {
  const cell = 13;
  const violations = hardParityViolations(matrix);
  const dots = matrix.flatMap((row, rowIndex) =>
    row.map((value, columnIndex) => value
      ? `<circle cx="${x + (columnIndex + 0.5) * cell}" cy="${y + (rowIndex + 0.5) * cell}" r="3.6" fill="#202322"/>`
      : ""),
  ).join("");
  const guides = audit
    ? `${violations.oddRows.map((row) => `<rect x="${x}" y="${y + row * cell}" width="312" height="${cell}" fill="#df3c30" opacity=".22"/>`).join("")}${violations.oddColumns.map((column) => `<rect x="${x + column * cell}" y="${y}" width="${cell}" height="312" fill="#df3c30" opacity=".22"/>`).join("")}`
    : "";
  const badge = audit
    ? `<text x="${x + 156}" y="${y + 333}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700" fill="${violations.oddRows.length ? "#b42318" : "#147a4b"}">${violations.oddRows.length ? "ODD ROW + COLUMN" : "ALL ROWS + COLUMNS EVEN"}</text>`
    : "";
  return `<text x="${x + 156}" y="${y - 17}" text-anchor="middle" font-family="Arial" font-size="29" font-weight="700">${label}</text><rect x="${x}" y="${y}" width="312" height="312" fill="#fffef9" stroke="#202322" stroke-width="4"/>${guides}${Array.from({ length: 23 }, (_, index) => `<line x1="${x + (index + 1) * cell}" y1="${y}" x2="${x + (index + 1) * cell}" y2="${y + 312}" stroke="#e3ded5"/><line x1="${x}" y1="${y + (index + 1) * cell}" x2="${x + 312}" y2="${y + (index + 1) * cell}" stroke="#e3ded5"/>`).join("")}${dots}${badge}`;
}

export function renderHardParitySvg(candidate: HardParityCandidate, audit = false) {
  const positions = [[72, 145], [456, 145], [72, 520], [456, 520]] as const;
  const panels = hardParityMatrices(candidate)
    .map((matrix, index) => matrixSvg(matrix, positions[index]![0], positions[index]![1], hardParityAnswers[index]!, audit))
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="900"><rect width="100%" height="100%" fill="#eeeae0"/><text x="420" y="45" text-anchor="middle" font-family="Arial" font-size="29" font-weight="700">FIND THE 2D EVEN-PARITY MATRIX</text><text x="420" y="80" text-anchor="middle" font-family="Arial" font-size="18" fill="#59605d">Every row and every column must contain an even number of dots</text>${panels}</svg>`;
}
