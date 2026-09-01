import type { DiagnosticInstance, DiagnosticParams, GeneratorKey } from "./types";

export const generatorVersion = "1.6.0";

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const colors = ["cobalt", "vermillion", "violet", "teal"] as const;
const shapes = ["circle", "square", "triangle", "diamond"] as const;

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)]!;
}

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}

function base(generator: GeneratorKey, params: DiagnosticParams) {
  return { generator, seed: params.seed, params };
}

const cardinalDirections = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
] as const;

function countDirectionChanges(path: readonly number[]) {
  let turns = 0;
  for (let index = 4; index < path.length; index += 2) {
    const previousX = path[index - 2]! - path[index - 4]!;
    const previousY = path[index - 1]! - path[index - 3]!;
    const currentX = path[index]! - path[index - 2]!;
    const currentY = path[index + 1]! - path[index - 1]!;
    if (previousX !== currentX || previousY !== currentY) turns += 1;
  }
  return turns;
}

function makeTurnPath(random: () => number, steps: number, targetTurns: number) {
  const runLengths = Array.from({ length: targetTurns + 1 }, () => 1);
  for (let remaining = steps - runLengths.length; remaining > 0; remaining -= 1)
    runLengths[Math.floor(random() * runLengths.length)]! += 1;
  const side = 16;
  const center = (side - 1) / 2;
  let x = 7;
  let y = 7;
  let direction = Math.floor(random() * 4);
  const path = [x, y];
  for (const [runIndex, runLength] of runLengths.entries()) {
    if (runIndex > 0) {
      const candidates = [(direction + 1) % 4, (direction + 3) % 4];
      direction = candidates
        .map((candidate) => {
          const [dx, dy] = cardinalDirections[candidate]!;
          const endX = x + dx * runLength;
          const endY = y + dy * runLength;
          const outsidePenalty = endX < 1 || endX > side - 2 || endY < 1 || endY > side - 2 ? 100 : 0;
          return {
            candidate,
            score: outsidePenalty + Math.abs(endX - center) + Math.abs(endY - center) + random() * 0.1,
          };
        })
        .sort((a, b) => a.score - b.score)[0]!.candidate;
    }
    const [dx, dy] = cardinalDirections[direction]!;
    for (let step = 0; step < runLength; step += 1) {
      x += dx;
      y += dy;
      path.push(x, y);
    }
  }
  return path;
}

function countTargetTransitions(sequence: readonly number[]) {
  let count = 0;
  for (let index = 1; index < sequence.length; index += 1)
    if (sequence[index - 1] === 0 && sequence[index] === 2) count += 1;
  return count;
}

function makeTargetTransitionSequence(random: () => number, length: number, targetCount: number) {
  const sequence: number[] = Array.from({ length }, () => (random() < 0.5 ? 1 : 3));
  const candidateStarts = shuffled(
    Array.from({ length: Math.floor(length / 2) }, (_, index) => index * 2),
    random,
  ).slice(0, targetCount);
  for (const start of candidateStarts) {
    sequence[start] = 0;
    sequence[start + 1] = 2;
  }
  return sequence;
}

function makeEvenParityMatrix(random: () => number, gridSize: number) {
  const bits = Array.from({ length: gridSize * gridSize }, () => 0);
  for (let row = 0; row < gridSize - 1; row += 1) {
    for (let column = 0; column < gridSize - 1; column += 1)
      bits[row * gridSize + column] = random() < 0.5 ? 1 : 0;
    const rowSum = bits
      .slice(row * gridSize, row * gridSize + gridSize - 1)
      .reduce((sum, bit) => sum + bit, 0);
    bits[row * gridSize + gridSize - 1] = rowSum % 2;
  }
  for (let column = 0; column < gridSize - 1; column += 1) {
    let columnSum = 0;
    for (let row = 0; row < gridSize - 1; row += 1) columnSum += bits[row * gridSize + column]!;
    bits[(gridSize - 1) * gridSize + column] = columnSum % 2;
  }
  const finalRowSum = bits
    .slice((gridSize - 1) * gridSize, gridSize * gridSize - 1)
    .reduce((sum, bit) => sum + bit, 0);
  bits[gridSize * gridSize - 1] = finalRowSum % 2;
  return bits;
}

function rotateGridPoint(index: number, side: number, quarterTurns: number) {
  let x = index % side;
  let y = Math.floor(index / side);
  for (let turn = 0; turn < quarterTurns; turn += 1) [x, y] = [side - 1 - y, x];
  return y * side + x;
}

export function generateInstance(generator: GeneratorKey, params: DiagnosticParams): DiagnosticInstance {
  const random = mulberry32(params.seed * 1009 + params.variant * 9176 + generator.length * 37);
  const difficulty = Math.max(0, Math.min(100, params.difficulty));

  switch (generator) {
    case "small-object": {
      const target = shapes[(params.seed + params.variant) % shapes.length]!;
      const targetColor = pick(colors, random);
      const size = Math.round(30 - difficulty * 0.22);
      const x = 14 + Math.round(random() * 72);
      const y = 14 + Math.round(random() * 72);
      return {
        ...base(generator, params),
        question: `What shape is the tiny ${targetColor} mark?`,
        answer: target,
        answerOptions: shuffled(shapes, random),
        latent: { target, targetColor, size, x, y, distractors: 18 },
        minimalPairDescription:
          "Only the target’s pixel size changes; identity, contrast, scene, and question remain fixed.",
      };
    }
    case "patch-phase": {
      const offset = params.variant % 14;
      const relation = params.seed % 2 === 0 ? "overlap" : "do not overlap";
      const strokeWidth = Number((4 - difficulty * 0.025).toFixed(2));
      return {
        ...base(generator, params),
        question: "Do the two outlined circles overlap?",
        answer: relation === "overlap" ? "yes" : "no",
        answerOptions: ["yes", "no"],
        latent: {
          offset,
          patchSize: 14,
          relation,
          separation: relation === "overlap" ? 31 : 41,
          strokeWidth,
        },
        minimalPairDescription:
          "The complete drawing shifts relative to a 14-pixel reference grid; geometry and answer do not change.",
      };
    }
    case "attribute-binding": {
      const pairRandom = mulberry32(params.seed * 1009 + generator.length * 37);
      const orderedShapes = shuffled(shapes, pairRandom);
      const targetIndex = params.seed % orderedShapes.length;
      const balancedTargetColor = colors[params.seed % colors.length]!;
      const otherColors = shuffled(
        colors.filter((color) => color !== balancedTargetColor),
        pairRandom,
      );
      const baseColors = Array.from({ length: colors.length }, (_, index) =>
        index === targetIndex ? balancedTargetColor : otherColors.shift()!,
      );
      const shift = params.variant % baseColors.length;
      const orderedColors = baseColors.map((_, index) => baseColors[(index + shift) % baseColors.length]!);
      const target = orderedShapes[targetIndex]!;
      const answer = orderedColors[targetIndex]!;
      const itemSize = Number((24 - difficulty * 0.1).toFixed(2));
      return {
        ...base(generator, params),
        question: `What colour is the ${target}?`,
        answer,
        answerOptions: shuffled(colors, random),
        latent: { shapes: orderedShapes, colors: orderedColors, target, targetIndex, itemSize },
        minimalPairDescription:
          "A paired seed permutes colours between fixed objects while preserving the same inventory of shapes and colours.",
      };
    }
    case "numerosity-density": {
      const count = 3 + ((params.seed + params.variant) % 7);
      const totalArea = 2100;
      const radius = Math.sqrt(totalArea / count / Math.PI);
      const spread = Number((32 - difficulty * 0.16).toFixed(2));
      return {
        ...base(generator, params),
        question: "How many violet circles are present?",
        answer: String(count),
        answerOptions: shuffled(
          [String(count), String(Math.max(1, count - 1)), String(count + 1), String(count + 2)],
          random,
        ),
        latent: { count, radius: Number(radius.toFixed(2)), totalArea, density: difficulty, spread },
        minimalPairDescription:
          "Count varies while total coloured area is held approximately constant, separating numerosity from visual mass.",
      };
    }
    case "brief-event": {
      const durationMs = Math.round(900 - difficulty * 8.4);
      const eventStartMs = 1000 + ((Math.floor(params.seed / 2) * 131 + params.variant * 233) % 2400);
      const eventPresent = params.seed % 2 === 0;
      return {
        ...base(generator, params),
        question: "Does the moving ball ever flash purple?",
        answer: eventPresent ? "yes" : "no",
        answerOptions: ["yes", "no"],
        latent: { durationMs, eventStartMs, eventPresent, videoDurationMs: 5000, fps: 30 },
        minimalPairDescription:
          "The paired clip differs only in whether the brief purple state is rendered; timing and trajectory are identical.",
      };
    }
    case "event-order": {
      const order = params.seed % 2 === 0 ? ["square", "circle"] : ["circle", "square"];
      const firstAtMs = 1200;
      const eventGapMs = 2000 - difficulty * 12;
      return {
        ...base(generator, params),
        question: "Which shape flashed first?",
        answer: order[0]!,
        answerOptions: ["circle", "square"],
        latent: {
          order,
          firstAtMs,
          secondAtMs: firstAtMs + eventGapMs,
          eventGapMs,
          videoDurationMs: 4500,
        },
        minimalPairDescription:
          "The paired clip contains identical frames and events in exactly reversed temporal order.",
      };
    }
    case "identity-occlusion": {
      const swap = params.seed % 2 === 0;
      const occlusionMs = 500 + difficulty * 16;
      const occlusionHalfWindow = Number((0.12 + difficulty * 0.0014).toFixed(3));
      return {
        ...base(generator, params),
        question: "After emerging, is the blue ball above the red ball?",
        answer: swap ? "no" : "yes",
        answerOptions: ["yes", "no"],
        latent: {
          swap,
          occlusionMs,
          occlusionHalfWindow,
          videoDurationMs: 6000,
          identities: ["blue", "red"],
        },
        minimalPairDescription:
          "The exit trajectories swap while entry trajectories, occluder, timing, and final positions remain controlled.",
      };
    }
    case "event-counting": {
      const count = 2 + ((params.seed + params.variant) % 7);
      const videoDurationMs = 5200;
      const firstFlashAtMs = 700;
      const requestedIntervalMs = Math.max(180, 700 - difficulty * 5);
      const latestSafeIntervalMs = (videoDurationMs - firstFlashAtMs - 500) / Math.max(1, count - 1);
      const intervalMs = Math.floor(Math.min(requestedIntervalMs, latestSafeIntervalMs));
      const flashDurationMs = Math.floor(Math.max(70, intervalMs * 0.3));
      return {
        ...base(generator, params),
        question: "How many times does the central light flash?",
        answer: String(count),
        answerOptions: shuffled(
          [String(count), String(Math.max(1, count - 1)), String(count + 1), String(count + 2)],
          random,
        ),
        latent: { count, firstFlashAtMs, intervalMs, flashDurationMs, videoDurationMs },
        minimalPairDescription:
          "Count changes while total video duration, scene, flash appearance, and answer distribution remain controlled.",
      };
    }
    case "dense-symmetry": {
      const gridSize = 8 + Math.floor(difficulty / 20) * 2;
      const correctPanel = (params.seed + params.variant) % 4;
      const defectCount = Math.max(1, 4 - Math.floor(difficulty / 34));
      const panels: number[][] = [];
      for (let panel = 0; panel < 4; panel += 1) {
        const bits = Array.from({ length: gridSize * gridSize }, () => 0);
        for (let row = 0; row < gridSize; row += 1)
          for (let column = 0; column < gridSize / 2; column += 1) {
            const value = random() < 0.38 ? 1 : 0;
            bits[row * gridSize + column] = value;
            bits[row * gridSize + (gridSize - 1 - column)] = value;
          }
        if (panel !== correctPanel) {
          const available = shuffled(
            Array.from({ length: gridSize * (gridSize / 2) }, (_, index) => ({
              row: Math.floor(index / (gridSize / 2)),
              column: gridSize / 2 + (index % (gridSize / 2)),
            })),
            random,
          );
          for (const { row, column } of available.slice(0, defectCount)) {
            const index = row * gridSize + column;
            bits[index] = bits[index] === 1 ? 0 : 1;
          }
        }
        panels.push(bits);
      }
      return {
        ...base(generator, params),
        question: "Which panel is EXACTLY symmetric across its vertical center line?",
        answer: ["A", "B", "C", "D"][correctPanel]!,
        answerOptions: shuffled(["A", "B", "C", "D"], random),
        latent: {
          gridSize,
          correctPanel,
          defectCount,
          panelBits: panels.flat(),
        },
        minimalPairDescription:
          "Difficulty increases the grid density and reduces each distractor to one sparse symmetry defect; panel labels and exact mirrored construction stay fixed.",
      };
    }
    case "dense-xor": {
      const gridSize = 8 + Math.floor(difficulty / 17) * 2;
      const correctPanel = (params.seed + params.variant) % 4;
      const distractorFlips = Math.max(1, 5 - Math.floor(difficulty / 25));
      const inputA = Array.from({ length: gridSize * gridSize }, () => (random() < 0.45 ? 1 : 0));
      const inputB = Array.from({ length: gridSize * gridSize }, () => (random() < 0.45 ? 1 : 0));
      const xor = inputA.map((value, index) => value ^ inputB[index]!);
      const candidates = Array.from({ length: 4 }, (_, panel) => {
        const bits = [...xor];
        if (panel !== correctPanel) {
          const indices = shuffled(
            Array.from({ length: bits.length }, (_, index) => index),
            random,
          ).slice(0, distractorFlips);
          for (const index of indices) bits[index] = bits[index] === 1 ? 0 : 1;
        }
        return bits;
      });
      return {
        ...base(generator, params),
        question: "Which candidate grid is the cell-by-cell XOR of INPUT 1 and INPUT 2?",
        answer: ["A", "B", "C", "D"][correctPanel]!,
        answerOptions: shuffled(["A", "B", "C", "D"], random),
        latent: {
          gridSize,
          correctPanel,
          distractorFlips,
          inputA,
          inputB,
          candidateBits: candidates.flat(),
        },
        minimalPairDescription:
          "Difficulty increases grid density and reduces each wrong candidate toward a one-cell near miss; the Boolean rule and exact construction oracle do not change.",
      };
    }
    case "gated-frequency": {
      const qualifyingCount = 2 + ((params.seed + params.variant) % 4);
      const targetGate = params.seed % 2 === 0 ? "AMBER" : "CYAN";
      const otherGate = targetGate === "AMBER" ? "CYAN" : "AMBER";
      const targetEventCount = Math.max(qualifyingCount * 2, 10 + Math.round(difficulty / 10));
      const otherEventCount = Math.round(difficulty / 5);
      const cells = shuffled(
        Array.from({ length: 36 }, (_, index) => index),
        random,
      );
      const qualifyingCells = cells.slice(0, qualifyingCount);
      const singletonCells = cells.slice(
        qualifyingCount,
        qualifyingCount + targetEventCount - qualifyingCount * 2,
      );
      const targetCells = shuffled([...qualifyingCells, ...qualifyingCells, ...singletonCells], random);
      const targetCellSet = new Set([...qualifyingCells, ...singletonCells]);
      const wrongGateEchoCount = Math.min(8, otherEventCount, targetCellSet.size);
      const echoedCells = shuffled([...targetCellSet], random).slice(0, wrongGateEchoCount);
      const untouchedCells = cells.filter((cell) => !targetCellSet.has(cell));
      const otherCells = [
        ...echoedCells,
        ...shuffled(untouchedCells, random).slice(0, otherEventCount - wrongGateEchoCount),
      ];
      const events = shuffled(
        [
          ...targetCells.map((cell) => ({ cell, gate: targetGate })),
          ...otherCells.map((cell) => ({ cell, gate: otherGate })),
        ],
        random,
      );
      return {
        ...base(generator, params),
        question: `How many DIFFERENT grid cells flashed EXACTLY TWICE during ${targetGate} frames?`,
        answer: String(qualifyingCount),
        answerOptions: shuffled(["2", "3", "4", "5"], random),
        latent: {
          targetGate,
          otherGate,
          targetMultiplicity: 2,
          qualifyingCount,
          eventCells: events.map((event) => event.cell),
          eventGates: events.map((event) => event.gate),
          eventCount: events.length,
          wrongGateEchoCount,
          videoDurationMs: events.length * 500 + 1_000,
        },
        minimalPairDescription:
          "Difficulty adds wrong-colour echoes and longer event streams while the target multiplicity, grid, labels, and exact oracle remain fixed.",
      };
    }
    case "gated-pair-collision": {
      const labels = ["A", "B", "C", "D"];
      const pairs = [
        ["A", "B"],
        ["A", "C"],
        ["A", "D"],
        ["B", "C"],
        ["B", "D"],
        ["C", "D"],
      ];
      const targetPair = pairs[params.seed % pairs.length]!;
      const targetGate = Math.floor(params.seed / pairs.length) % 2 === 0 ? "AMBER" : "CYAN";
      const otherGate = targetGate === "AMBER" ? "CYAN" : "AMBER";
      const targetCount = 3 + ((params.seed + params.variant) % 4);
      const eventCount = 12 + Math.round((difficulty / 100) * 20);
      const wrongGateTargetCount = Math.min(6, eventCount - targetCount, Math.round(difficulty * 0.06));
      const distractorPairs = pairs.filter((pair) => pair.join("") !== targetPair.join(""));
      const events = [
        ...Array.from({ length: targetCount }, () => ({ pair: targetPair, gate: targetGate })),
        ...Array.from({ length: wrongGateTargetCount }, () => ({ pair: targetPair, gate: otherGate })),
      ];
      while (events.length < eventCount) {
        const pair = pick(distractorPairs, random);
        const gate = events.length % 2 === 0 ? targetGate : otherGate;
        events.push({ pair, gate });
      }
      const ordered = shuffled(events, random);
      return {
        ...base(generator, params),
        question: `How many ${targetPair.join("+")} collisions occurred during ${targetGate} frames?`,
        answer: String(targetCount),
        answerOptions: shuffled(["3", "4", "5", "6"], random),
        latent: {
          targetPair,
          targetGate,
          otherGate,
          targetCount,
          eventLeft: ordered.map((event) => event.pair[0]!),
          eventRight: ordered.map((event) => event.pair[1]!),
          eventGates: ordered.map((event) => event.gate),
          eventCount: ordered.length,
          wrongGateTargetCount,
          videoDurationMs: ordered.length * 500 + 1_000,
          labels,
        },
        minimalPairDescription:
          "Difficulty adds events and target-pair collisions under the wrong frame colour; pair identity, gate identity, and their conjunction remain construction-grounded.",
      };
    }
    case "route-turn-integration": {
      const stepCount = 16 + Math.round((difficulty / 100) * 24);
      const turnCount = Math.floor(stepCount / 2) + ((params.seed + params.variant) % 4);
      const path = makeTurnPath(random, stepCount, turnCount);
      const derivedTurnCount = countDirectionChanges(path);
      const answerOptions = Array.from({ length: 4 }, (_, index) =>
        String(Math.floor(stepCount / 2) + index),
      );
      return {
        ...base(generator, params),
        question: "How many times does the moving gold disk CHANGE DIRECTION during the complete route?",
        answer: String(derivedTurnCount),
        answerOptions: shuffled(answerOptions, random),
        latent: {
          stepCount,
          turnCount: derivedTurnCount,
          path,
          videoDurationMs: stepCount * 400 + 1_600,
        },
        minimalPairDescription:
          "Difficulty lengthens the invisible route while the exact turn oracle is recomputed from every consecutive displacement.",
      };
    }
    case "target-transition-count": {
      const eventCount = 16 + Math.round((difficulty / 100) * 16);
      const targetCount = 3 + ((params.seed + params.variant) % 4);
      const sequence = makeTargetTransitionSequence(random, eventCount, targetCount);
      const derivedTargetCount = countTargetTransitions(sequence);
      return {
        ...base(generator, params),
        question:
          "How many times is a BLUE CIRCLE immediately followed by a RED SQUARE in the complete sequence?",
        answer: String(derivedTargetCount),
        answerOptions: shuffled(["3", "4", "5", "6"], random),
        latent: {
          eventCount,
          targetCount: derivedTargetCount,
          sequence,
          videoDurationMs: eventCount * 360 + 1_600,
        },
        minimalPairDescription:
          "Difficulty lengthens the symbol stream; the target transition and construction-derived count remain exact.",
      };
    }
    case "sequential-swap-tracking": {
      const swapCount = 4 + Math.round((difficulty / 100) * 8);
      const initialTarget = (params.seed + params.variant) % 4;
      const targetFinal = (Math.floor(params.seed / 4) + params.variant) % 4;
      const swapLeft: number[] = [];
      const swapRight: number[] = [];
      let position = initialTarget;
      for (let index = 0; index < swapCount - 1; index += 1) {
        const left = Math.floor(random() * 4);
        let right = Math.floor(random() * 3);
        if (right >= left) right += 1;
        swapLeft.push(left);
        swapRight.push(right);
        if (position === left) position = right;
        else if (position === right) position = left;
      }
      if (position === targetFinal) {
        const left = (position + 1) % 4;
        const right = (position + 2) % 4;
        swapLeft.push(left);
        swapRight.push(right);
      } else {
        swapLeft.push(position);
        swapRight.push(targetFinal);
      }
      return {
        ...base(generator, params),
        question: `Which numbered slot contains the token that began gold after all ${swapCount} swaps?`,
        answer: String(targetFinal + 1),
        answerOptions: shuffled(["1", "2", "3", "4"], random),
        latent: {
          initialTarget,
          targetFinal,
          swapCount,
          swapLeft,
          swapRight,
          videoDurationMs: swapCount * 950 + 1_800,
        },
        minimalPairDescription:
          "Difficulty increases the number of explicit pairwise permutation updates while the final identity is computed from the complete swap ledger.",
      };
    }
    case "signed-state-accumulation": {
      const eventCount = 21 + Math.round((difficulty / 100) * 20) * 2;
      const targets = [-9, -3, 3, 9] as const;
      const finalBalance = targets[(params.seed + params.variant) % targets.length]!;
      const positiveCount = (eventCount + finalBalance) / 2;
      const events = shuffled(
        [
          ...Array.from({ length: positiveCount }, () => 1),
          ...Array.from({ length: eventCount - positiveCount }, () => -1),
        ],
        random,
      );
      return {
        ...base(generator, params),
        question: "Starting from ZERO, where does the hidden counter end after every +1 and −1 event?",
        answer: finalBalance > 0 ? `+${finalBalance}` : String(finalBalance),
        answerOptions: shuffled(["-9", "-3", "+3", "+9"], random),
        latent: {
          eventCount,
          finalBalance,
          events,
          videoDurationMs: eventCount * 260 + 1_600,
        },
        minimalPairDescription:
          "Difficulty lengthens the signed event stream while its exact sum and balanced four-way endpoint remain construction-grounded.",
      };
    }
    case "parity-verification": {
      const gridSize = 6 + Math.floor(difficulty / 20) * 2;
      const correctPanel = (params.seed + params.variant) % 4;
      const defectCount = Math.max(1, 5 - Math.floor(difficulty / 25));
      const panels = Array.from({ length: 4 }, (_, panel) => {
        const bits = makeEvenParityMatrix(random, gridSize);
        if (panel !== correctPanel) {
          const row = Math.floor(random() * gridSize);
          const start = Math.floor(random() * gridSize);
          for (let defect = 0; defect < defectCount; defect += 1) {
            const column = (start + defect) % gridSize;
            const index = row * gridSize + column;
            bits[index] = bits[index] === 1 ? 0 : 1;
          }
        }
        return bits;
      });
      return {
        ...base(generator, params),
        question: "Which panel has an EVEN number of dark cells in EVERY row AND EVERY column?",
        answer: ["A", "B", "C", "D"][correctPanel]!,
        answerOptions: shuffled(["A", "B", "C", "D"], random),
        latent: { gridSize, correctPanel, defectCount, panelBits: panels.flat() },
        minimalPairDescription:
          "Difficulty increases matrix size and reduces each distractor toward a one-bit parity corruption; the row-and-column oracle remains exact.",
      };
    }
    case "change-localization": {
      const gridSize = 8 + Math.floor(difficulty / 20) * 4;
      const correctRegion = (params.seed + params.variant) % 4;
      const glyphA = Array.from({ length: gridSize * gridSize }, () => Math.floor(random() * 4));
      const half = gridSize / 2;
      const regionRow = correctRegion >= 2 ? 1 : 0;
      const regionColumn = correctRegion % 2;
      const changedRow = regionRow * half + Math.floor(random() * half);
      const changedColumn = regionColumn * half + Math.floor(random() * half);
      const changedIndex = changedRow * gridSize + changedColumn;
      const glyphB = [...glyphA];
      glyphB[changedIndex] = (glyphB[changedIndex]! + 1 + Math.floor(random() * 3)) % 4;
      return {
        ...base(generator, params),
        question: "Exactly one glyph changed between LEFT and RIGHT. Which labeled region contains it?",
        answer: ["A", "B", "C", "D"][correctRegion]!,
        answerOptions: shuffled(["A", "B", "C", "D"], random),
        latent: { gridSize, correctRegion, changedIndex, glyphA, glyphB },
        minimalPairDescription:
          "Difficulty increases the registered grid density while exactly one construction-indexed glyph changes.",
      };
    }
    case "maze-reachability": {
      const gridSize = 6 + Math.floor(difficulty / 20);
      const cellCount = gridSize * gridSize;
      const edges: Array<[number, number]> = [];
      for (let row = 0; row < gridSize; row += 1)
        for (let column = 0; column < gridSize; column += 1) {
          const cell = row * gridSize + column;
          if (column + 1 < gridSize) edges.push([cell, cell + 1]);
          if (row + 1 < gridSize) edges.push([cell, cell + gridSize]);
        }
      const parent = Array.from({ length: cellCount }, (_, index) => index);
      const find = (input: number): number => {
        let current = input;
        while (parent[current] !== current) {
          parent[current] = parent[parent[current]!]!;
          current = parent[current]!;
        }
        return current;
      };
      const join = (left: number, right: number) => {
        const rootLeft = find(left);
        const rootRight = find(right);
        if (rootLeft === rootRight) return false;
        parent[rootRight] = rootLeft;
        return true;
      };
      const openRight = Array.from({ length: cellCount }, () => 0);
      const openDown = Array.from({ length: cellCount }, () => 0);
      let components = cellCount;
      for (const [left, right] of shuffled(edges, random)) {
        if (components <= 5) break;
        if (!join(left, right)) continue;
        components -= 1;
        if (right === left + 1) openRight[left] = 1;
        else openDown[left] = 1;
      }
      const groups = new Map<number, number[]>();
      for (let cell = 0; cell < cellCount; cell += 1) {
        const root = find(cell);
        groups.set(root, [...(groups.get(root) ?? []), cell]);
      }
      const orderedGroups = [...groups.values()].sort((left, right) => right.length - left.length);
      const mainGroup = shuffled(orderedGroups[0]!, random);
      const startCell = mainGroup[0]!;
      const correctCell = [...mainGroup.slice(1)].sort(
        (left, right) =>
          Math.abs((right % gridSize) - (startCell % gridSize)) +
          Math.abs(Math.floor(right / gridSize) - Math.floor(startCell / gridSize)) -
          Math.abs((left % gridSize) - (startCell % gridSize)) -
          Math.abs(Math.floor(left / gridSize) - Math.floor(startCell / gridSize)),
      )[0]!;
      const correctPanel = (params.seed + params.variant) % 4;
      const endpointCells = Array.from({ length: 4 }, (_, panel) =>
        panel === correctPanel
          ? correctCell
          : pick(orderedGroups[panel < correctPanel ? panel + 1 : panel]!, random),
      );
      return {
        ...base(generator, params),
        question: "Which labeled endpoint is reachable from S without crossing a wall?",
        answer: ["A", "B", "C", "D"][correctPanel]!,
        answerOptions: shuffled(["A", "B", "C", "D"], random),
        latent: { gridSize, startCell, correctPanel, endpointCells, openRight, openDown },
        minimalPairDescription:
          "Difficulty increases the maze graph size; endpoint membership is derived from disconnected components rather than local appearance.",
      };
    }
    case "rotation-correspondence": {
      const side = 7;
      const pointCount = 5 + Math.floor(difficulty / 13);
      const quarterTurns = 1 + ((params.seed + params.variant) % 3);
      const correctPanel = (Math.floor(params.seed / 3) + params.variant) % 4;
      const defectCount = Math.max(1, 4 - Math.floor(difficulty / 34));
      const sourcePoints = shuffled(
        Array.from({ length: side * side }, (_, index) => index),
        random,
      ).slice(0, pointCount);
      const rotated = sourcePoints.map((point) => rotateGridPoint(point, side, quarterTurns));
      const candidates = Array.from({ length: 4 }, (_, panel) => {
        const points = [...rotated];
        if (panel !== correctPanel) {
          const occupied = new Set(points);
          const replacements = shuffled(
            Array.from({ length: side * side }, (_, index) => index).filter((index) => !occupied.has(index)),
            random,
          );
          const replaceIndices = shuffled(
            Array.from({ length: points.length }, (_, index) => index),
            random,
          ).slice(0, defectCount);
          for (const [replacementIndex, pointIndex] of replaceIndices.entries())
            points[pointIndex] = replacements[replacementIndex]!;
        }
        return points;
      });
      return {
        ...base(generator, params),
        question:
          "Which candidate is exactly the SOURCE constellation after rotation, with no reflection or changed point?",
        answer: ["A", "B", "C", "D"][correctPanel]!,
        answerOptions: shuffled(["A", "B", "C", "D"], random),
        latent: {
          side,
          pointCount,
          quarterTurns,
          correctPanel,
          defectCount,
          sourcePoints,
          candidatePoints: candidates.flat(),
        },
        minimalPairDescription:
          "Difficulty adds points and reduces each wrong candidate toward a one-point near miss; the exact rotation oracle is discrete and exhaustive.",
      };
    }
  }
}

export const defaultDiagnosticParams: DiagnosticParams = { seed: 1847, difficulty: 58, variant: 0 };

export function stableSerialize(instance: DiagnosticInstance) {
  const sortObject = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sortObject);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => [key, sortObject(child)]),
      );
    }
    return value;
  };
  return JSON.stringify(sortObject(instance), null, 2);
}
