# Admission contract

## Primary bar

A failure mode is admitted only when at least one frozen difficulty setting gives each prespecified
target model a substantive solve rate below 50% on an untouched, balanced holdout. “Substantive” means
a verified, non-empty answer. Easier settings may remain as controls that show the capability boundary.
Also report strict operational accuracy over all requests.

The all-model bottleneck is the maximum model-level solve rate. A pooled average is insufficient: one
model at 70% and four models at 10% fails admission.

## Evidence strength

- Discovery promotion: at least four substantive answers per target model per cell and observed solve
  rate below 50% for every model.
- Confirmatory admission: at least 16 balanced cases per target model. Report the Wilson 95% upper
  bound. Four or fewer correct among 16 substantive answers places that upper bound below 50%; five
  does not.
- Silence: no-answer, refusal, error, and pending-review outcomes receive zero selection weight and do
  not satisfy minimum coverage.
- Human gate: construction validity is necessary but not sufficient. Human ease remains unverified
  until blinded participants are measured.

## Leakage controls

Before discovery calls, freeze the search grid, scorer, routes, and reserved holdout domain. Before
holdout calls, freeze selected cells and all holdout artifacts. Do not alter a failed holdout and call
its replacement confirmatory; that begins a new discovery cycle.

Use balanced labels within each cell and holdout. Random seeds alone do not establish out-of-
distribution status. Reserve meaningful latent values and visual/temporal realizations.

If a model publishes its sampler, compute candidate event windows against the exact reference indices
rather than assuming integer-second alignment. Kimi K3's released reference processor, for example,
uses uniformly spaced indices at a default 4 FPS; Qwen3-VL defaults to 2 FPS, while Gemini documents 1
FPS File API storage. Record these as route hypotheses because gateways may override defaults.

## Mechanism controls

When the hypothesis concerns evidence acquisition or compression, pair the primary stimulus with a
positive control that preserves the answer-bearing evidence. Examples include the exact critical frame,
a native-resolution crop, dense uniformly sampled frames, or a slowed identical-frame video. A positive
oracle result plus a primary-condition failure narrows the mechanism; it does not expose proprietary
internals directly.
