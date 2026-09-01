import { describe, expect, it } from "vitest";
import { admittedEvidence } from "./admitted-evidence";
import {
  easiestRouteRate,
  controlRecoveryInterpretation,
  orderByUniversalHardness,
  pooledNativeRate,
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
});
