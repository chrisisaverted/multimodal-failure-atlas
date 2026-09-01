# Verified multimodal failure findings

Generated from the frozen Atlas evidence on 1 September 2026. This report describes 20 admitted
synthetic families across five hosted frontier routes: Gemini 3.7 Flash, Qwen 3.8 Max, Kimi K3,
Seed 2.1 Turbo, and MiMo 2.5. The first three routes form the core confirmatory cohort. Eighteen
families survived an untouched two-route expansion; two threshold crossings were repaired with newly
preregistered gated holdouts that passed all five routes. Rankings below use all five current routes.

## What “admitted” means

A family is admitted only when every route has at least 16 substantive answers on a frozen,
seed-disjoint native-media holdout and every observed solve rate is strictly below 50%. Provider
errors, empty answers, parser failures, unsupported inputs, and length-exhausted outputs are excluded
from the denominator. They are preserved in the response ledger and may be rerun prospectively to
complete the planned denominator.

The 50% rule is an observed replication gate, not a population claim. With only 16 substantive cases,
some 95% Wilson intervals cross 50%. “Hardest” below is therefore descriptive: it orders the easiest
route's observed accuracy, using pooled accuracy only to break ties. This conservative rule prevents a
weak route from hiding a stronger one. It is not a calibrated item-response scale, and it should not be
generalized to all multimodal models.

Human solvability remains unverified. The construction oracle proves the answer, not that an unaided
human can recover it under the same display conditions.

Every admitted page publishes the exact family-local difficulty setting used for its frozen holdout.
All 20 are now scalar points. The enclosure family was prospectively replaced after a confound audit: every
new case asks for exactly 18 loops, balances answer position, and places distractor counts on both sides.
These values control different generator parameters and are not a shared psychometric scale: 96 on
route-turn integration is not intrinsically harder than 92 on enclosure depth. The admission claim is that
at least one disclosed setting per family clears the below-half gate, not that every possible setting does.

## Image results

| Rank | Family                                    | Gemini | Qwen | Kimi | Seed | MiMo | Easiest | Pooled | Weakest control |
| ---: | ----------------------------------------- | -----: | ---: | ---: | ---: | ---: | ------: | -----: | --------------: |
|    1 | 2D parity-matrix verification             |   5/16 | 4/16 | 4/16 | 3/16 | 1/16 |    5/16 |  17/80 |           16/16 |
|    2 | Dense cross-image change localization     |   4/16 | 2/16 | 5/16 | 4/16 | 3/16 |    5/16 |  18/80 |            9/16 |
|    3 | Visual graph-degree topology              |   4/16 | 5/16 | 2/16 | 3/16 | 5/16 |    5/16 |  19/80 |           11/16 |
|    4 | Rotation-invariant exact correspondence   |   6/16 | 5/16 | 2/16 | 1/16 | 3/16 |    6/16 |  17/80 |            1/16 |
|    5 | Topological enclosure depth               |   4/16 | 5/16 | 3/16 | 2/16 | 6/16 |    6/16 |  20/80 |           15/16 |
|    6 | Occluded cube-stack enumeration           |   3/16 | 6/16 | 6/16 | 3/16 | 3/16 |    6/16 |  21/80 |           15/16 |
|    7 | Maze reachability                         |   6/16 | 3/16 | 4/16 | 5/16 | 5/16 |    6/16 |  23/80 |           14/16 |
|    8 | Identity-conditioned exact crossing count |   7/16 | 0/16 | 1/16 | 3/16 | 3/16 |    7/16 |  14/80 |           13/16 |
|    9 | Global bilateral symmetry verification    |   6/16 | 3/16 | 1/16 | 4/16 | 7/16 |    7/16 |  21/80 |           16/16 |
|   10 | Dense visual XOR composition              |   4/16 | 2/16 | 7/16 | 4/16 | 6/16 |    7/16 |  23/80 |           15/16 |

Parity is the strongest current image result: no route exceeds 5/16, pooled accuracy is 17/80, and
all five controls are 16/16. Change localization and graph topology share the same easiest-route score,
but their weakest controls recover only to 9/16 and 11/16, so they establish hardness more cleanly than
mechanism. Rotation correspondence is likewise behaviorally hard but has a 1/16 expansion-route control;
it cannot currently localize the failure. Enclosure and cube enumeration combine a 6/16 easiest route with
15/16 control floors. Symmetry has a higher 7/16 easiest route but ceiling controls. Exact wire counting has
the lowest pooled score, 14/80, yet its strongest route is near the gate; this is precisely why the
conservative rank is based on the easiest route rather than the pooled mean.

The strongest reusable image recipe is distributed exact verification. Render many locally legible
elements, make the answer depend on a global invariant or one near-miss defect, balance four adjacent
answers, and add an explicit control that externalizes the intermediate representation. Symmetry,
parity, XOR, graph degree, and exact path-conditioned counting are distinct operations, but they share
this useful generator shape.

## Video results

| Rank | Family                                     | Gemini | Qwen | Kimi | Seed | MiMo | Easiest | Pooled | Weakest control |
| ---: | ------------------------------------------ | -----: | ---: | ---: | ---: | ---: | ------: | -----: | --------------: |
|    1 | Identity-conditioned selective flash count |   2/16 | 4/16 | 2/16 | 4/16 | 4/16 |    4/16 |  16/80 |            6/16 |
|    2 | Sequential identity permutation            |   2/16 | 1/16 | 5/16 | 4/16 | 4/16 |    5/16 |  16/80 |            2/16 |
|    3 | Dynamic route-turn integration             |   2/16 | 2/16 | 3/16 | 5/16 | 5/16 |    5/16 |  17/80 |           16/16 |
|    4 | Gated identity-pair collision counting     |   3/16 | 4/16 | 5/16 | 3/16 | 5/16 |    5/16 |  20/80 |           12/16 |
|    5 | Gated exact-frequency set cardinality      |   2/16 | 3/16 | 2/16 | 6/16 | 4/16 |    6/16 |  17/80 |           16/16 |
|    6 | Temporal target-transition counting        |   3/16 | 5/16 | 3/16 | 4/16 | 6/16 |    6/16 |  21/80 |           11/16 |
|    7 | Hidden-trail trajectory topology           |   4/16 | 5/16 | 6/16 | 3/16 | 5/16 |    6/16 |  23/80 |            3/16 |
|    8 | Signed temporal state accumulation         |   5/16 | 3/16 | 4/16 | 6/16 | 5/16 |    6/16 |  23/80 |           13/16 |
|    9 | Dynamic conservation ledger                |   7/16 | 5/16 | 2/16 | 5/16 | 2/16 |    7/16 |  21/80 |           13/16 |
|   10 | Identity-conditioned spatial zone entries  |   4/16 | 7/16 | 4/16 | 5/16 | 5/16 |    7/16 |  25/80 |           16/16 |

Selective flash counting is behaviorally hardest across all five routes: no route exceeds 4/16. Its
weakest control is only 6/16, however, so the current evidence does not isolate temporal acquisition from
later exact counting. Sequential identity permutation has the next-lowest pooled score but an even weaker
2/16 control floor. The strongest diagnostic video result is route-turn integration: its easiest route is
5/16, pooled native accuracy is 17/80, and every control is 16/16. Gated exact-frequency cardinality is also
clean, with a 6/16 easiest route, 17/80 pooled accuracy, and ceiling controls. Its wrong answers are not one
shared off-by-one pattern: Gemini and Kimi concentrate on 4, MiMo on 5, and Qwen on 3–4 despite balanced
truths. That route-specific collapse is consistent with approximate temporal compression but does not by
itself identify an internal mechanism. The gated collision replacement is somewhat weaker but still useful:
all routes remain at or below 5/16 and its conjunctive counter control recovers to at least 12/16.

Hidden-trail topology is behaviorally hard but mechanistically weak. Drawing the trail does not recover
performance; the weakest route is only 3/16 on the control. This directly rules out presenting it as a
localized temporal-memory failure. It may instead reflect geometric intersection counting, clutter,
or an inadequate control. It stays in the atlas because the native holdout passes, with the limitation
prominent.

The most reusable video recipe is sequential state compression. Present a series of individually simple
events while requiring an exact latent state to be updated after each event: current identity mapping,
previous direction, a signed counter, a gated per-location histogram, or a multi-container ledger. Then
externalize that state in a matched control. This attacks the gap between recognizing local frames and
retaining a task-relevant sufficient statistic over the complete clip.

## Response shape, not just accuracy

The five-route matrix also reports a descriptive concentration diagnostic. A route is called
“concentrated” when at least 75% of its 16 substantive native answers select one option despite balanced
ground truth. Dense change localization, spatial zone entry counting, and hidden-trail topology each have
three concentrated routes. By contrast, exact wire counting, enclosure depth, cube enumeration, and the
conservation ledger have zero: their errors remain spread across alternatives even though every route is
below half. Individual extremes include Kimi selecting `+3` on all 16 signed-accumulator cases and Seed
selecting one answer on all 16 transition-count cases.

This distinction prevents an overly simple story. Some failures include a strong stereotyped-output
component; others remain hard without one. Concentration is computed only after verifying that the output
distribution covers every substantive answer. It is not evidence of a shared heuristic, representation, or
internal mechanism, and it does not change the admission rule. The machine-readable endpoint exposes modal
answer, modal share, observed support, and normalized four-option entropy for independent analysis.

## Cross-family lessons

1. **Composition is more reliable than degradation.** Making a primitive smaller, faster, or denser
   often leaves one route strong. Combining two available primitives around one shared intermediate—
   trace then count, bind identity then count, detect then update—produced more transferable failures.
2. **Exactness matters.** Adjacent balanced answers prevent approximate magnitude or generic priors from
   receiving credit. This is useful only when the renderer and oracle make the exact answer unambiguous.
3. **Screens are volatile.** Temporal run-length maximum looked strong in discovery, yet Qwen solved
   10/15 substantive holdout cases at one setting and Gemini solved 9/16 at the harder replacement.
   Discovery performance is not evidence until a disjoint frozen holdout replicates.
4. **A hard control changes the claim.** Controls do not need to pass for behavioral admission, but weak
   recovery forbids a clean localization. The site reports control denominators rather than hiding them.
5. **Long reasoning outputs are a protocol hazard.** Some routes consumed their allowance before emitting
   an answer. Prospective completion requests were used to reach 16 substantive cases, while every
   exhausted request remained disclosed and received no hardness credit.
6. **Hosted routes are the evaluated systems.** Released preprocessing code can motivate a screen but
   does not establish how a gateway deployment samples or compresses media. The claims attach to the
   named route and timestamp, not an abstract model family.

## What would strengthen the evidence next

- Run a blinded, predeclared human study on the exact native artifacts and display protocol.
- Increase confirmatory denominators and add fresh model snapshots without tuning generators on them.
- Replicate through direct-provider APIs where native video is supported, separating gateway behavior.
- Replace weak controls with factorial interventions that isolate acquisition, state retention, and
  final computation independently.
- Freeze complete difficulty curves, not only one admitted point, to estimate where each route crosses
  the capability boundary.
- Treat this first 20-family campaign as hypothesis generation for a smaller preregistered benchmark.

Core source data are in `src/data/admitted-families.json` and `src/data/admitted-runs.json`; the derived
five-route matrix is published at `/evidence/five-route-matrix.json`, and expansion responses remain in the
separate replication audit. Re-running `npm run publish:admitted` reconstructs the core evidence from frozen
plans, manifests, and append-only result files and fails closed if any route falls below the
substantive-answer minimum or reaches 50%.
