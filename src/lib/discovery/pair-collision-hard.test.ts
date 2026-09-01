import { describe, expect, it } from "vitest";
import {
  countHardTargetPair,
  createPairCollisionHardSet,
  renderPairCollisionHardSvg,
} from "./pair-collision-hard";

describe("variable-target hard pair collision counting", () => {
  it("balances adjacent answers and reserves disjoint holdout seeds", () => {
    const discovery = createPairCollisionHardSet("discovery");
    const confirmatory = createPairCollisionHardSet("confirmatory");
    expect(discovery).toHaveLength(8);
    expect(confirmatory).toHaveLength(16);
    for (const [set, repetitions] of [
      [discovery, 2],
      [confirmatory, 4],
    ] as const)
      for (const answer of ["7", "8", "9", "10"])
        expect(set.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(repetitions);
    expect(discovery.some((candidate) => confirmatory.some((other) => other.seed === candidate.seed))).toBe(
      false,
    );
  });

  it("constructs exact targets amid twelve single-target near misses", () => {
    for (const candidate of createPairCollisionHardSet("confirmatory")) {
      expect(countHardTargetPair(candidate.parameters.events, candidate.parameters.targetPair)).toBe(
        candidate.parameters.targetCount,
      );
      const [left, right] = candidate.parameters.targetPair;
      const singleTarget = candidate.parameters.events.filter(([a, b]) => {
        const hits = Number(a === left || a === right) + Number(b === left || b === right);
        return hits === 1;
      });
      expect(singleTarget).toHaveLength(12);
    }
  });

  it("shows the target pair natively and reveals only the running count in control", () => {
    const candidate = createPairCollisionHardSet("discovery")[0]!;
    const native = renderPairCollisionHardSvg(candidate, 5000, false);
    const control = renderPairCollisionHardSvg(candidate, 5000, true);
    expect(native).toContain("COLLISIONS ONLY");
    expect(native).not.toContain("COUNT:");
    expect(control).toContain("COUNT:");
  });
});
