import { describe, expect, it } from "vitest";
import {
  createConfirmatoryCandidates,
  createDiscoveryGrid,
  renderLatticeCountingSvg,
} from "./lattice-counting";
import { scoreCrossModelCells, wilsonUpper } from "./admission";
import {
  createMomentarySymbolDiscoveryGrid,
  createMomentarySymbolHoldout,
  eventTouchesReferenceSampler,
  isMomentaryEventActive,
  momentarySymbols,
  renderMomentarySymbolSvg,
} from "./momentary-symbol";
import { scoreCells } from "./objective";
import { scheduleBudgetedRound } from "./scheduler";
import {
  compositionalAnswers,
  createCompositionalCountingDiscoveryGrid,
  generateGlyphs,
  renderCompositionalCountingSvg,
} from "./compositional-counting";

describe("adaptive multimodal discovery", () => {
  it("builds balanced compositional-counting cells with exact deterministic ground truth", () => {
    const candidates = createCompositionalCountingDiscoveryGrid();
    expect(candidates).toHaveLength(24);
    expect(new Set(candidates.map((candidate) => candidate.cellId))).toHaveLength(6);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(candidates.filter((candidate) => candidate.cellId === cellId).map((candidate) => candidate.expectedAnswer).sort()).toEqual([...compositionalAnswers].sort());
    }
    for (const candidate of candidates) {
      const p = candidate.parameters;
      const matches = generateGlyphs(candidate).filter(
        (glyph) => glyph.color === p.targetColor && glyph.shape === p.targetShape && glyph.fill === p.targetFill,
      );
      expect(matches).toHaveLength(p.targetCount);
      expect(generateGlyphs(candidate)).toEqual(generateGlyphs(candidate));
      expect(renderCompositionalCountingSvg(candidate)).toContain(p.targetShape.toUpperCase());
    }
  });

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

  it("uses the easiest target model as the admission bottleneck", () => {
    const [first] = createDiscoveryGrid();
    const observations = [
      ...Array.from({ length: 8 }, (_, index) => ({
        candidateId: first!.id,
        modelId: "model-a",
        outcome: index < 2 ? ("correct" as const) : ("incorrect" as const),
        costUsd: 0,
      })),
      ...Array.from({ length: 8 }, (_, index) => ({
        candidateId: first!.id,
        modelId: "model-b",
        outcome: index < 5 ? ("correct" as const) : ("incorrect" as const),
        costUsd: 0,
      })),
    ];
    const [score] = scoreCrossModelCells([first!], observations, ["model-a", "model-b"]);
    expect(score!.models[0]!.substantiveSolveRate).toBe(0.25);
    expect(score!.worstModelSolveRate).toBe(0.625);
    expect(score!.observedAdmitted).toBe(false);
  });

  it("never treats model silence as evidence of hardness", () => {
    const [first] = createDiscoveryGrid();
    const observations = Array.from({ length: 20 }, () => ({
      candidateId: first!.id,
      modelId: "silent-model",
      outcome: "no-answer" as const,
      costUsd: 0,
    }));
    const [score] = scoreCrossModelCells([first!], observations, ["silent-model"]);
    expect(score!.noAnswerRate).toBe(1);
    expect(score!.evidenceComplete).toBe(false);
    expect(score!.rankScore).toBe(0);
    expect(score!.observedAdmitted).toBe(false);
  });

  it("requires stronger evidence than an observed below-bar rate", () => {
    expect(wilsonUpper(3, 16)).toBeLessThan(0.5);
    expect(wilsonUpper(4, 16)).toBeLessThan(0.5);
    expect(wilsonUpper(5, 16)).toBeGreaterThan(0.5);
  });

  it("builds balanced momentary-symbol cells with answer-bearing frames off the 2 FPS lattice", () => {
    const candidates = createMomentarySymbolDiscoveryGrid();
    expect(candidates).toHaveLength(36);
    expect(new Set(candidates.map((candidate) => candidate.cellId))).toHaveLength(9);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      const cell = candidates.filter((candidate) => candidate.cellId === cellId);
      expect(new Set(cell.map((candidate) => candidate.expectedAnswer))).toEqual(new Set(momentarySymbols));
      expect(
        cell.every((candidate) => candidate.parameters.phaseMs + candidate.parameters.eventDurationMs < 500),
      ).toBe(true);
    }
  });

  it("keeps momentary holdout labels balanced and seeds disjoint", () => {
    const [winner] = createMomentarySymbolDiscoveryGrid();
    const discoverySeconds = createMomentarySymbolDiscoveryGrid()
      .filter((candidate) => candidate.cellId === winner!.cellId)
      .map((candidate) => candidate.parameters.eventSecond);
    const holdout = createMomentarySymbolHoldout(winner!, discoverySeconds);
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 920_000)).toBe(true);
    expect(holdout.every((candidate) => !discoverySeconds.includes(candidate.parameters.eventSecond))).toBe(
      true,
    );
    for (const symbol of momentarySymbols) {
      expect(holdout.filter((candidate) => candidate.expectedAnswer === symbol)).toHaveLength(4);
    }
    for (const candidate of holdout) {
      expect([1, 2, 4].some((sampleFps) => eventTouchesReferenceSampler(candidate, sampleFps))).toBe(false);
    }
  });

  it("renders the oracle symbol only during the committed event interval", () => {
    const [candidate] = createMomentarySymbolDiscoveryGrid();
    const start = candidate!.parameters.eventSecond * 1000 + candidate!.parameters.phaseMs;
    expect(isMomentaryEventActive(candidate!, start - 1)).toBe(false);
    expect(isMomentaryEventActive(candidate!, start)).toBe(true);
    expect(renderMomentarySymbolSvg(candidate!, start)).toContain("#f4dc36");
    expect(isMomentaryEventActive(candidate!, start + candidate!.parameters.eventDurationMs)).toBe(false);
  });
});
