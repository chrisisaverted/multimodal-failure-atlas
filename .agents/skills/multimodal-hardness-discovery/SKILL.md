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
   coverage from every target model. Query current route metadata before freezing reasoning controls;
   an unsupported effort value or a reasoning trace that exhausts the output allowance is a protocol
   failure, not a model failure.
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

When a single primitive transfers too well, compose two observed weaknesses around a shared visual
intermediate—for example, preserve one identity and then count only its events. Treat answer spacing as
a difficulty variable: adjacent balanced numeric options test exactness, while widely separated options
may reward approximate magnitude. Never increase nominal difficulty by making evidence ambiguous or
human-illegible.

Audit whether the displayed difficulty coordinate is accidentally an answer-bearing variable. When an
exact-count task must vary the count to balance labels, publish the tested values as an answer-balanced
stratum rather than pretending every case used the first scalar value. A proposed fixed-structure repair
must also be checked for ordinal shortcuts: if the four panels contain exactly the four queried counts,
the lowest and highest questions reduce to picking the visually smallest or largest panel. Inspect rendered
artifacts before the first paid call, and balance target rank independently of answer position.

Preserve every artifact, content hash, prompt, raw response, route, endpoint revision, scorer decision,
and provider-reported cost. New evidence should refine this skill; do not generalize one route-specific
failure into a universal rule.

Keep logical evaluation identity separate from request identity. A prospective retry of the same frozen
case can legitimately reuse its deterministic evaluation ID while receiving a new provider request ID.
Deduplicate spend only by provider request ID; if a provider ID is absent, conservatively count every
append-only source row. Treat conflicting copies of one provider request as an audit failure.

Require at least 16 substantive native answers per route for publication. If a request exhausts its
output allowance before emitting an answer, preserve it as non-substantive and use a prospective,
case-specific completion plan to fill the denominator; never overwrite the first attempt. Confirm the
completed case uses the same frozen stimulus, prompt, scorer, route, and sampling settings apart from the
predeclared larger output allowance.

Treat discovery-to-holdout transfer as a first-class failure risk. A strong 8-case screen can reverse on
16 new seeds, so never describe the screen as a model weakness after the holdout rejects it. Keep rejected
families and their rejection threshold in the ledger. When sharding an interleaved plan, inspect the
manifest condition attached to each case; positional offsets do not imply an all-native or all-control
shard.

Controls govern attribution, not behavioral admission. A native task may remain a valid hard family when
its control is also hard, but the result then cannot localize the bottleneck that control was meant to
isolate. Report every control denominator and name the surviving alternatives explicitly.

Use untouched route replication as a generator audit. A family that passes the original cohort but reaches
the rejection threshold on a new route remains a valid result for the named original cohort, but it is not
cross-route robust. Preserve the negative replication and begin a new reservation-backed cycle rather than
retrofitting the old holdout. A useful repair is often conjunctive gating: make every event locally legible,
vary two target predicates by case, balance each predicate, and include events satisfying either predicate
alone so neither shortcut is sufficient. Pair it with a control that exposes only the conjunction's running
sufficient statistic.

For answer-key-blind recovery, distinguish intermediate work from a terminal declaration. A clearly labeled
or standalone final line may be substantive even when earlier prose contains running counts. Do not infer an
answer from a partial analysis, and leave genuinely conflicting or hedged conclusions excluded. If no unique
terminal claim exists, preserve the attempt and use a prospective exact-answer completion protocol.

When a project asks for several modes, maintain a family ledger keyed by the latent capability being
tested. Changing only density, duration, count range, visual skin, prompt, or answer spacing creates a
new cell—not a new failure family. Maintain separate image and video cohorts because unsupported
modality routes are not negative evidence. A completion count includes only frozen holdouts that pass
the declared observed bar; report separately whether their Wilson interval also clears the bar and
whether a human baseline has been measured.

Rank admitted families conservatively by the easiest target route. Pooled accuracy is a secondary
descriptor or tie-breaker only; it must never make a family appear hard because one route is unusually
weak. When one route reaches the rejection threshold during a sequential screen, stop unneeded remaining
requests and preserve the partial records.
