import { describe, expect, it } from "vitest";
import { createVisualCircuitSet, renderVisualCircuitSvg } from "./visual-circuit";

describe("visual Boolean circuit", () => {
  it("balances every two-bit output on reserved disjoint splits", () => {
    const discovery = createVisualCircuitSet("discovery");
    const confirmatory = createVisualCircuitSet("confirmatory");
    expect(discovery).toHaveLength(8);
    expect(confirmatory).toHaveLength(16);
    for (const [candidates, count] of [
      [discovery, 2],
      [confirmatory, 4],
    ] as const)
      for (const answer of ["00", "01", "10", "11"])
        expect(candidates.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(count);
    expect(new Set(discovery.map((candidate) => candidate.seed)).size).toBe(8);
    expect(discovery.some((candidate) => confirmatory.some((other) => other.seed === candidate.seed))).toBe(
      false,
    );
  });

  it("holds gate count, depth graph, and gate vocabulary fixed", () => {
    for (const candidate of createVisualCircuitSet("confirmatory")) {
      expect(candidate.parameters.gates).toHaveLength(9);
      expect(new Set(candidate.parameters.gates.map((gate) => gate.type))).toEqual(
        new Set(["AND", "OR", "XOR"]),
      );
      expect(candidate.parameters.outputGateIds).toEqual(["G8", "G9"]);
    }
  });

  it("reveals intermediate values only in the oracle rendering", () => {
    const candidate = createVisualCircuitSet("discovery")[0]!;
    const native = renderVisualCircuitSvg(candidate, false);
    const oracle = renderVisualCircuitSvg(candidate, true);
    expect(native).not.toContain("#ffe13b");
    expect(oracle).toContain("#ffe13b");
    expect(native).toContain("O1");
    expect(native).toContain("O2");
  });
});
