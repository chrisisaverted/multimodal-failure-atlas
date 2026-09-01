import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const visualCircuitVersion = "visual-circuit-v1";
const gateTypeSchema = z.enum(["AND", "OR", "XOR"]);
type GateType = z.infer<typeof gateTypeSchema>;

const gateSchema = z.object({
  id: z.string(),
  type: gateTypeSchema,
  left: z.string(),
  right: z.string(),
  value: z.number().int().min(0).max(1),
});

export const visualCircuitCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("visual-boolean-circuit-execution"),
  question: z.string(),
  answerOptions: z.tuple([z.literal("00"), z.literal("01"), z.literal("10"), z.literal("11")]),
  expectedAnswer: z.enum(["00", "01", "10", "11"]),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    inputs: z.array(z.number().int().min(0).max(1)).length(6),
    gates: z.array(gateSchema).length(9),
    outputGateIds: z.tuple([z.literal("G8"), z.literal("G9")]),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type VisualCircuitCandidate = z.infer<typeof visualCircuitCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

function apply(type: GateType, left: number, right: number) {
  if (type === "AND") return left & right;
  if (type === "OR") return left | right;
  return left ^ right;
}

const connections = [
  ["I1", "I2"],
  ["I3", "I4"],
  ["I5", "I6"],
  ["I1", "I6"],
  ["G1", "G3"],
  ["G2", "G4"],
  ["G3", "G1"],
  ["G5", "G6"],
  ["G6", "G7"],
] as const;

export function createVisualCircuitCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  visualVariant: number;
}) {
  const random = rng(input.seed * 1009 + input.visualVariant * 9176);
  const inputs = Array.from({ length: 6 }, () => (random() < 0.5 ? 0 : 1));
  const values = new Map(inputs.map((value, index) => [`I${index + 1}`, value]));
  const gateTypes: GateType[] = ["AND", "OR", "XOR"];
  const gates = connections.map(([left, right], index) => {
    const type = gateTypes[Math.floor(random() * gateTypes.length)]!;
    const value = apply(type, values.get(left)!, values.get(right)!);
    const id = `G${index + 1}`;
    values.set(id, value);
    return { id, type, left, right, value };
  });
  const expectedAnswer = `${values.get("G8")}${values.get("G9")}`;
  return visualCircuitCandidateSchema.parse({
    id: stableId("vc", input),
    cellId: stableId("cell", { gateCount: 9, depth: 3, connections }),
    split: input.split,
    seed: input.seed,
    failureModeId: "visual-boolean-circuit-execution",
    question: "Evaluate the circuit from left to right. What is the two-bit output O1O2?",
    answerOptions: ["00", "01", "10", "11"],
    expectedAnswer,
    humanSolvability: "unverified",
    parameters: { inputs, gates, outputGateIds: ["G8", "G9"], visualVariant: input.visualVariant },
  });
}

export function createVisualCircuitSet(split: "discovery" | "confirmatory") {
  const replicates = split === "discovery" ? 2 : 4;
  const seedBase = split === "discovery" ? 3_000_000 : 3_010_000;
  const candidates: VisualCircuitCandidate[] = [];
  let cursor = seedBase;
  for (let replicate = 0; replicate < replicates; replicate += 1) {
    for (const target of ["00", "01", "10", "11"] as const) {
      let found: VisualCircuitCandidate | undefined;
      while (!found) {
        const candidate = createVisualCircuitCandidate({
          split,
          seed: cursor,
          visualVariant: (split === "discovery" ? 100 : 300) + candidates.length,
        });
        cursor += 1;
        const typeCount = new Set(candidate.parameters.gates.map((gate) => gate.type)).size;
        if (candidate.expectedAnswer === target && typeCount === 3) found = candidate;
        if (cursor - seedBase > 100_000) throw new Error(`Could not balance visual-circuit output ${target}`);
      }
      candidates.push(found);
    }
  }
  return candidates;
}

interface NodePosition {
  x: number;
  y: number;
}

const positions: Record<string, NodePosition> = {
  I1: { x: 150, y: 240 },
  I2: { x: 150, y: 360 },
  I3: { x: 150, y: 480 },
  I4: { x: 150, y: 600 },
  I5: { x: 150, y: 720 },
  I6: { x: 150, y: 840 },
  G1: { x: 510, y: 260 },
  G2: { x: 510, y: 440 },
  G3: { x: 510, y: 620 },
  G4: { x: 510, y: 800 },
  G5: { x: 930, y: 330 },
  G6: { x: 930, y: 540 },
  G7: { x: 930, y: 750 },
  G8: { x: 1350, y: 390 },
  G9: { x: 1350, y: 680 },
  O1: { x: 1660, y: 390 },
  O2: { x: 1660, y: 680 },
};

function wire(from: string, to: string, inputIndex: number) {
  const source = positions[from]!;
  const target = positions[to]!;
  const targetY = target.y + (inputIndex === 0 ? -13 : 13);
  const bend = source.x + (target.x - source.x) * (0.48 + inputIndex * 0.08);
  const labelX = target.x - 97;
  return `<g><path d="M${source.x + (from.startsWith("I") ? 24 : 70)} ${source.y} H${bend.toFixed(1)} V${targetY} H${target.x - 70}" fill="none" stroke="#69706d" stroke-width="3" marker-end="url(#arrow)"/><rect x="${labelX - 17}" y="${targetY - 11}" width="34" height="22" rx="4" fill="#f4f1e8" stroke="#929895" stroke-width="1"/><text x="${labelX}" y="${targetY + 5}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#343837">${from}</text></g>`;
}

export function renderVisualCircuitSvg(candidate: VisualCircuitCandidate, oracle = false) {
  const inputNodes = candidate.parameters.inputs
    .map((value, index) => {
      const id = `I${index + 1}`;
      const { x, y } = positions[id]!;
      return `<g><circle cx="${x}" cy="${y}" r="25" fill="#fff" stroke="#202322" stroke-width="3"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${value}</text><text x="${x - 47}" y="${y + 5}" font-family="Arial" font-size="17" font-weight="700">${id}</text></g>`;
    })
    .join("");
  const wires =
    candidate.parameters.gates
      .map((gate) => `${wire(gate.left, gate.id, 0)}${wire(gate.right, gate.id, 1)}`)
      .join("") +
    `<path d="M1420 390 H1630" stroke="#202322" stroke-width="4" marker-end="url(#arrow)"/><path d="M1420 680 H1630" stroke="#202322" stroke-width="4" marker-end="url(#arrow)"/>`;
  const gates = candidate.parameters.gates
    .map((gate) => {
      const { x, y } = positions[gate.id]!;
      return `<g><rect x="${x - 70}" y="${y - 35}" width="140" height="70" rx="9" fill="#faf9f4" stroke="#202322" stroke-width="3"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-family="Arial" font-size="22" font-weight="700">${gate.type}</text><text x="${x}" y="${y - 48}" text-anchor="middle" font-family="Arial" font-size="15" fill="#59605d">${gate.id}</text>${oracle ? `<circle cx="${x + 58}" cy="${y - 29}" r="17" fill="#ffe13b" stroke="#202322" stroke-width="2"/><text x="${x + 58}" y="${y - 23}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="700">${gate.value}</text>` : ""}</g>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1000"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#69706d"/></marker></defs><rect width="100%" height="100%" fill="#f4f1e8"/><text x="60" y="62" font-family="Arial" font-size="34" font-weight="700">EXECUTE THE BOOLEAN CIRCUIT</text><text x="60" y="106" font-family="Arial" font-size="21" fill="#59605d">AND = both 1 · OR = at least one 1 · XOR = exactly one 1</text><text x="60" y="139" font-family="Arial" font-size="17" fill="#737a77">Input tags at each gate name the wire source · crossings never connect</text><g opacity="0.95">${wires}</g>${inputNodes}${gates}<text x="1680" y="398" font-family="Arial" font-size="24" font-weight="700">O1</text><text x="1680" y="688" font-family="Arial" font-size="24" font-weight="700">O2</text></svg>`;
}
