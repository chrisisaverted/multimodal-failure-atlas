import { describe, expect, it } from "vitest";
import {
  createConfirmatoryCandidates,
  createDiscoveryGrid,
  renderLatticeCountingSvg,
} from "./lattice-counting";
import { scoreCells } from "./objective";
import { scheduleBudgetedRound } from "./scheduler";

describe("adaptive multimodal discovery", () => {
  it("creates a deterministic, balanced discovery grid", () => {
    const first = createDiscoveryGrid();
    const second = createDiscoveryGrid();
    expect(first).toEqual(second);
    expect(first).toHaveLength(48);
    expect(new Set(first.map((candidate) => candidate.cellId))).toHaveLength(12);
    expect(new Set(first.map((candidate) => candidate.expectedAnswer))).toEqual(
      new Set(["3", "5", "7", "9"]),
    );
  });

  it("keeps every flash within the exact rendered clip", () => {
    for (const candidate of createDiscoveryGrid()) {
      const parameters = candidate.parameters;
      const last =
        600 +
        parameters.phaseMs +
        (parameters.count - 1) * parameters.intervalMs +
        parameters.flashDurationMs;
      expect(last).toBeLessThan(parameters.videoDurationMs - 300);
      expect(renderLatticeCountingSvg(candidate, last - 1)).toContain("#d9f43c");
    }
  });

  it("reserves unseen counts and seeds for confirmation", () => {
    const discovery = createDiscoveryGrid();
    const confirmatory = createConfirmatoryCandidates([discovery[0]!, discovery[1]!]);
    expect(confirmatory).toHaveLength(4);
    expect(new Set(confirmatory.map((candidate) => candidate.expectedAnswer))).toEqual(
      new Set(["4", "6", "8", "10"]),
    );
    expect(confirmatory.every((candidate) => candidate.seed >= 910_000)).toBe(true);
    expect(confirmatory.every((candidate) => candidate.split === "confirmatory")).toBe(true);
    expect(confirmatory.every((candidate) => candidate.parameters.videoDurationMs === 8000)).toBe(true);
  });

  it("ranks substantive wrong answers but never rewards silence", () => {
    const candidates = createDiscoveryGrid();
    const [first, second] = [...new Map(candidates.map((item) => [item.cellId, item])).values()];
    const scores = scoreCells(
      [first!, second!],
      [
        { candidateId: first!.id, modelId: "a", outcome: "incorrect", costUsd: 0.01 },
        { candidateId: first!.id, modelId: "b", outcome: "incorrect", costUsd: 0.01 },
        { candidateId: second!.id, modelId: "a", outcome: "no-answer", costUsd: 0.01 },
        { candidateId: second!.id, modelId: "b", outcome: "no-answer", costUsd: 0.01 },
      ],
      2,
    );
    expect(scores[0]!.cellId).toBe(first!.cellId);
    expect(scores.find((score) => score.cellId === second!.cellId)!.rankScore).toBe(0);
    expect(scores.find((score) => score.cellId === second!.cellId)!.distinctModels).toBe(0);
  });

  it("never schedules beyond the declared budget", () => {
    const calls = scheduleBudgetedRound({
      candidates: createDiscoveryGrid(),
      modelIds: ["a", "b", "c"],
      maximumEstimatedCostPerCallUsd: 0.05,
      budgetUsd: 1,
    });
    expect(calls).toHaveLength(20);
    expect(calls.reduce((sum, call) => sum + call.maximumEstimatedCostUsd, 0)).toBeCloseTo(1);
  });
});
