# Draft preregistration: sufficient-statistic intervention ladders

Status: design draft. This document is not frozen and no confirmatory data have been collected under it.

## Research question

When a frontier video-language route fails an exact synthetic task, what is the smallest task-relevant state
that must be externalized before accuracy recovers? The study distinguishes evidence acquisition, event
binding, structured state maintenance, and final exact readout without treating verbal chain-of-thought as a
faithful view of hidden computation.

## Families

The study uses three already admitted but computationally distinct video families.

1. **Route-turn integration:** scalar recurrent state (`previous direction`, `turn count`). Current
   five-route scores are 2/16, 2/16, 3/16, 5/16, and 5/16 with 16/16 running-count controls.
2. **Gated exact-frequency set cardinality:** structured state (a target-color-conditioned 6×6 histogram,
   exact-twice predicate, and final cardinality). Current five-route scores are 2/16, 3/16, 2/16, 6/16, and
   4/16 with 16/16 histogram controls.
3. **Gated pair collision counting:** conjunctive event binding (unordered identity pair, frame-color gate,
   and exact accumulator). Current five-route scores are 3/16, 4/16, 5/16, 3/16, and 5/16; controls recover
   to at least 12/16.

These families are not interchangeable variants. They require a scalar transition state, a spatially indexed
histogram, and a relational conjunction respectively.

## Intervention ladders

Every intervention preserves event identity, timing, answer, question, option order, canvas size, codec, and
duration. Added state is rendered in a reserved non-occluding margin. Each rung contains all information from
the previous rung plus one prespecified sufficient statistic.

### Route turns

1. Native moving marker, no trail.
2. Persistent trajectory only.
3. Persistent trajectory plus current direction.
4. Direction-change markers at qualifying transitions.
5. Exact running turn count.
6. Text event stream containing every segment direction but no computed count.

### Gated exact frequency

1. Native labeled flashes.
2. Marker indicating whether the current frame passes the target-color gate.
3. Persistent visited flags for accepted cells.
4. Persistent accepted-event count in every cell.
5. Highlight on cells whose current accepted count equals two.
6. Exact current cardinality of the highlighted set.

### Gated pair collisions

1. Native labeled collisions.
2. Marker indicating whether the current pair matches.
3. Separate marker indicating whether the current frame color matches.
4. One conjunction marker that activates only when both predicates match.
5. Exact running conjunction count.
6. Text event stream listing pair and gate for every event but no computed count.

The text-event condition is deliberately not ordered as “more informative” than every visual rung. It is a
cross-modal substitution used to test whether exact update failure survives after visual event extraction.

## Stimulus design

- Freeze five family-local difficulty settings around the current hard point before any new model response.
- Generate 32 disjoint cases per setting and intervention: eight cases per answer label.
- Use new seed ranges, visual variants, event orders, target predicates, and answer-bearing values.
- Keep the construction oracle identical across intervention twins and verify media hashes independently.
- Reserve an additional 16-case audit set per family that is not used for model or human boundary fitting.
- Reject any setting with an oracle collision, illegible label at the declared display size, or answer
  imbalance before evaluation.

Difficulty is not assumed monotonic. Event count, density, speed, distractor count, and trap count remain
separate recorded parameters even if the public interface presents one coordinate.

## Model cohorts

The causal-development cohort should use open-weight video models for which frame sampling, token merging,
and visual-token budgets can be changed. At minimum, include the released Qwen3-VL and Kimi K3 pipelines at
fixed checkpoints and inference software revisions.

The hosted audit cohort uses the five current Atlas routes. Hosted results test whether the behavioral
intervention ordering transfers; they do not support claims about hidden architecture. Provider fallback and
data collection remain disabled. A cost plan and protected reserve must be frozen before any call.

## Primary outcomes

For each family and route:

1. Accuracy at each difficulty-by-intervention cell over substantive answers.
2. The earliest visual intervention rung whose lower interval exceeds the native upper interval by a
   prespecified margin.
3. Change in the fitted difficulty boundary at 50% accuracy.
4. Exact intermediate-state accuracy at randomly selected update probes.

The principal cross-family test is an interaction between family state type and intervention rung. A generic
“more pixels help” effect is not the target claim.

## Hypotheses and disconfirmation

- **Acquisition account:** denser or accepted-event markers restore performance. Failure to recover despite
  oracle event markers weakens this account.
- **Binding account:** pair/gate or location markers restore performance before exact counts are shown.
  Recovery only when the final counter is visible weakens this account.
- **State-maintenance account:** event recognition is accurate but intermediate state diverges; persistent
  structured state restores performance. Accurate state probes with wrong final answers weaken this account.
- **Exact-readout account:** all intermediate states are correct, but only the explicit final count restores
  the answer. Incorrect intermediate probes weaken this account.
- **Text-only reasoning account:** a text event stream selectively restores tasks that fail in native video.
  Equal failure on exact text streams weakens a visual-to-language transfer explanation; recovery from visual
  structured-state rungs weakens the claim that only textual scratchpads can support the computation.

No end-to-end result alone establishes where a proprietary model samples frames or whether its hidden
reasoning is linguistic.

## Human study

Run a blinded pilot before the confirmatory human sample. Select difficulty cells only from a preregistered
development range; do not choose individual cases after seeing human errors. The confirmatory criterion for
a human-model separation is:

- at least 10 independent judgments per item;
- a prespecified human lower interval above 80%;
- every evaluated model route below 50% observed accuracy on the same native cell;
- median completion time below a prespecified family-specific ceiling;
- no material reversal in the reserved audit set.

Ethics review or exemption, consent, recruitment, accessibility, compensation, exclusions, and privacy must
be finalized before collecting identifiable or publishable participant data.

## Analysis

Fit a hierarchical logistic model with crossed route, item, and difficulty effects and a family-specific
intervention slope. Report raw proportions and Wilson intervals alongside the model. Correct primary
family-level comparisons with Holm's procedure; label every other contrast exploratory. Treat hosted routes
as fixed systems, not independent draws from a population of models.

Non-substantive model outputs are never incorrect answers. Preserve them, report operational rates, and use
only prospective case-specific completion protocols to fill planned denominators. Human exclusions are fixed
before unblinding and never depend on correctness.

## Reproducibility gate

Before confirmatory execution, freeze:

- generator and renderer revisions;
- all discovery, confirmatory, and audit seed reservations;
- model checkpoints, preprocessing, frame budgets, prompts, scorers, and answer adjudication;
- sample sizes, exclusion rules, estimands, and multiplicity correction;
- exact manifests and hashes;
- cost ceilings and stopping conditions.

Publish every artifact, response, intervention mapping, rejection, and analysis script. A passed development
screen is not included in the confirmatory result.
