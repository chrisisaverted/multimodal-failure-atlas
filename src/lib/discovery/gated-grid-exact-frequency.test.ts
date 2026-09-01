import { describe, expect, it } from "vitest";
import {
  createGatedGridFrequencySet,
  exactFrequencyCount,
  renderGatedGridFrequencySvg,
  targetGateFrequencies,
} from "./gated-grid-exact-frequency";

describe("color-gated exact-frequency histogram", () => {
  it("creates deterministic balanced discovery and reserved sets", () => {
    const discovery = createGatedGridFrequencySet("discovery");
    const holdout = createGatedGridFrequencySet("confirmatory");
    expect(discovery).toHaveLength(8);
    expect(holdout).toHaveLength(16);
    expect(createGatedGridFrequencySet("discovery")).toEqual(discovery);
    for (const answer of ["3", "4", "5", "6"])
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("freezes exact multiplicities, balanced gates, and wrong-gate echoes", () => {
    for (const candidate of [
      ...createGatedGridFrequencySet("discovery"),
      ...createGatedGridFrequencySet("confirmatory"),
    ]) {
      const targetEvents = candidate.parameters.events.filter(
        (event) => event.gate === candidate.parameters.targetGate,
      );
      const targetCells = new Set(
        targetGateFrequencies(candidate.parameters.events, candidate.parameters.targetGate).keys(),
      );
      const echoes = candidate.parameters.events.filter(
        (event) => event.gate !== candidate.parameters.targetGate && targetCells.has(event.cell),
      );
      expect(targetEvents).toHaveLength(20);
      expect(exactFrequencyCount(candidate.parameters.events, candidate.parameters.targetGate)).toBe(
        candidate.parameters.qualifyingCount,
      );
      expect(echoes).toHaveLength(8);
    }
  });

  it("renders an exact per-cell frequency control", () => {
    const candidate = createGatedGridFrequencySet("discovery")[0]!;
    expect(renderGatedGridFrequencySvg(candidate, 4_000)).toContain("EXACTLY TWICE");
    expect(renderGatedGridFrequencySvg(candidate, 4_000, true)).toContain("EXACTLY-TWICE CELLS:");
  });
});
