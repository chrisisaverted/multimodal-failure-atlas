import { describe, expect, it } from "vitest";
import {
  countGatedTargetPair,
  createPairCollisionGatedSet,
  renderPairCollisionGatedSvg,
} from "./pair-collision-gated";

describe("gated target-pair collision count", () => {
  it("balances adjacent answers, frame gates, and reserved splits", () => {
    const discovery = createPairCollisionGatedSet("discovery");
    const confirmatory = createPairCollisionGatedSet("confirmatory");
    expect(discovery).toHaveLength(8);
    expect(confirmatory).toHaveLength(16);
    for (const [set, repetitions] of [
      [discovery, 2],
      [confirmatory, 4],
    ] as const)
      for (const answer of ["5", "6", "7", "8"])
        expect(set.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(repetitions);
    expect(discovery.filter((candidate) => candidate.parameters.targetGate === "AMBER")).toHaveLength(4);
    expect(discovery.some((candidate) => confirmatory.some((other) => other.seed === candidate.seed))).toBe(
      false,
    );
  });

  it("constructs exact gated targets plus six wrong-gate target-pair traps", () => {
    for (const candidate of createPairCollisionGatedSet("confirmatory")) {
      const { events, targetPair, targetGate, targetCount } = candidate.parameters;
      expect(countGatedTargetPair(events, targetPair, targetGate)).toBe(targetCount);
      expect(events.filter((event) => event.gate === "AMBER")).toHaveLength(16);
      expect(events.filter((event) => event.gate === "CYAN")).toHaveLength(16);
      expect(countGatedTargetPair(events, targetPair, targetGate === "AMBER" ? "CYAN" : "AMBER")).toBe(6);
    }
  });

  it("makes the gate condition explicit and keeps the running count control-only", () => {
    const candidate = createPairCollisionGatedSet("discovery")[0]!;
    expect(renderPairCollisionGatedSvg(candidate, 4000, false)).not.toContain("MATCH COUNT:");
    expect(renderPairCollisionGatedSvg(candidate, 4000, true)).toContain("MATCH COUNT:");
  });
});
