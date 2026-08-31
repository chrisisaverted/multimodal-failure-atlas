import type { DiagnosticInstance, DiagnosticParams, GeneratorKey } from "./types";

export const generatorVersion = "1.1.0";

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
      return {
        ...base(generator, params),
        question: "Do the two outlined circles overlap?",
        answer: relation === "overlap" ? "yes" : "no",
        answerOptions: ["yes", "no"],
        latent: { offset, patchSize: 14, relation, separation: relation === "overlap" ? 31 : 41 },
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
      return {
        ...base(generator, params),
        question: `What colour is the ${target}?`,
        answer,
        answerOptions: shuffled(colors, random),
        latent: { shapes: orderedShapes, colors: orderedColors, target, targetIndex },
        minimalPairDescription:
          "A paired seed permutes colours between fixed objects while preserving the same inventory of shapes and colours.",
      };
    }
    case "numerosity-density": {
      const count = 3 + ((params.seed + params.variant) % 7);
      const totalArea = 2100;
      const radius = Math.sqrt(totalArea / count / Math.PI);
      return {
        ...base(generator, params),
        question: "How many violet circles are present?",
        answer: String(count),
        answerOptions: shuffled(
          [String(count), String(Math.max(1, count - 1)), String(count + 1), String(count + 2)],
          random,
        ),
        latent: { count, radius: Number(radius.toFixed(2)), totalArea, density: difficulty },
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
      return {
        ...base(generator, params),
        question: "Which shape flashed first?",
        answer: order[0]!,
        answerOptions: ["circle", "square"],
        latent: { order, firstAtMs: 1200, secondAtMs: 2800, videoDurationMs: 4500 },
        minimalPairDescription:
          "The paired clip contains identical frames and events in exactly reversed temporal order.",
      };
    }
    case "identity-occlusion": {
      const swap = params.seed % 2 === 0;
      const occlusionMs = 500 + difficulty * 16;
      return {
        ...base(generator, params),
        question: "After emerging, is the blue ball above the red ball?",
        answer: swap ? "no" : "yes",
        answerOptions: ["yes", "no"],
        latent: { swap, occlusionMs, videoDurationMs: 6000, identities: ["blue", "red"] },
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
