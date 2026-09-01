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
import {
  createWireTracingHoldout,
  createWireTracingDiscoveryGrid,
  renderWireTracingSvg,
  traceWireEndpoints,
  wireAnswers,
} from "./wire-tracing";
import {
  countTargetCrossings,
  createWireCrossingCountDiscoveryGrid,
  createWireCrossingCountHoldout,
  createPrecisionWireCrossingCountDiscoveryGrid,
  createPrecisionWireCrossingCountHoldout,
  crossingCountAnswers,
  precisionCrossingCountAnswers,
} from "./wire-crossing-count";
import { createEnclosureDepthDiscoveryGrid, renderEnclosureDepthSvg } from "./enclosure-depth";
import {
  correspondenceAnswers,
  createRotationCorrespondenceDiscoveryGrid,
  renderRotationCorrespondenceSvg,
} from "./rotation-correspondence";
import {
  changeQuadrants,
  createChangeLocalizationHoldout,
  createChangeLocalizationExtremeGrid,
  createChangeLocalizationDiscoveryGrid,
  renderChangeLocalizationSvg,
} from "./change-localization";
import {
  createSelectiveFlashDiscoveryGrid,
  createSelectiveFlashHoldout,
  renderSelectiveFlashSvg,
  targetFlashStarts,
} from "./selective-flash-tracking";
import {
  createMazeReachabilityDiscoveryGrid,
  createMazeReachabilityHoldout,
  mazePanelEdges,
  renderMazeReachabilitySvg,
} from "./maze-reachability";
import {
  createTemporalOrderDiscoveryGrid,
  renderTemporalOrderSvg,
  temporalOrderSchedule,
} from "./temporal-order";
import {
  createTemporalRelationGrid,
  renderTemporalRelationSvg,
  temporalRelationEvents,
} from "./temporal-relations";
import {
  createJigsawOrderDiscoveryGrid,
  jigsawRowOrders,
  renderJigsawOrderSvg,
} from "./jigsaw-order";
import { createOcclusionStackDiscoveryGrid, renderOcclusionStackSvg } from "./occlusion-stack";
import { createMotDiscoveryGrid, motEndpointAssignment, renderMotSvg } from "./multiple-object-tracking";
import { createDynamicStateDiscoveryGrid, createDynamicStateHoldout, dynamicFinalState, renderDynamicStateSvg } from "./dynamic-state";
import { createPaperFoldingDiscoveryGrid, paperOptionPatterns, unfoldPunches } from "./paper-folding";
import { createPeriodicAnomalyGrid, periodicLaneStarts } from "./periodic-anomaly";
import { createCubeStackGrid, createCubeStackHoldout, cubeHeights } from "./cube-stack";
import { bindingSequences, createBindingGrid } from "./temporal-binding";
import { createMirrorRayGrid, createMirrorRayHardGrid, traceMirrorRay } from "./mirror-ray";
import { applyTransfers, createCausalTransferGrid } from "./causal-transfer";
import { applyConservation, createConservationGrid } from "./conservation-ledger";
import { createSymmetryGrid, symmetryMatrix } from "./symmetry-search";
import { applySwaps, createSwapTrackingGrid } from "./swap-tracking";

describe("adaptive multimodal discovery", () => {
  it("binds every sequential swap case to its balanced target slot", () => {
    const candidates = createSwapTrackingGrid();
    expect(candidates).toHaveLength(8);
    expect(candidates.map((candidate) => candidate.expectedAnswer).sort()).toEqual([
      "1", "1", "2", "2", "3", "3", "4", "4",
    ]);
    for (const candidate of candidates) {
      expect(applySwaps(candidate.parameters.initialTarget, candidate.parameters.swaps)).toBe(
        candidate.parameters.targetFinal,
      );
    }
  });

  it("places exactly one perfectly bilateral field in each symmetry case", () => {
    for (const candidate of createSymmetryGrid()) {
      const symmetric = Array.from({ length: 4 }, (_, panel) =>
        symmetryMatrix(candidate, panel).every((row) => row.every((value, x) => value === row[23 - x])),
      );
      expect(symmetric.filter(Boolean)).toHaveLength(1);
      expect(symmetric[candidate.parameters.correctPanel]).toBe(true);
    }
  });

  it("conserves tokens and balances unique final maxima", () => {
    const candidates = createConservationGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      const final = applyConservation(candidate.parameters.initialCounts, candidate.parameters.transfers);
      const maximum = Math.max(...final);
      expect(final.indexOf(maximum)).toBe(candidate.parameters.targetBox);
      expect(final.filter((count) => count === maximum)).toHaveLength(1);
      expect(final.reduce((sum, count) => sum + count, 0)).toBe(
        candidate.parameters.initialCounts.reduce((sum, count) => sum + count, 0),
      );
    }
  });

  it("balances exact final nodes under causally gated hidden transfers", () => {
    const candidates = createCausalTransferGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates)
      expect(applyTransfers(candidate.parameters.initialActive, candidate.parameters.events)).toBe(
        candidate.parameters.targetFinal,
      );
  });

  it("balances exact mirror-ray exits after six or more reflections", () => {
    const candidates = createMirrorRayGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      const result = traceMirrorRay(candidate.parameters.configSeed);
      expect(result.exit).toBe(candidate.parameters.targetExit);
      expect(result.hits).toBeGreaterThanOrEqual(6);
    }
  });

  it("raises the mirror-ray replacement cell to fourteen reflections", () => {
    for (const candidate of createMirrorRayHardGrid())
      expect(traceMirrorRay(candidate.parameters.configSeed).hits).toBeGreaterThanOrEqual(14);
  });

  it("binds the queried six-color sequence to exactly one object", () => {
    const candidates = createBindingGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates)
      expect(bindingSequences(candidate).filter((sequence) => sequence.join(",") === "0,1,2,3,0,2")).toHaveLength(1);
  });

  it("constructs exact adjacent cube totals with one target panel", () => {
    const candidates = createCubeStackGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      const totals = Array.from({ length: 4 }, (_, panel) =>
        cubeHeights(candidate, panel).reduce((sum, height) => sum + height, 0),
      );
      expect(totals.filter((total) => total === candidate.parameters.targetTotal)).toHaveLength(1);
    }
  });

  it("reserves a balanced disjoint cube-stack holdout", () => {
    const holdout = createCubeStackHoldout();
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 2_610_000)).toBe(true);
    for (const answer of ["A", "B", "C", "D"])
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("balances exactly one omitted beat across periodic lanes", () => {
    const candidates = createPeriodicAnomalyGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates)
      expect(Array.from({ length: 4 }, (_, lane) => periodicLaneStarts(candidate, lane).length)).toEqual(
        Array.from({ length: 4 }, (_, lane) => (lane === candidate.parameters.anomalyLane ? 6 : 7)),
      );
  });

  it("propagates paper punches through three exact reverse folds", () => {
    expect(unfoldPunches([[0, 0]])).toHaveLength(8);
    const candidates = createPaperFoldingDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      const options = paperOptionPatterns(candidate);
      expect(new Set(options.map((option) => JSON.stringify(option)))).toHaveLength(4);
      expect(options[candidate.parameters.correctPanel]).toEqual(unfoldPunches(candidate.parameters.punches));
    }
  });

  it("balances exact latent dynamic states after deterministic wall updates", () => {
    const candidates = createDynamicStateDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      expect(dynamicFinalState(candidate)).toBe(candidate.parameters.targetState);
      expect(renderDynamicStateSvg(candidate, 500)).toContain("#fff");
      expect(renderDynamicStateSvg(candidate, 9000)).toContain("STATE HIDDEN");
    }
  });

  it("reserves balanced unseen dynamic-state holdout seeds", () => {
    const holdout = createDynamicStateHoldout();
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 2_310_000)).toBe(true);
    for (const answer of ["RED", "GREEN", "BLUE", "PURPLE"])
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("balances MOT endpoints and binds target identity to the exact trajectory", () => {
    const candidates = createMotDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      expect(motEndpointAssignment(candidate)[0]).toBe(candidate.parameters.targetEnd);
      expect(renderMotSvg(candidate, 500)).toContain("#e23e31");
      expect(renderMotSvg(candidate, 5000)).not.toContain('stroke="#e23e31" stroke-width="8"');
    }
  });

  it("balances deterministic global occlusion stack orders", () => {
    const candidates = createOcclusionStackDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    expect(new Set(candidates.map((candidate) => candidate.expectedAnswer))).toHaveLength(4);
    for (const candidate of candidates)
      expect(renderOcclusionStackSvg(candidate)).toBe(renderOcclusionStackSvg(candidate));
  });

  it("balances jigsaw rows and gives only one identity strip order", () => {
    const candidates = createJigsawOrderDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      const identity = Array.from({ length: candidate.parameters.strips }, (_, index) => index);
      const rows = jigsawRowOrders(candidate);
      expect(rows.filter((row) => row.every((value, index) => value === identity[index]))).toHaveLength(1);
      expect(renderJigsawOrderSvg(candidate)).toContain("WHICH ROW");
    }
  });

  it("balances duration and synchrony diagnostics with exact event oracles", () => {
    for (const task of ["duration-comparison", "synchrony-detection"] as const) {
      const candidates = createTemporalRelationGrid(task);
      expect(candidates).toHaveLength(8);
      expect(candidates.map((candidate) => candidate.expectedAnswer).sort()).toEqual(
        ["A", "A", "B", "B", "C", "C", "D", "D"],
      );
      for (const candidate of candidates) {
        expect(temporalRelationEvents(candidate)).toHaveLength(task === "duration-comparison" ? 4 : 8);
        expect(renderTemporalRelationSvg(candidate, 0)).toContain("<svg");
      }
    }
  });

  it("balances temporal orders with exact non-overlapping visible flashes", () => {
    const candidates = createTemporalOrderDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    for (const candidate of candidates) {
      const schedule = temporalOrderSchedule(candidate);
      expect(schedule.map((event) => event.label).join("-")).toBe(candidate.expectedAnswer);
      for (let index = 1; index < schedule.length; index += 1)
        expect(schedule[index]!.startMs - schedule[index - 1]!.startMs).toBeGreaterThan(
          candidate.parameters.flashDurationMs,
        );
      expect(renderTemporalOrderSvg(candidate, schedule[0]!.startMs)).toContain("#f4d934");
    }
  });

  it("constructs balanced edge-count-matched maze reachability panels", () => {
    const candidates = createMazeReachabilityDiscoveryGrid();
    expect(candidates).toHaveLength(16);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      const answers = candidates
        .filter((candidate) => candidate.cellId === cellId)
        .map((candidate) => candidate.expectedAnswer)
        .sort();
      expect(answers).toEqual(["A", "A", "B", "B", "C", "C", "D", "D"]);
    }
    for (const candidate of candidates) {
      const edgeCounts = Array.from({ length: 4 }, (_, panel) => mazePanelEdges(candidate, panel).size);
      expect(new Set(edgeCounts).size).toBe(1);
      expect(renderMazeReachabilitySvg(candidate)).toBe(renderMazeReachabilitySvg(candidate));
    }
  });

  it("reserves a balanced disjoint maze holdout", () => {
    const holdout = createMazeReachabilityHoldout();
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 1_710_000)).toBe(true);
    for (const answer of ["A", "B", "C", "D"])
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("balances selective target-flash counts with exact non-overlapping schedules", () => {
    const candidates = createSelectiveFlashDiscoveryGrid();
    expect(candidates).toHaveLength(8);
    expect(candidates.map((candidate) => candidate.expectedAnswer).sort()).toEqual(
      ["8", "8", "9", "9", "10", "10", "11", "11"].sort(),
    );
    for (const candidate of candidates) {
      const starts = targetFlashStarts(candidate);
      expect(starts).toHaveLength(candidate.parameters.targetCount);
      for (let index = 1; index < starts.length; index += 1)
        expect(starts[index]! - starts[index - 1]!).toBeGreaterThan(
          candidate.parameters.flashDurationMs,
        );
      expect(renderSelectiveFlashSvg(candidate, 0)).toBe(renderSelectiveFlashSvg(candidate, 0));
      expect(renderSelectiveFlashSvg(candidate, starts[0]!)).toContain("#f4d934");
    }
  });

  it("reserves balanced unseen selective-flash confirmation seeds", () => {
    const holdout = createSelectiveFlashHoldout();
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 1_610_000)).toBe(true);
    for (const answer of ["8", "9", "10", "11"])
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("balances dense change locations across all four quadrants", () => {
    const candidates = createChangeLocalizationDiscoveryGrid();
    expect(candidates).toHaveLength(16);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(
        candidates
          .filter((candidate) => candidate.cellId === cellId)
          .map((candidate) => candidate.expectedAnswer)
          .sort(),
      ).toEqual([...changeQuadrants, ...changeQuadrants].sort());
    }
    expect(renderChangeLocalizationSvg(candidates[0]!)).toBe(renderChangeLocalizationSvg(candidates[0]!));
    expect(renderChangeLocalizationSvg(candidates[0]!, true)).toContain('stroke="#e23e31"');
  });

  it("reserves a balanced disjoint dense-change holdout", () => {
    const holdout = createChangeLocalizationHoldout();
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 1_420_000)).toBe(true);
    for (const answer of changeQuadrants)
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("builds a balanced 42×42 replacement after the 34×34 boundary tie", () => {
    const candidates = createChangeLocalizationExtremeGrid();
    expect(candidates).toHaveLength(8);
    expect(candidates.every((candidate) => candidate.parameters.gridSize === 42)).toBe(true);
    for (const answer of changeQuadrants)
      expect(candidates.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(2);
  });

  it("balances exact rotation correspondence across candidate locations", () => {
    const candidates = createRotationCorrespondenceDiscoveryGrid();
    expect(candidates).toHaveLength(16);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(
        candidates
          .filter((candidate) => candidate.cellId === cellId)
          .map((candidate) => candidate.expectedAnswer)
          .sort(),
      ).toEqual([...correspondenceAnswers, ...correspondenceAnswers].sort());
    }
    expect(renderRotationCorrespondenceSvg(candidates[0]!)).toBe(
      renderRotationCorrespondenceSvg(candidates[0]!),
    );
    expect(renderRotationCorrespondenceSvg(candidates[0]!, true)).toContain("#2466cc");
  });

  it("balances enclosure-depth labels within each difficulty cell", () => {
    const candidates = createEnclosureDepthDiscoveryGrid();
    expect(candidates).toHaveLength(16);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      const cell = candidates.filter((candidate) => candidate.cellId === cellId);
      const frequencies = [...new Set(cell.map((candidate) => candidate.expectedAnswer))].map(
        (answer) => cell.filter((candidate) => candidate.expectedAnswer === answer).length,
      );
      expect(frequencies).toEqual([2, 2, 2, 2]);
    }
    const first = candidates[0]!;
    expect(renderEnclosureDepthSvg(first)).toBe(renderEnclosureDepthSvg(first));
    expect(renderEnclosureDepthSvg(first, true)).toContain(">1</text>");
  });

  it("constructs exact balanced wire-crossing counts and a disjoint holdout", () => {
    const candidates = createWireCrossingCountDiscoveryGrid();
    expect(candidates).toHaveLength(12);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(
        candidates
          .filter((candidate) => candidate.cellId === cellId)
          .map((candidate) => candidate.expectedAnswer)
          .sort(),
      ).toEqual([...crossingCountAnswers].sort());
    }
    for (const candidate of candidates)
      expect(countTargetCrossings(candidate)).toBe(candidate.parameters.targetCrossings);
    const holdout = createWireCrossingCountHoldout(candidates[4]!);
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 940_000)).toBe(true);
    for (const answer of crossingCountAnswers)
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("uses adjacent exact counts in every precision-search cell", () => {
    const candidates = createPrecisionWireCrossingCountDiscoveryGrid();
    expect(candidates).toHaveLength(12);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(
        candidates
          .filter((candidate) => candidate.cellId === cellId)
          .map((candidate) => candidate.expectedAnswer)
          .sort(),
      ).toEqual([...precisionCrossingCountAnswers].sort());
    }
    for (const candidate of candidates)
      expect(countTargetCrossings(candidate)).toBe(candidate.parameters.targetCrossings);
    const holdout = createPrecisionWireCrossingCountHoldout(candidates[4]!);
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 950_000)).toBe(true);
    for (const answer of precisionCrossingCountAnswers)
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
    for (const candidate of holdout)
      expect(countTargetCrossings(candidate)).toBe(candidate.parameters.targetCrossings);
  });

  it("balances wire endpoints and independently traces every exact answer", () => {
    const candidates = createWireTracingDiscoveryGrid();
    expect(candidates).toHaveLength(16);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(
        candidates
          .filter((candidate) => candidate.cellId === cellId)
          .map((candidate) => candidate.expectedAnswer)
          .sort(),
      ).toEqual([...wireAnswers].sort());
    }
    for (const candidate of candidates) {
      const endpoint = traceWireEndpoints(candidate)[candidate.parameters.sourceWire]!;
      expect(wireAnswers[endpoint]).toBe(candidate.expectedAnswer);
      expect(renderWireTracingSvg(candidate)).toContain("they never join");
    }
  });

  it("keeps wire holdout seeds and images disjoint while balancing endpoints", () => {
    const representative = createWireTracingDiscoveryGrid()[8]!;
    const holdout = createWireTracingHoldout(representative);
    expect(holdout).toHaveLength(16);
    expect(holdout.every((candidate) => candidate.seed >= 930_000)).toBe(true);
    expect(
      holdout.every((candidate) => candidate.parameters.crossings === representative.parameters.crossings),
    ).toBe(true);
    for (const answer of wireAnswers)
      expect(holdout.filter((candidate) => candidate.expectedAnswer === answer)).toHaveLength(4);
  });

  it("builds balanced compositional-counting cells with exact deterministic ground truth", () => {
    const candidates = createCompositionalCountingDiscoveryGrid();
    expect(candidates).toHaveLength(24);
    expect(new Set(candidates.map((candidate) => candidate.cellId))).toHaveLength(6);
    for (const cellId of new Set(candidates.map((candidate) => candidate.cellId))) {
      expect(
        candidates
          .filter((candidate) => candidate.cellId === cellId)
          .map((candidate) => candidate.expectedAnswer)
          .sort(),
      ).toEqual([...compositionalAnswers].sort());
    }
    for (const candidate of candidates) {
      const p = candidate.parameters;
      const matches = generateGlyphs(candidate).filter(
        (glyph) =>
          glyph.color === p.targetColor && glyph.shape === p.targetShape && glyph.fill === p.targetFill,
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
