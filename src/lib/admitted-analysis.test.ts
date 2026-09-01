import { describe, expect, it } from "vitest";
import { admittedEvidence } from "./admitted-evidence";
import {
  easiestRouteRate,
  controlRecoveryInterpretation,
  familyResponseShape,
  orderByUniversalHardness,
  pooledNativeRate,
  responseConcentration,
  weakestControlRate,
} from "./admitted-analysis";

describe("conservative admitted-family analysis", () => {
  it("ranks against the easiest route rather than pooling weak routes", () => {
    const ordered = orderByUniversalHardness(admittedEvidence.families);
    for (let index = 1; index < ordered.length; index += 1) {
      expect(easiestRouteRate(ordered[index - 1]!)!).toBeLessThanOrEqual(easiestRouteRate(ordered[index]!)!);
    }
    expect(ordered[0]!.catalogueId).toBe("identity-conditioned-temporal-event-counting");
  });

  it("keeps every easiest route strictly below the admission threshold", () => {
    for (const family of admittedEvidence.families) expect(easiestRouteRate(family)).toBeLessThan(0.5);
  });

  it("computes pooled and control descriptors without changing admission", () => {
    const wire = admittedEvidence.families.find(
      (family) => family.catalogueId === "identity-conditioned-exact-counting",
    )!;
    expect(easiestRouteRate(wire)).toBe(7 / 16);
    expect(pooledNativeRate(wire)).toBe(14 / 80);
    expect(weakestControlRate(wire)).toBe(13 / 16);
  });

  it("separates behavioral hardness from control-based localization", () => {
    const routeTurn = admittedEvidence.families.find(
      (family) => family.catalogueId === "dynamic-route-turn-integration",
    )!;
    const selectiveFlash = admittedEvidence.families.find(
      (family) => family.catalogueId === "identity-conditioned-temporal-event-counting",
    )!;
    expect(controlRecoveryInterpretation(routeTurn)).toEqual({ rate: 1, level: "strong" });
    expect(controlRecoveryInterpretation(selectiveFlash)).toEqual({
      rate: 6 / 16,
      level: "inconclusive",
    });
  });

  it("measures output concentration without changing the hardness gate", () => {
    expect(
      responseConcentration({ substantiveAnswers: 16, answerDistribution: { A: 12, B: 2, C: 1, D: 1 } }),
    ).toMatchObject({ modalAnswer: "A", modalCount: 12, modalShare: 0.75, observedSupport: 4 });
    const conservation = admittedEvidence.families.find(
      (family) => family.catalogueId === "dynamic-conservation-ledger",
    )!;
    const trail = admittedEvidence.families.find(
      (family) => family.catalogueId === "dynamic-trajectory-topology",
    )!;
    expect(familyResponseShape(conservation).concentratedRoutes).toBe(0);
    expect(familyResponseShape(trail).concentratedRoutes).toBe(3);
  });

  it("rejects partial distributions instead of silently measuring them", () => {
    expect(() =>
      responseConcentration({ substantiveAnswers: 16, answerDistribution: { A: 12, B: 3 } }),
    ).toThrow("15/16");
  });
});
