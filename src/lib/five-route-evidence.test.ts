import { describe, expect, it } from "vitest";
import { fiveRouteEvidence } from "@/lib/five-route-evidence";

describe("machine-readable five-route evidence", () => {
  it("exports ten image and ten video families with five unique routes each", () => {
    expect(fiveRouteEvidence.families).toHaveLength(20);
    expect(fiveRouteEvidence.families.filter((family) => family.modality === "image")).toHaveLength(10);
    expect(fiveRouteEvidence.families.filter((family) => family.modality === "video")).toHaveLength(10);
    for (const family of fiveRouteEvidence.families) {
      expect(family.routes, family.planId).toHaveLength(5);
      expect(new Set(family.routes.map((route) => route.modelId)).size, family.planId).toBe(5);
    }
  });

  it("preserves the strict substantive below-half gate and evidence provenance", () => {
    for (const family of fiveRouteEvidence.families) {
      expect(family.routes.filter((route) => route.evidenceStage === "core-confirmatory")).toHaveLength(3);
      expect(family.routes.filter((route) => route.evidenceStage !== "core-confirmatory")).toHaveLength(2);
      for (const route of family.routes) {
        expect(route.native.substantiveAnswers, `${family.planId}:${route.modelId}`).toBeGreaterThanOrEqual(
          16,
        );
        expect(route.native.solveRate, `${family.planId}:${route.modelId}`).not.toBeNull();
        expect(route.native.solveRate!, `${family.planId}:${route.modelId}`).toBeLessThan(0.5);
      }
    }
  });

  it("marks only the two repaired family holdouts as replacement confirmatory", () => {
    const repaired = fiveRouteEvidence.families.filter((family) =>
      family.routes.some((route) => route.evidenceStage === "replacement-confirmatory"),
    );
    expect(repaired.map((family) => family.planId).sort()).toEqual([
      "gated-grid-frequency-confirmatory-v1",
      "pair-collision-gated-confirmatory-v1",
    ]);
  });
});
