---
name: multimodal-hardness-discovery
description: Design and audit synthetic image/video searches intended to find human-solvable failure regions shared by every target frontier multimodal model. Use for generator optimization, model-guided discovery, frozen holdouts, and failure-mode admission; not for ordinary benchmark reporting.
---

# Multimodal hardness discovery

Optimize for a reproducible cross-model capability boundary, not a spectacular anecdote or pooled
failure rate. Read [references/admission-contract.md](references/admission-contract.md) before any paid
screen or holdout.

## Workflow

1. State one proposed bottleneck and at least two alternative explanations.
2. Build a deterministic parameterized generator with exact answers and balanced labels within every
   searchable cell.
3. Reserve disjoint holdout seeds, appearances, positions/times, and answer-bearing values before the
   first model response.
4. Screen the strongest practical independently trained model families. Rank each cell by its easiest
   target model; never let weaker models hide a strong model's success.
5. Give no hardness reward to silence, refusals, errors, or ambiguous outputs. Require substantive
   coverage from every target model.
6. Freeze one or more winning cells, the exact scorer, routes, provider policy, prompt, and budget.
7. Evaluate the holdout once. Use a critical-frame, crop, dense-frame, or other evidence-preserving
   oracle when it can distinguish acquisition loss from downstream reasoning.
8. Retain a failure mode only if at least one frozen difficulty setting leaves every target model below
   the declared solve-rate bar on the untouched holdout. Easier settings may remain as boundary controls.
   Report observed and Wilson-bounded results separately.
9. Do not call a task easy for people until a blinded human baseline has been collected.

Prefer four-way balanced identification or enumeration over unbalanced yes/no questions when missing
evidence would otherwise be masked by a default response. For video sampling research, vary event
duration, phase, temporal location, clip length, and visual appearance independently. For image
compression research, vary native scale, resize phase, crowding, and answer-location while preserving
a native-resolution oracle.

Preserve every artifact, content hash, prompt, raw response, route, endpoint revision, scorer decision,
and provider-reported cost. New evidence should refine this skill; do not generalize one route-specific
failure into a universal rule.
