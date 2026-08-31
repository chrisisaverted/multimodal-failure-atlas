import { describe, expect, it } from "vitest";
import { failureModules } from "./failure-modules";

describe("failure module contract", () => {
  it("registers all eight deep diagnostics", () => {
    expect(failureModules).toHaveLength(8);
  });

  for (const diagnostic of failureModules) {
    it(`${diagnostic.id} is self-validating and construction-scored`, () => {
      const instance = diagnostic.generate({ seed: 42, difficulty: 50, variant: 1 });
      expect(diagnostic.validate(instance)).toEqual([]);
      expect(diagnostic.groundTruth(instance)).toBe(instance.answer);
      expect(diagnostic.score(instance.answer, instance)).toMatchObject({
        correct: true,
        needsReview: false,
      });
      expect(diagnostic.citations.length).toBeGreaterThan(0);
    });
  }
});
