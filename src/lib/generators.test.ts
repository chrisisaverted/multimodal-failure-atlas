import { describe, expect, it } from "vitest";
import { renderDiagnosticSvg } from "./evaluation/render";
import {
  allGeneratorKeys,
  diagnosticBurdenSummary,
  generateInstance,
  isVideoGenerator,
  videoGeneratorKeys,
} from "./generators";
import type { GeneratorKey } from "./types";

const keys: GeneratorKey[] = [...allGeneratorKeys];

function countDirectionChanges(path: number[]) {
  let turns = 0;
  for (let index = 4; index < path.length; index += 2) {
    const previous = [path[index - 2]! - path[index - 4]!, path[index - 1]! - path[index - 3]!];
    const current = [path[index]! - path[index - 2]!, path[index + 1]! - path[index - 1]!];
    if (previous[0] !== current[0] || previous[1] !== current[1]) turns += 1;
  }
  return turns;
}

function countBlueToRedTransitions(sequence: number[]) {
  return sequence.slice(1).filter((value, index) => sequence[index] === 0 && value === 2).length;
}

function applySwapLedger(instance: ReturnType<typeof generateInstance>) {
  let position = Number(instance.latent.initialTarget);
  const left = instance.latent.swapLeft as number[];
  const right = instance.latent.swapRight as number[];
  for (let index = 0; index < left.length; index += 1) {
    if (position === left[index]) position = right[index]!;
    else if (position === right[index]) position = left[index]!;
  }
  return position;
}

function parityValid(bits: number[], gridSize: number) {
  for (let row = 0; row < gridSize; row += 1)
    if (bits.slice(row * gridSize, (row + 1) * gridSize).reduce((sum, bit) => sum + bit, 0) % 2) return false;
  for (let column = 0; column < gridSize; column += 1) {
    let total = 0;
    for (let row = 0; row < gridSize; row += 1) total += bits[row * gridSize + column]!;
    if (total % 2) return false;
  }
  return true;
}

function reachableCells(instance: ReturnType<typeof generateInstance>) {
  const gridSize = Number(instance.latent.gridSize);
  const openRight = instance.latent.openRight as number[];
  const openDown = instance.latent.openDown as number[];
  const seen = new Set([Number(instance.latent.startCell)]);
  const queue = [...seen];
  while (queue.length) {
    const cell = queue.shift()!;
    const row = Math.floor(cell / gridSize);
    const column = cell % gridSize;
    const neighbours = [
      column + 1 < gridSize && openRight[cell] ? cell + 1 : -1,
      column > 0 && openRight[cell - 1] ? cell - 1 : -1,
      row + 1 < gridSize && openDown[cell] ? cell + gridSize : -1,
      row > 0 && openDown[cell - gridSize] ? cell - gridSize : -1,
    ];
    for (const neighbour of neighbours)
      if (neighbour >= 0 && !seen.has(neighbour)) {
        seen.add(neighbour);
        queue.push(neighbour);
      }
  }
  return seen;
}

function rotatePoint(index: number, side: number, quarterTurns: number) {
  let x = index % side;
  let y = Math.floor(index / side);
  for (let turn = 0; turn < quarterTurns; turn += 1) [x, y] = [side - 1 - y, x];
  return y * side + x;
}

function countIntersections(path: number[]) {
  const points = Array.from(
    { length: path.length / 2 },
    (_, index) => [path[index * 2]!, path[index * 2 + 1]!] as const,
  );
  let count = 0;
  for (let first = 0; first < points.length - 1; first += 1)
    for (let second = first + 2; second < points.length - 1; second += 1) {
      const [a, b, c, d] = [points[first]!, points[first + 1]!, points[second]!, points[second + 1]!];
      const firstVertical = a[0] === b[0],
        secondVertical = c[0] === d[0];
      if (firstVertical === secondVertical) continue;
      const [va, vb] = firstVertical ? [a, b] : [c, d];
      const [ha, hb] = firstVertical ? [c, d] : [a, b];
      if (
        va[0] > Math.min(ha[0], hb[0]) &&
        va[0] < Math.max(ha[0], hb[0]) &&
        ha[1] > Math.min(va[1], vb[1]) &&
        ha[1] < Math.max(va[1], vb[1])
      )
        count += 1;
    }
  return count;
}

describe("diagnostic generators", () => {
  it("has one canonical registry with an even image-video split", () => {
    expect(keys).toHaveLength(28);
    expect(new Set(keys).size).toBe(28);
    expect(videoGeneratorKeys).toHaveLength(14);
    expect(keys.filter(isVideoGenerator)).toEqual(videoGeneratorKeys);
  });

  for (const key of keys) {
    it(`${key} is deterministic`, () => {
      const params = { seed: 421, difficulty: 63, variant: 2 };
      expect(generateInstance(key, params)).toEqual(generateInstance(key, params));
    });

    it(`${key} returns construction-grounded metadata`, () => {
      const instance = generateInstance(key, { seed: 9, difficulty: 40, variant: 1 });
      expect(instance.answer.length).toBeGreaterThan(0);
      expect(instance.question.endsWith("?")).toBe(true);
      expect(Object.keys(instance.latent).length).toBeGreaterThan(2);
      expect(instance.answerOptions).toContain(instance.answer);
    });
  }

  it("numerosity holds coloured area constant across counts", () => {
    const a = generateInstance("numerosity-density", { seed: 1, difficulty: 50, variant: 0 });
    const b = generateInstance("numerosity-density", { seed: 2, difficulty: 50, variant: 0 });
    expect(a.latent.totalArea).toBe(b.latent.totalArea);
    expect(a.latent.count).not.toBe(b.latent.count);
  });

  it("event order counterbalances from the seed", () => {
    const even = generateInstance("event-order", { seed: 2, difficulty: 50, variant: 0 });
    const odd = generateInstance("event-order", { seed: 3, difficulty: 50, variant: 0 });
    expect(even.answer).not.toBe(odd.answer);
  });

  it("keeps binary answers exactly balanced across paired seeds", () => {
    for (const key of ["patch-phase", "brief-event", "event-order", "identity-occlusion"] as const) {
      const counts = new Map<string, number>();
      for (let seed = 0; seed < 100; seed += 1) {
        const answer = generateInstance(key, { seed, difficulty: 50, variant: 0 }).answer;
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      }
      expect([...counts.values()].sort()).toEqual([50, 50]);
    }
  });

  it("covers every categorical answer without strong seed imbalance", () => {
    for (const key of ["small-object", "attribute-binding"] as const) {
      const counts = new Map<string, number>();
      for (let seed = 0; seed < 400; seed += 1) {
        const answer = generateInstance(key, { seed, difficulty: 50, variant: 0 }).answer;
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      }
      expect(counts.size).toBe(4);
      const values = [...counts.values()];
      expect(Math.max(...values) / Math.min(...values)).toBeLessThan(1.35);
    }
  });

  it("cycles counting answers uniformly", () => {
    for (const key of ["numerosity-density", "event-counting"] as const) {
      const counts = new Map<string, number>();
      for (let seed = 0; seed < 70; seed += 1) {
        const answer = generateInstance(key, { seed, difficulty: 50, variant: 0 }).answer;
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      }
      expect([...counts.values()]).toEqual([10, 10, 10, 10, 10, 10, 10]);
    }
  });

  it("balances the four gated counting answers", () => {
    for (const key of ["gated-frequency", "gated-pair-collision"] as const) {
      const counts = new Map<string, number>();
      for (let seed = 0; seed < 40; seed += 1) {
        const answer = generateInstance(key, { seed, difficulty: 70, variant: 0 }).answer;
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      }
      expect([...counts.values()]).toEqual([10, 10, 10, 10]);
    }
  });

  it("balances the four dense verification panels", () => {
    for (const key of ["dense-symmetry", "dense-xor"] as const) {
      const counts = new Map<string, number>();
      for (let seed = 0; seed < 40; seed += 1) {
        const answer = generateInstance(key, { seed, difficulty: 70, variant: 0 }).answer;
        counts.set(answer, (counts.get(answer) ?? 0) + 1);
      }
      expect([...counts.values()]).toEqual([10, 10, 10, 10]);
    }
  });

  it("constructs exact color-gated frequency answers", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const instance = generateInstance("gated-frequency", { seed, difficulty, variant: 0 });
        const cells = instance.latent.eventCells as number[];
        const gates = instance.latent.eventGates as string[];
        const targetGate = String(instance.latent.targetGate);
        const frequencies = new Map<number, number>();
        for (let index = 0; index < cells.length; index += 1)
          if (gates[index] === targetGate)
            frequencies.set(cells[index]!, (frequencies.get(cells[index]!) ?? 0) + 1);
        expect([...frequencies.values()].filter((count) => count === 2).length).toBe(Number(instance.answer));
      }
    }
  });

  it("constructs exactly one bilateral symmetry answer", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const instance = generateInstance("dense-symmetry", { seed, difficulty, variant: 0 });
        const gridSize = Number(instance.latent.gridSize);
        const bits = instance.latent.panelBits as number[];
        const symmetricPanels = [0, 1, 2, 3].filter((panel) => {
          const start = panel * gridSize * gridSize;
          for (let row = 0; row < gridSize; row += 1)
            for (let column = 0; column < gridSize / 2; column += 1)
              if (
                bits[start + row * gridSize + column] !==
                bits[start + row * gridSize + (gridSize - 1 - column)]
              )
                return false;
          return true;
        });
        expect(symmetricPanels).toEqual([["A", "B", "C", "D"].indexOf(instance.answer)]);
      }
    }
  });

  it("constructs exactly one cell-wise XOR answer", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const instance = generateInstance("dense-xor", { seed, difficulty, variant: 0 });
        const gridSize = Number(instance.latent.gridSize);
        const inputA = instance.latent.inputA as number[];
        const inputB = instance.latent.inputB as number[];
        const candidates = instance.latent.candidateBits as number[];
        const expected = inputA.map((value, index) => value ^ inputB[index]!);
        const exactPanels = [0, 1, 2, 3].filter((panel) =>
          candidates
            .slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize)
            .every((value, index) => value === expected[index]),
        );
        expect(exactPanels).toEqual([["A", "B", "C", "D"].indexOf(instance.answer)]);
      }
    }
  });

  it("constructs exact pair-and-gate collision answers", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const instance = generateInstance("gated-pair-collision", { seed, difficulty, variant: 0 });
        const left = instance.latent.eventLeft as string[];
        const right = instance.latent.eventRight as string[];
        const gates = instance.latent.eventGates as string[];
        const targetPair = instance.latent.targetPair as string[];
        const targetGate = String(instance.latent.targetGate);
        const count = left.filter(
          (label, index) =>
            gates[index] === targetGate &&
            [label, right[index]!].sort().join("") === [...targetPair].sort().join(""),
        ).length;
        expect(count).toBe(Number(instance.answer));
      }
    }
  });

  it("adds independently insufficient gated distractors with difficulty", () => {
    for (const key of ["gated-frequency", "gated-pair-collision"] as const) {
      const easy = generateInstance(key, { seed: 8, difficulty: 0, variant: 0 });
      const hard = generateInstance(key, { seed: 8, difficulty: 100, variant: 0 });
      expect(Number(hard.latent.eventCount)).toBeGreaterThan(Number(easy.latent.eventCount));
      const trapKey = key === "gated-frequency" ? "wrongGateEchoCount" : "wrongGateTargetCount";
      expect(Number(easy.latent[trapKey])).toBe(0);
      expect(Number(hard.latent[trapKey])).toBeGreaterThan(0);
    }
  });

  it("constructs exact live temporal programs at every difficulty boundary", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const route = generateInstance("route-turn-integration", { seed, difficulty, variant: 0 });
        expect(countDirectionChanges(route.latent.path as number[])).toBe(Number(route.answer));

        const transition = generateInstance("target-transition-count", { seed, difficulty, variant: 0 });
        expect(countBlueToRedTransitions(transition.latent.sequence as number[])).toBe(
          Number(transition.answer),
        );

        const swaps = generateInstance("sequential-swap-tracking", { seed, difficulty, variant: 0 });
        expect(applySwapLedger(swaps)).toBe(Number(swaps.answer) - 1);

        const accumulator = generateInstance("signed-state-accumulation", { seed, difficulty, variant: 0 });
        expect((accumulator.latent.events as number[]).reduce((sum, value) => sum + value, 0)).toBe(
          Number(accumulator.answer),
        );
      }
    }
  });

  it("increases the temporal state-update burden with difficulty", () => {
    for (const key of [
      "route-turn-integration",
      "target-transition-count",
      "sequential-swap-tracking",
      "signed-state-accumulation",
    ] as const) {
      const easy = generateInstance(key, { seed: 8, difficulty: 0, variant: 0 });
      const hard = generateInstance(key, { seed: 8, difficulty: 100, variant: 0 });
      const measure =
        key === "route-turn-integration"
          ? "stepCount"
          : key === "sequential-swap-tracking"
            ? "swapCount"
            : "eventCount";
      expect(Number(hard.latent[measure])).toBeGreaterThan(Number(easy.latent[measure]));
    }
  });

  it("constructs exact live image programs at every difficulty boundary", () => {
    for (let seed = 0; seed < 24; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const parity = generateInstance("parity-verification", { seed, difficulty, variant: 0 });
        const gridSize = Number(parity.latent.gridSize);
        const panels = parity.latent.panelBits as number[];
        const validPanels = [0, 1, 2, 3].filter((panel) =>
          parityValid(panels.slice(panel * gridSize * gridSize, (panel + 1) * gridSize * gridSize), gridSize),
        );
        expect(validPanels).toEqual([["A", "B", "C", "D"].indexOf(parity.answer)]);

        const change = generateInstance("change-localization", { seed, difficulty, variant: 0 });
        const before = change.latent.glyphA as number[];
        const after = change.latent.glyphB as number[];
        const changed = before.flatMap((value, index) => (value === after[index] ? [] : [index]));
        expect(changed).toEqual([Number(change.latent.changedIndex)]);

        const maze = generateInstance("maze-reachability", { seed, difficulty, variant: 0 });
        const reachable = reachableCells(maze);
        const reachableAnswers = (maze.latent.endpointCells as number[]).flatMap((cell, index) =>
          reachable.has(cell) ? [["A", "B", "C", "D"][index]!] : [],
        );
        expect(reachableAnswers).toEqual([maze.answer]);

        const rotation = generateInstance("rotation-correspondence", { seed, difficulty, variant: 0 });
        const side = Number(rotation.latent.side);
        const pointCount = Number(rotation.latent.pointCount);
        const source = rotation.latent.sourcePoints as number[];
        const turns = Number(rotation.latent.quarterTurns);
        const expected = source.map((point) => rotatePoint(point, side, turns)).sort((a, b) => a - b);
        const candidates = rotation.latent.candidatePoints as number[];
        const exact = [0, 1, 2, 3].filter((panel) =>
          candidates
            .slice(panel * pointCount, (panel + 1) * pointCount)
            .sort((a, b) => a - b)
            .every((point, index) => point === expected[index]),
        );
        expect(exact).toEqual([["A", "B", "C", "D"].indexOf(rotation.answer)]);
      }
    }
  });

  it("increases live image search burden with difficulty", () => {
    const measurements = [
      ["parity-verification", "gridSize"],
      ["change-localization", "gridSize"],
      ["maze-reachability", "gridSize"],
      ["rotation-correspondence", "pointCount"],
    ] as const;
    for (const [key, measure] of measurements) {
      const easy = generateInstance(key, { seed: 8, difficulty: 0, variant: 0 });
      const hard = generateInstance(key, { seed: 8, difficulty: 100, variant: 0 });
      expect(Number(hard.latent[measure])).toBeGreaterThan(Number(easy.latent[measure]));
    }
  });

  it("constructs the final live image family oracles exactly", () => {
    for (let seed = 0; seed < 24; seed += 1)
      for (const difficulty of [0, 50, 100]) {
        const wire = generateInstance("wire-crossing-count", { seed, difficulty, variant: 0 });
        expect((wire.latent.crossingX as number[]).length).toBe(Number(wire.answer));
        expect((wire.latent.crossingY as number[]).length).toBe(Number(wire.answer));

        const enclosure = generateInstance("enclosure-depth", { seed, difficulty, variant: 0 });
        const matchingDepths = (enclosure.latent.panelDepths as number[]).flatMap((depth, index) =>
          depth === Number(enclosure.latent.targetDepth) ? [["A", "B", "C", "D"][index]!] : [],
        );
        expect(matchingDepths).toEqual([enclosure.answer]);

        const cubes = generateInstance("cube-stack-count", { seed, difficulty, variant: 0 });
        const heights = cubes.latent.panelHeights as number[];
        const totals = [0, 1, 2, 3].map((panel) =>
          heights.slice(panel * 9, (panel + 1) * 9).reduce((sum, value) => sum + value, 0),
        );
        expect(totals).toEqual(cubes.latent.panelTotals);
        expect(
          totals.flatMap((total, index) =>
            total === Number(cubes.latent.targetTotal) ? [["A", "B", "C", "D"][index]!] : [],
          ),
        ).toEqual([cubes.answer]);

        const graph = generateInstance("graph-degree-topology", { seed, difficulty, variant: 0 });
        const edgeFrom = graph.latent.edgeFrom as number[],
          edgeTo = graph.latent.edgeTo as number[],
          offsets = graph.latent.edgeOffsets as number[],
          nodeCount = Number(graph.latent.nodeCount);
        const oddCounts = [0, 1, 2, 3].map((panel) => {
          const degrees = Array.from({ length: nodeCount }, () => 0);
          for (let edge = offsets[panel]!; edge < offsets[panel + 1]!; edge += 1) {
            degrees[edgeFrom[edge]!]! += 1;
            degrees[edgeTo[edge]!]! += 1;
          }
          return degrees.filter((degree) => degree % 2 === 1).length;
        });
        expect(oddCounts).toEqual(graph.latent.panelOddCounts);
        expect(
          oddCounts.flatMap((count, index) => (count === 2 ? [["A", "B", "C", "D"][index]!] : [])),
        ).toEqual([graph.answer]);
      }
  });

  it("constructs the final live video family oracles exactly", () => {
    for (let seed = 0; seed < 24; seed += 1)
      for (const difficulty of [0, 50, 100]) {
        const zone = generateInstance("zone-entry-count", { seed, difficulty, variant: 0 });
        expect(Number(zone.answer)).toBe(Number(zone.latent.cycles) * 2);

        const flash = generateInstance("selective-flash-count", { seed, difficulty, variant: 0 });
        expect((flash.latent.flashObjects as number[]).filter((object) => object === 0)).toHaveLength(
          Number(flash.answer),
        );

        const conservation = generateInstance("conservation-ledger", { seed, difficulty, variant: 0 });
        const counts = [...(conservation.latent.initialCounts as number[])];
        const from = conservation.latent.transferFrom as number[],
          to = conservation.latent.transferTo as number[];
        for (let event = 0; event < from.length; event += 1) {
          counts[from[event]!]! -= 1;
          counts[to[event]!]! += 1;
        }
        expect(counts).toEqual(conservation.latent.finalCounts);
        expect(["A", "B", "C", "D"][counts.indexOf(Math.max(...counts))]).toBe(conservation.answer);

        const trail = generateInstance("trajectory-intersections", { seed, difficulty, variant: 0 });
        expect(countIntersections(trail.latent.path as number[])).toBe(Number(trail.answer));
        if (difficulty === 100) expect(Number(trail.answer)).toBeGreaterThanOrEqual(3);
      }
  });

  it("increases the final family burdens with difficulty", () => {
    const measurements = [
      ["wire-crossing-count", "crossingCount"],
      ["enclosure-depth", "targetDepth"],
      ["cube-stack-count", "maximumHeight"],
      ["graph-degree-topology", "nodeCount"],
      ["zone-entry-count", "distractorCount"],
      ["selective-flash-count", "distractorCount"],
      ["conservation-ledger", "transferCount"],
      ["trajectory-intersections", "segmentCount"],
    ] as const;
    for (const [key, measure] of measurements) {
      const easy = generateInstance(key, { seed: 8, difficulty: 0, variant: 0 });
      const hard = generateInstance(key, { seed: 8, difficulty: 100, variant: 0 });
      expect(Number(hard.latent[measure])).toBeGreaterThan(Number(easy.latent[measure]));
    }
  });

  it("makes symmetry denser and defects sparser with difficulty", () => {
    const easy = generateInstance("dense-symmetry", { seed: 8, difficulty: 0, variant: 0 });
    const hard = generateInstance("dense-symmetry", { seed: 8, difficulty: 100, variant: 0 });
    expect(Number(hard.latent.gridSize)).toBeGreaterThan(Number(easy.latent.gridSize));
    expect(Number(hard.latent.defectCount)).toBeLessThan(Number(easy.latent.defectCount));
  });

  it("makes XOR denser and distractors closer with difficulty", () => {
    const easy = generateInstance("dense-xor", { seed: 8, difficulty: 0, variant: 0 });
    const hard = generateInstance("dense-xor", { seed: 8, difficulty: 100, variant: 0 });
    expect(Number(hard.latent.gridSize)).toBeGreaterThan(Number(easy.latent.gridSize));
    expect(Number(hard.latent.distractorFlips)).toBeLessThan(Number(easy.latent.distractorFlips));
  });

  it("constructs true minimal pairs for brief events and attribute binding", () => {
    const present = generateInstance("brief-event", { seed: 20, difficulty: 50, variant: 0 });
    const absent = generateInstance("brief-event", { seed: 21, difficulty: 50, variant: 0 });
    expect(present.latent.eventStartMs).toBe(absent.latent.eventStartMs);
    expect(present.latent.durationMs).toBe(absent.latent.durationMs);
    expect(present.answer).not.toBe(absent.answer);

    const bindingA = generateInstance("attribute-binding", { seed: 20, difficulty: 50, variant: 0 });
    const bindingB = generateInstance("attribute-binding", { seed: 20, difficulty: 50, variant: 1 });
    expect(bindingA.latent.shapes).toEqual(bindingB.latent.shapes);
    expect(new Set(bindingA.latent.colors as string[])).toEqual(new Set(bindingB.latent.colors as string[]));
    expect(bindingA.question).toBe(bindingB.question);
    expect(bindingA.answer).not.toBe(bindingB.answer);
  });

  it("keeps every counted flash inside the rendered clip", () => {
    for (let seed = 0; seed < 70; seed += 1) {
      for (const difficulty of [0, 50, 100]) {
        const instance = generateInstance("event-counting", { seed, difficulty, variant: 0 });
        const count = Number(instance.latent.count);
        const lastFlash =
          Number(instance.latent.firstFlashAtMs) +
          (count - 1) * Number(instance.latent.intervalMs) +
          Number(instance.latent.flashDurationMs);
        expect(lastFlash).toBeLessThanOrEqual(Number(instance.latent.videoDurationMs));
      }
    }
  });

  it("difficulty monotonically reduces target scale and event duration", () => {
    const easyObject = generateInstance("small-object", { seed: 4, difficulty: 0, variant: 0 });
    const hardObject = generateInstance("small-object", { seed: 4, difficulty: 100, variant: 0 });
    expect(Number(easyObject.latent.size)).toBeGreaterThan(Number(hardObject.latent.size));
    const easyEvent = generateInstance("brief-event", { seed: 4, difficulty: 0, variant: 0 });
    const hardEvent = generateInstance("brief-event", { seed: 4, difficulty: 100, variant: 0 });
    expect(Number(easyEvent.latent.durationMs)).toBeGreaterThan(Number(hardEvent.latent.durationMs));
  });

  it("difficulty changes rendered evidence for every diagnostic", () => {
    for (const key of keys) {
      const easy = generateInstance(key, { seed: 4, difficulty: 0, variant: 0 });
      const hard = generateInstance(key, { seed: 4, difficulty: 100, variant: 0 });
      const renderSweep = (instance: typeof easy) =>
        Array.from({ length: 31 }, (_, index) => renderDiagnosticSvg(instance, index / 30)).join("\n");
      expect(renderSweep(easy)).not.toBe(renderSweep(hard));
    }
  });

  it("explains the concrete burden behind every difficulty value", () => {
    for (const key of keys) {
      const easy = generateInstance(key, { seed: 4, difficulty: 0, variant: 0 });
      const hard = generateInstance(key, { seed: 4, difficulty: 100, variant: 0 });
      expect(diagnosticBurdenSummary(easy).length).toBeGreaterThan(8);
      expect(diagnosticBurdenSummary(hard)).not.toBe(diagnosticBurdenSummary(easy));
    }
  });
});
