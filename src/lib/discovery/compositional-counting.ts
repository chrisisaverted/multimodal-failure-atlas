import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const compositionalCountingGeneratorVersion = "compositional-counting-v1";
export const compositionalAnswers = ["4", "6", "8", "10"] as const;
const colors = ["blue", "red", "green", "orange"] as const;
const shapes = ["triangle", "diamond", "circle", "square"] as const;
const fills = ["striped", "solid"] as const;

export const compositionalCountingCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int(),
  failureModeId: z.literal("counting-density-confound"),
  question: z.string(),
  answerOptions: z.array(z.enum(compositionalAnswers)).length(4),
  expectedAnswer: z.enum(compositionalAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    gridSize: z.number().int().min(6).max(20),
    hardNegativeRate: z.number().min(0).max(1),
    targetCount: z.number().int(),
    targetColor: z.enum(colors),
    targetShape: z.enum(shapes),
    targetFill: z.enum(fills),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type CompositionalCountingCandidate = z.infer<typeof compositionalCountingCandidateSchema>;

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

function rotate<T>(values: readonly T[], amount: number) {
  return values.map((_, index) => values[(index + amount) % values.length]!);
}

export function createCompositionalCountingCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  gridSize: number;
  hardNegativeRate: number;
  targetCount: (typeof compositionalAnswers)[number];
  targetIndex: number;
  visualVariant?: number;
}) {
  const targetColor = colors[input.targetIndex % colors.length]!;
  const targetShape = shapes[input.targetIndex % shapes.length]!;
  const targetFill = fills[input.targetIndex % fills.length]!;
  const visualVariant = input.visualVariant ?? input.seed % 17;
  const cell = { gridSize: input.gridSize, hardNegativeRate: input.hardNegativeRate };
  const identity = { ...input, targetColor, targetShape, targetFill, visualVariant };
  return compositionalCountingCandidateSchema.parse({
    id: stableId("cc", identity),
    cellId: stableId("cell", cell),
    split: input.split,
    seed: input.seed,
    failureModeId: "counting-density-confound",
    question: `How many ${targetColor} ${targetFill} ${targetShape}s are in the grid?`,
    answerOptions: rotate(compositionalAnswers, input.seed % 4),
    expectedAnswer: input.targetCount,
    humanSolvability: "unverified",
    parameters: {
      gridSize: input.gridSize,
      hardNegativeRate: input.hardNegativeRate,
      targetCount: Number(input.targetCount),
      targetColor,
      targetShape,
      targetFill,
      visualVariant,
    },
  });
}

export function createCompositionalCountingDiscoveryGrid() {
  const candidates: CompositionalCountingCandidate[] = [];
  let seed = 610_000;
  let cellIndex = 0;
  for (const gridSize of [10, 14, 18]) {
    for (const hardNegativeRate of [0.55, 0.9]) {
      for (const [answerIndex, targetCount] of compositionalAnswers.entries()) {
        candidates.push(
          createCompositionalCountingCandidate({
            split: "discovery",
            seed,
            gridSize,
            hardNegativeRate,
            targetCount,
            targetIndex: answerIndex + cellIndex,
          }),
        );
        seed += 1;
      }
      cellIndex += 1;
    }
  }
  return candidates;
}

type Glyph = { color: (typeof colors)[number]; shape: (typeof shapes)[number]; fill: (typeof fills)[number] };

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function different<T>(values: readonly T[], value: T, random: () => number) {
  const alternatives = values.filter((entry) => entry !== value);
  return alternatives[Math.floor(random() * alternatives.length)]!;
}

export function generateGlyphs(candidate: CompositionalCountingCandidate) {
  const p = candidate.parameters;
  const random = rng(candidate.seed + p.visualVariant * 7919);
  const target: Glyph = { color: p.targetColor, shape: p.targetShape, fill: p.targetFill };
  const glyphs: Glyph[] = Array.from({ length: p.gridSize ** 2 - p.targetCount }, () => {
    if (random() < p.hardNegativeRate) {
      const miss = Math.floor(random() * 3);
      return {
        color: miss === 0 ? different(colors, target.color, random) : target.color,
        shape: miss === 1 ? different(shapes, target.shape, random) : target.shape,
        fill: miss === 2 ? different(fills, target.fill, random) : target.fill,
      };
    }
    let glyph: Glyph;
    do {
      glyph = {
        color: colors[Math.floor(random() * colors.length)]!,
        shape: shapes[Math.floor(random() * shapes.length)]!,
        fill: fills[Math.floor(random() * fills.length)]!,
      };
    } while (glyph.color === target.color && glyph.shape === target.shape && glyph.fill === target.fill);
    return glyph;
  });
  for (let index = 0; index < p.targetCount; index += 1) {
    glyphs.splice(Math.floor(random() * (glyphs.length + 1)), 0, target);
  }
  return glyphs;
}

function glyphMarkup(glyph: Glyph, x: number, y: number, size: number, id: string) {
  const hex = { blue: "#1769d2", red: "#d53434", green: "#16884b", orange: "#e57b16" }[glyph.color];
  const fill = glyph.fill === "solid" ? hex : `url(#stripe-${glyph.color})`;
  const stroke = hex;
  if (glyph.shape === "circle")
    return `<circle cx="${x}" cy="${y}" r="${size * 0.3}" fill="${fill}" stroke="${stroke}" stroke-width="3" data-id="${id}"/>`;
  if (glyph.shape === "square")
    return `<rect x="${x - size * 0.3}" y="${y - size * 0.3}" width="${size * 0.6}" height="${size * 0.6}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="3" data-id="${id}"/>`;
  if (glyph.shape === "diamond")
    return `<path d="M${x} ${y - size * 0.36} L${x + size * 0.34} ${y} L${x} ${y + size * 0.36} L${x - size * 0.34} ${y} Z" fill="${fill}" stroke="${stroke}" stroke-width="3" data-id="${id}"/>`;
  return `<path d="M${x} ${y - size * 0.37} L${x + size * 0.36} ${y + size * 0.31} L${x - size * 0.36} ${y + size * 0.31} Z" fill="${fill}" stroke="${stroke}" stroke-width="3" data-id="${id}"/>`;
}

export function renderCompositionalCountingSvg(candidate: CompositionalCountingCandidate, oracle = false) {
  const p = candidate.parameters;
  const glyphs = generateGlyphs(candidate);
  const width = 1800;
  const header = 220;
  const margin = 45;
  const cell = (width - margin * 2) / p.gridSize;
  const height = header + margin + cell * p.gridSize + margin;
  const patterns = Object.entries({ blue: "#1769d2", red: "#d53434", green: "#16884b", orange: "#e57b16" })
    .map(([name, hex]) => `<pattern id="stripe-${name}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#fff"/><rect width="5" height="12" fill="${hex}"/></pattern>`)
    .join("");
  const target = { color: p.targetColor, shape: p.targetShape, fill: p.targetFill } as Glyph;
  const cells = glyphs.map((glyph, index) => {
    const col = index % p.gridSize;
    const row = Math.floor(index / p.gridSize);
    const x = margin + col * cell + cell / 2;
    const y = header + margin + row * cell + cell / 2;
    const isTarget = glyph.color === target.color && glyph.shape === target.shape && glyph.fill === target.fill;
    const highlight = oracle && isTarget ? `<rect x="${margin + col * cell + 4}" y="${header + margin + row * cell + 4}" width="${cell - 8}" height="${cell - 8}" rx="8" fill="none" stroke="#ffdf2b" stroke-width="8"/>` : "";
    return `${highlight}${glyphMarkup(glyph, x, y, cell * 0.82, String(index))}`;
  }).join("");
  const lines = Array.from({ length: p.gridSize + 1 }, (_, index) => {
    const offset = margin + index * cell;
    const y = header + margin + index * cell;
    return `<path d="M${offset} ${header + margin}V${height - margin} M${margin} ${y}H${width - margin}" stroke="#dde0dd" stroke-width="1"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${Math.round(height)}"><defs>${patterns}</defs><rect width="100%" height="100%" fill="#f8f7f2"/><text x="45" y="66" font-family="Arial,sans-serif" font-size="38" font-weight="700" fill="#171917">COUNT THE ${p.targetColor.toUpperCase()} ${p.targetFill.toUpperCase()} ${p.targetShape.toUpperCase()}S</text><text x="45" y="118" font-family="Arial,sans-serif" font-size="25" fill="#555b56">Every distractor may share color, fill, or shape. Count only exact three-attribute matches.</text>${glyphMarkup(target, width - 115, 103, 105, "reference")}${lines}${cells}</svg>`;
}
