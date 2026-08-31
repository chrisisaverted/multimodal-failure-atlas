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
