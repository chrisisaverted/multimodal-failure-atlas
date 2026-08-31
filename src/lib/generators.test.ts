import { describe, expect, it } from "vitest";
import { renderDiagnosticSvg } from "./evaluation/render";
import { generateInstance } from "./generators";
import type { GeneratorKey } from "./types";

const keys: GeneratorKey[] = [
  "small-object",
  "patch-phase",
  "attribute-binding",
  "numerosity-density",
  "brief-event",
  "event-order",
  "identity-occlusion",
  "event-counting",
];

describe("diagnostic generators", () => {
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
});
