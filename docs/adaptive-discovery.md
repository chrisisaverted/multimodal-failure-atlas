# Adaptive failure discovery protocol

## Purpose

The Atlas uses model responses to search a procedural stimulus space for reproducible capability
boundaries. This is a discovery instrument, not an unbiased benchmark by itself. Any parameters chosen
after viewing model responses are exploratory. Claims are tested only on a subsequently frozen,
untouched holdout with disjoint seeds and answer values.

The first campaign motivates the initial search family: repeated-event counting produced 17 correct
responses among 80 requests across ten routes. Because 42 of those requests emitted no visible answer,
the adaptive objective does **not** reward no-answer outcomes. It optimizes only substantive incorrect
answers and reports silence separately.

## Why this is not merely another synthetic video benchmark

Controlled synthesis is already an active research area. Video-MME-Logical varies temporal-logical
operations; SynFlash controls sub-second anomalies; VGenST-Bench actively synthesizes diverse scenes;
Moment-Video tests momentary evidence; and EC-Bench decomposes counting into enumeration, grounding,
and aggregation. Video-UQ already uses oracle-frame interventions to distinguish sampling from evidence
extraction. The Atlas should not claim novelty for procedural video, frame-sampling failures, or oracle
interventions alone.

The prospective contribution is a transparent closed loop:

1. define a mechanism-targeted parameter space and exact construction oracle;
2. freeze discovery cases and scorer before querying models;
3. screen cheaply across independently trained model families;
4. select parameter cells by a conservative, predeclared objective;
5. freeze disjoint confirmatory seeds and answer values;
6. evaluate the wider frontier panel exactly once;
7. run a paired slow-motion recovery condition without changing event identity or count;
8. publish all artifacts, responses, hashes, costs, and selection decisions;
9. add a blinded human baseline before describing the task as easy for humans.

## Search family 1: temporal sampling-lattice counting

The generator renders a high-contrast central light at 30 FPS. The semantic content is deliberately
simple; four variables carry the experiment:

- flash duration: 100 or 233 ms;
- onset interval: 400 or 700 ms;
- phase relative to a one-second reference lattice: 125, 375, or 625 ms;
- discovery count: 3, 5, 7, or 9.

This gives 12 parameter cells and 48 frozen discovery videos. Counts 4, 6, 8, and 10 and all seeds at
or above 910000 are reserved before screening. The search can reveal phase-sensitive acquisition,
temporal compression, event individuation, or count aggregation failures, but behavior alone does not
identify which mechanism caused a miss.

There are useful implementation anchors, but not universal assumptions: Google documents one-frame-per-
second default video sampling for Gemini, while Qwen3-VL's reference processor defaults to two FPS and
permits caller control. Gateway routes may use different or undisclosed preprocessing. The phase sweep is
therefore black-box system identification across complete deployed routes, not a claim that every model
uses a one-second lattice.

This experiment also does not, by itself, test whether language-token prediction is the ultimate training
objective or whether hidden reasoning is represented textually. A miss can occur before the language model
receives the evidence. The paired temporal intervention is intended to distinguish one upstream loss from
downstream integration, not to establish a general theory of intelligence from final-answer behavior.

## Search family 2: momentary symbol acquisition

The first holdout transferred strongly to GLM and MiMo but not below 50% for Gemini, Kimi, or Qwen. The
second family therefore removes the predictable rhythm that allowed counting from global timing and
tests acquisition directly. A 20-second clip contains one large, high-contrast answer-bearing symbol for
67, 100, or 133 ms. Four labels are balanced inside every duration/phase cell, temporal locations are
counterbalanced, and all event windows avoid the integer and half-second instants used by common 1–2 FPS
sampling lattices.

The search ranks the easiest of Gemini, Kimi, and Qwen, not their pooled average. A cell cannot advance
unless every route supplies substantive answers below the 50% solve-rate bar. Its untouched holdout uses
16 new seeds and appearances with four examples per label. The exact answer-bearing frame is retained as
an image oracle: native-video failure accompanied by oracle success narrows the boundary toward temporal
acquisition rather than symbol recognition.

This design follows the empirical direction established by Moment-Video, whose 33-model evaluation
reported a best overall accuracy of 39.6% and weaker transient-counting results, while making the Atlas
stimulus generation deterministic and its adaptive selection auditable. Google documents 1 FPS video
sampling for Gemini's File API; Qwen3-VL's official processor defaults to 2 FPS and exposes both frame and
total-pixel budgets. Gateway preprocessing remains opaque, so the phase grid is still a behavioral probe,
not an assertion about a hidden implementation.

Kimi K3's released reference processor samples at 4 FPS, uses uniformly spaced indices over the complete
source, and temporally merges groups of four frames. Confirmatory event times are therefore chosen from
new temporal locations whose answer-bearing windows do not intersect the documented uniform 1, 2, or 4
FPS reference indices. This is a predeclared mechanism probe, not a guarantee that OpenRouter's pinned
upstream uses the reference processor unchanged.

The frozen momentary-symbol holdout rejected that route-level prediction. Gemini solved 7/16 and Qwen
4/16 native videos, with both at 16/16 on critical-frame controls, but Kimi solved 16/16 in both
conditions. The family is therefore not universally admitted. The result is retained because it shows
that released preprocessing code is not sufficient evidence about a hosted route.

## Search families 3–4: compositional counting and wire tracing

Compositional counting uses orderly grids of colored, filled shapes. Every distractor differs from the
target conjunction in at least one attribute and the target count is exact by construction. The screen
was stopped after Gemini solved 22/24 and its hardest cell remained exactly 2/4: further calls could not
make any cell strictly below 50% for every target model.

Wire tracing instead requires preserving one line's identity through 8, 16, 28, or 40 explicit
non-joining crossings. Four endpoints are balanced within each cell, and an independent symbolic trace
verifies the rendered answer. This directly follows TraversalBench's finding that self-intersections are
the dominant localized source of path-traversal errors. An oracle holdout highlights the target wire
without changing its endpoint.

The first wire protocol exposed an evaluation confound: mandatory hidden reasoning consumed the entire
2,048-token allowance for many Kimi and Qwen cases. Those length-truncated records are non-answers and
receive no hardness credit. Current OpenRouter model metadata is now checked before a campaign; the
corrected protocol uses the lowest effort supported by all three routes and enough output budget to
obtain a substantive answer.

Endpoint-only wire tracing did not clear the universal gate: Kimi answered 12/16 under its optional
no-reasoning forced-choice condition. Widely spaced identity-conditioned counts then made Kimi weak but
left Gemini at or above 50% in every cell. The successful refinement composes two requirements and removes
an approximation shortcut: trace one wire through 40 crossings, count only that wire's crossings, and
choose among adjacent exact values 7, 8, 9, and 10.

The untouched 16-case holdout confirmed the setting. Native accuracy was 7/16 for Gemini 3.7 Flash,
1/16 for Kimi K3, and 0/16 for Qwen 3.8 Max. On paired images where the same target path was highlighted
and every relevant crossing numbered, accuracy was 16/16, 13/16, and 15/15 substantive answers;
Qwen's remaining control response stayed pending and was excluded.
This narrows the failure toward sustained identity-conditioned exact counting. It does not establish a
specific hidden representation, and human solvability remains unverified pending a blinded baseline.

The reusable design lesson is to search task compositions and answer precision, not only raw perceptual
degradation. A task can remain readable while becoming diagnostic when (1) two individually available
operations must share one visual intermediate, (2) distractors exercise the same primitive operations,
and (3) adjacent balanced answers make approximate magnitude insufficient. Easier cells remain in the
atlas as controls rather than being discarded.

## Objective and promotion

For each cell, let a substantive answer be a verified, non-empty answer. The primary quantity is the
Wilson 95% lower confidence bound on the substantive failure proportion. It is multiplied by model-family
coverage. Review-routed answers and provider errors are excluded. No-answer outcomes have zero objective
weight and are reported as a separate operational rate. Ties are broken by stable cell ID.

The two highest-scoring cells advance. Confirmation uses unseen even counts, new visual variants, and a
disjoint seed range. Every holdout has a native-rate twin and an exact 4× slow-motion twin made by holding
the same rendered frames longer. Paired recovery would narrow the failure toward acquisition or temporal
compression, but it would still be behavioral—not direct evidence of an internal sampler. A discovery
result can guide the holdout design; it cannot be presented as confirmatory evidence.

## Budget policy

Only the existing prepaid OpenRouter credit may be used. No deposits are authorized. The repository's
cumulative ceiling is $200, its protected reserve is $25, and the initial adaptive screen has an even
stricter $5 protocol ceiling. Cheap diverse routes screen all 48 cases; expensive routes see only promoted
holdouts. A preflight estimate must fit before any request is sent.

## Human validity

Construction-grounded labels establish correctness, not human ease. Until blinded participants are
measured, every generated case is marked `humanSolvability: unverified`. The eventual baseline must report
participant count, exclusion criteria, display conditions, accuracy with intervals, response time, and
case-level results. Pilot self-tests are useful for debugging but are not a publishable human study.

## Reproducible commands

```bash
npm run plan:discovery
npm run generate:discovery
npm run evaluate:discovery
npm run rank:discovery
npm run freeze:confirmatory
```

Paid evaluation remains fail-closed without explicit environment configuration and a frozen protocol.

## Closest primary literature

- [Video-MME-Logical](https://arxiv.org/abs/2606.27828)
- [Moment-Video](https://arxiv.org/abs/2606.02522)
- [EC-Bench](https://arxiv.org/abs/2603.29943)
- [Shot-Aware Frame Sampling / SynFlash](https://arxiv.org/abs/2603.17374)
- [VGenST-Bench](https://arxiv.org/abs/2605.22570)
- [Video-UQ Failure-Mode Benchmarks](https://huggingface.co/LEAP-UQ/video-uq-failure-mode-benchmarks)
- [Frame Sampling Strategies Matter](https://arxiv.org/abs/2509.14769)
- [Discovering Failure Modes in VLMs using RL](https://arxiv.org/abs/2604.04733)
- [Revealing Interpretable Failure Modes of VLMs](https://arxiv.org/abs/2605.12674)
- [TraversalBench](https://arxiv.org/abs/2604.10999)
- [MazeBench](https://arxiv.org/abs/2603.26839)
