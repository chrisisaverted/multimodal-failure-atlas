import { describe, expect, it } from "vitest";
import { createGatedGridSet, gatedGridTargetSet, renderGatedGridSetSvg } from "./gated-grid-set-cardinality";

describe("color-gated grid set cardinality", () => {
  it("creates deterministic, balanced discovery and reserved sets", () => {
    const discovery = createGatedGridSet("discovery");
    const holdout = createGatedGridSet("confirmatory");
    expect(discovery).toHaveLength(8);
    expect(holdout).toHaveLength(16);
    expect(createGatedGridSet("discovery")).toEqual(discovery);
    expect(new Set(discovery.map((candidate) => candidate.seed))).not.toEqual(
      new Set(holdout.map((candidate) => candidate.seed)),
    );
    for (const answer of ["9", "10", "11", "12"])
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("balances gate events and freezes eight wrong-gate echoes", () => {
    for (const candidate of [...createGatedGridSet("discovery"), ...createGatedGridSet("confirmatory")]) {
      const targetEvents = candidate.parameters.events.filter(
        (event) => event.gate === candidate.parameters.targetGate,
      );
      const targetSet = gatedGridTargetSet(candidate.parameters.events, candidate.parameters.targetGate);
      const echoes = candidate.parameters.events.filter(
        (event) => event.gate !== candidate.parameters.targetGate && targetSet.has(event.cell),
      );
      expect(targetEvents).toHaveLength(20);
      expect(targetSet.size).toBe(candidate.parameters.uniqueTargetCount);
      expect(echoes).toHaveLength(8);
    }
  });

  it("renders a readable native view and a target-only set control", () => {
    const candidate = createGatedGridSet("discovery")[0]!;
    expect(renderGatedGridSetSvg(candidate, 4_000)).toContain("COUNT DIFFERENT CELLS ONLY IN");
    expect(renderGatedGridSetSvg(candidate, 4_000, true)).toContain("TARGET SET SIZE:");
  });
});
