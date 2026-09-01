import { describe, expect, it } from "vitest";
import {
  createEnclosurePanelsSet,
  enclosurePanelTargets,
  renderEnclosurePanelsSvg,
} from "./enclosure-panels";

describe("fixed-structure enclosure panels", () => {
  it("balances target depths and answer positions in both splits", () => {
    for (const [split, replicates] of [
      ["discovery", 4],
      ["confirmatory", 8],
    ] as const) {
      const candidates = createEnclosurePanelsSet(split);
      expect(candidates).toHaveLength(replicates * 2);
      for (const depth of enclosurePanelTargets)
        expect(candidates.filter((candidate) => candidate.parameters.targetDepth === depth)).toHaveLength(
          replicates,
        );
      for (const answer of ["A", "B", "C", "D"])
        expect(candidates.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(
          replicates / 2,
        );
    }
  });

  it("holds the four panel depths and structural load fixed in every case", () => {
    for (const candidate of createEnclosurePanelsSet("confirmatory")) {
      expect(new Set(candidate.parameters.panelDepths).size).toBe(4);
      expect(candidate.parameters.openDecoysPerPanel).toBe(9);
      expect(candidate.parameters.irregularity).toBe(0.48);
      expect(candidate.parameters.panelDepths[candidate.parameters.targetSlot]).toBe(
        candidate.parameters.targetDepth,
      );
      const ordered = [...candidate.parameters.panelDepths].sort((left, right) => left - right);
      expect(ordered.indexOf(candidate.parameters.targetDepth)).toBeGreaterThan(0);
      expect(ordered.indexOf(candidate.parameters.targetDepth)).toBeLessThan(3);
    }
  });

  it("renders four labeled panels with an oracle-only numbering layer", () => {
    const candidate = createEnclosurePanelsSet("discovery")[0]!;
    const native = renderEnclosurePanelsSvg(candidate, false);
    const oracle = renderEnclosurePanelsSvg(candidate, true);
    for (const label of ["A", "B", "C", "D"]) expect(native).toContain(`>${label}</text>`);
    expect(native).not.toContain("#ffe13b");
    expect(oracle).toContain("#ffe13b");
  });
});
