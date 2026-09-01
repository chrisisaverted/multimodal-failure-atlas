import { describe, expect, it } from "vitest";
import admittedFamilies from "@/data/admitted-families.json";
import { failureModules } from "./failure-modules";
import { isVideoGenerator } from "./generators";

describe("failure module contract", () => {
  it("registers all twenty admitted families plus eight exploratory diagnostics", () => {
    expect(failureModules).toHaveLength(28);
    const ids = new Set(failureModules.map((module) => module.id));
    expect(ids.size).toBe(28);
    expect(admittedFamilies.families.every((family) => ids.has(family.catalogueId))).toBe(true);
    for (const family of admittedFamilies.families) {
      const diagnostic = failureModules.find((module) => module.id === family.catalogueId)!;
      expect(isVideoGenerator(diagnostic.metadata.generator!)).toBe(family.modality === "video");
    }
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
