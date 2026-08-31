import { describe, expect, it } from "vitest";
import { failureModes } from "./catalogue";
import { citationsById } from "./sources";

describe("catalogue integrity", () => {
  it("keeps identifiers and exhibit numbers unique", () => {
    expect(new Set(failureModes.map((mode) => mode.id)).size).toBe(failureModes.length);
    expect(new Set(failureModes.map((mode) => mode.index)).size).toBe(failureModes.length);
  });

  it("links every claim family to a known primary source", () => {
    for (const mode of failureModes) {
      expect(mode.sourceIds.length, mode.id).toBeGreaterThan(0);
      for (const sourceId of mode.sourceIds)
        expect(citationsById.has(sourceId), `${mode.id}: ${sourceId}`).toBe(true);
      expect(mode.alternatives.length, mode.id).toBeGreaterThan(0);
      expect(mode.disconfirmingTest.length, mode.id).toBeGreaterThan(20);
    }
  });

  it("does not overstate the patch-phase causal claim", () => {
    const mode = failureModes.find(({ id }) => id === "patch-phase-sensitivity");
    expect(mode?.evidence).toBe("hypothesis");
    expect(mode?.mechanism.toLowerCase()).toContain("hypothesis");
  });
});
