import { describe, expect, it } from "vitest";
import { createEnclosurePanelsDenseSet, renderEnclosurePanelsDenseSvg } from "./enclosure-panels-dense";

describe("fixed-target dense enclosure panels", () => {
  it("prebalances answer positions on disjoint discovery and holdout seeds", () => {
    const discovery = createEnclosurePanelsDenseSet("discovery");
    const confirmatory = createEnclosurePanelsDenseSet("confirmatory");
    expect(discovery).toHaveLength(8);
    expect(confirmatory).toHaveLength(16);
    for (const [set, repetitions] of [
      [discovery, 2],
      [confirmatory, 4],
    ] as const)
      for (const answer of ["A", "B", "C", "D"])
        expect(set.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(repetitions);
    expect(discovery.some((candidate) => confirmatory.some((other) => other.seed === candidate.seed))).toBe(
      false,
    );
  });

  it("holds the answer-bearing count and all visual load parameters fixed", () => {
    for (const candidate of createEnclosurePanelsDenseSet("confirmatory")) {
      expect(candidate.parameters.targetDepth).toBe(18);
      expect(candidate.parameters.panelDepths[candidate.parameters.targetSlot]).toBe(18);
      expect(candidate.parameters.openDecoysPerPanel).toBe(8);
      expect(candidate.parameters.irregularity).toBe(0.35);
      const sorted = [...candidate.parameters.panelDepths].sort((left, right) => left - right);
      expect(sorted.indexOf(18)).toBeGreaterThan(0);
      expect(sorted.indexOf(18)).toBeLessThan(3);
    }
  });

  it("retains an oracle-only numbered boundary layer", () => {
    const candidate = createEnclosurePanelsDenseSet("discovery")[0]!;
    expect(renderEnclosurePanelsDenseSvg(candidate, false)).not.toContain("#ffe13b");
    expect(renderEnclosurePanelsDenseSvg(candidate, true)).toContain("#ffe13b");
  });
});
