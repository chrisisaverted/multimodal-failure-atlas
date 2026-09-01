import { describe, expect, it } from "vitest";
import { admittedEvidence } from "./admitted-evidence";
import { failureModesById } from "./catalogue";
import { routeExpansionModels } from "./external-replication";

describe("published admitted evidence", () => {
  it("contains ten strict image and ten strict video families", () => {
    expect(admittedEvidence.families).toHaveLength(20);
    expect(admittedEvidence.families.filter((family) => family.modality === "image")).toHaveLength(10);
    expect(admittedEvidence.families.filter((family) => family.modality === "video")).toHaveLength(10);
  });

  it("publishes unique admitted plans backed by reproduced catalogue entries", () => {
    expect(new Set(admittedEvidence.families.map((family) => family.planId)).size).toBe(20);
    expect(new Set(admittedEvidence.families.map((family) => family.catalogueId)).size).toBe(20);
    for (const family of admittedEvidence.families) {
      expect(family.admitted, family.planId).toBe(true);
      expect(failureModesById.get(family.catalogueId)?.evidence, family.catalogueId).toBe("reproduced-here");
      expect(family.planSha256, family.planId).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("enforces the substantive-answer admission denominator on every route", () => {
    for (const family of admittedEvidence.families) {
      expect(family.models, family.planId).toHaveLength(3);
      for (const model of family.models) {
        expect(model.native.substantiveAnswers, `${family.planId}: ${model.modelId}`).toBeGreaterThanOrEqual(
          16,
        );
        expect(model.native.solveRate, `${family.planId}: ${model.modelId}`).not.toBeNull();
        expect(model.native.solveRate!, `${family.planId}: ${model.modelId}`).toBeLessThan(0.5);
        expect(model.native.correct, `${family.planId}: ${model.modelId}`).toBeLessThan(
          model.native.substantiveAnswers / 2,
        );
      }
    }
  });

  it("confirms every current family on two additional frozen routes", () => {
    for (const family of admittedEvidence.families) {
      const expansion = routeExpansionModels(family);
      expect(expansion, family.planId).toHaveLength(2);
      for (const model of expansion ?? []) {
        expect(model.native.substantiveAnswers, `${family.planId}: ${model.modelId}`).toBe(16);
        expect(model.native.solveRate, `${family.planId}: ${model.modelId}`).not.toBeNull();
        expect(model.native.solveRate!, `${family.planId}: ${model.modelId}`).toBeLessThan(0.5);
        expect(model.control.substantiveAnswers, `${family.planId}: ${model.modelId} control`).toBe(16);
      }
    }
  });
});
