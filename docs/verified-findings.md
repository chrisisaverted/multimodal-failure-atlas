# Verified multimodal failure findings

Generated from the frozen Atlas evidence on 1 September 2026. This report describes 20 admitted
synthetic families evaluated through three hosted frontier routes: Gemini 3.7 Flash, Qwen 3.8 Max,
and Kimi K3.

## What “admitted” means

A family is admitted only when every route has at least 16 substantive answers on a frozen,
seed-disjoint native-media holdout and every observed solve rate is strictly below 50%. Provider
errors, empty answers, parser failures, unsupported inputs, and length-exhausted outputs are excluded
from the denominator. They are preserved in the response ledger and may be rerun prospectively to
complete the planned denominator.

The 50% rule is an observed replication gate, not a population claim. With only 16 substantive cases,
some 95% Wilson intervals cross 50%. “Hardest” below is therefore descriptive: it orders the pooled
observed correct count across the three prespecified routes. It is not a calibrated item-response scale,
and it should not be generalized to all multimodal models.

Human solvability remains unverified. The construction oracle proves the answer, not that an unaided
human can recover it under the same display conditions.

Every admitted page publishes the exact family-local difficulty setting used for its frozen holdout.
These 0–100 values control different generator parameters and are not a shared psychometric scale: 96
on route-turn integration is not intrinsically harder than 57 on enclosure depth. The admission claim is
that at least one disclosed setting per family clears the below-half gate, not that every setting does.

## Image results

| Descriptive rank | Family                                    | Gemini | Qwen | Kimi | Pooled | Weakest control |
| ---------------: | ----------------------------------------- | -----: | ---: | ---: | -----: | --------------: |
|                1 | Identity-conditioned exact crossing count |   7/16 | 0/16 | 1/16 |   8/48 |           13/16 |
|                2 | Global bilateral symmetry verification    |   6/16 | 3/16 | 1/16 |  10/48 |           16/16 |
|               3= | Dense cross-image change localization     |   4/16 | 2/16 | 5/16 |  11/48 |            9/16 |
|               3= | Visual graph-degree topology              |   4/16 | 5/16 | 2/16 |  11/48 |           16/16 |
|               5= | Rotation-invariant exact correspondence   |   6/16 | 5/16 | 2/16 |  13/48 |           14/16 |
|               5= | Dense visual XOR composition              |   4/16 | 2/16 | 7/16 |  13/48 |           15/15 |
|               5= | Maze reachability                         |   6/16 | 3/16 | 4/16 |  13/48 |             9/9 |
|               5= | 2D parity-matrix verification             |   5/16 | 4/16 | 4/16 |  13/48 |           16/16 |
|                9 | Occluded cube-stack enumeration           |   3/16 | 6/16 | 6/16 |  15/48 |           16/16 |
|               10 | Topological enclosure depth               |   6/16 | 7/16 | 5/16 |  18/48 |           10/16 |

The cleanest image localizations are bilateral symmetry, graph topology, parity, cube enumeration,
and the fully answered maze controls: a simpler evidence-preserving presentation recovers strongly
while native accuracy remains low. Exact wire counting is the lowest pooled score, but Gemini is near
the gate at 7/16 and the Kimi control reaches 13/16 rather than ceiling. The most cautious image claims
are change localization and enclosure depth because their weakest controls recover only to 9/16 and
10/16. Those results establish task difficulty but do not isolate a single causal bottleneck.

The strongest reusable image recipe is distributed exact verification. Render many locally legible
elements, make the answer depend on a global invariant or one near-miss defect, balance four adjacent
answers, and add an explicit control that externalizes the intermediate representation. Symmetry,
parity, XOR, graph degree, and exact path-conditioned counting are distinct operations, but they share
this useful generator shape.

## Video results

| Descriptive rank | Family                                     | Gemini | Qwen | Kimi | Pooled | Weakest control |
| ---------------: | ------------------------------------------ | -----: | ---: | ---: | -----: | --------------: |
|                1 | Dynamic route-turn integration             |   2/16 | 2/16 | 3/16 |   7/48 |           16/16 |
|               2= | Identity-conditioned selective flash count |   2/16 | 4/16 | 2/16 |   8/48 |           16/16 |
|               2= | Sequential identity permutation            |   2/16 | 1/16 | 5/16 |   8/48 |           13/16 |
|                4 | Identity-pair collision counting           |   4/16 | 3/16 | 3/16 |  10/48 |           12/16 |
|                5 | Temporal target-transition counting        |   3/16 | 5/16 | 3/16 |  11/48 |           16/16 |
|                6 | Signed temporal state accumulation         |   5/16 | 3/16 | 4/16 |  12/48 |           13/16 |
|                7 | Temporal set cardinality                   |   5/16 | 4/16 | 4/16 |  13/48 |           16/16 |
|                8 | Dynamic conservation ledger                |   7/16 | 5/16 | 2/16 |  14/48 |           16/16 |
|               9= | Identity-conditioned spatial zone entries  |   4/16 | 7/16 | 4/16 |  15/48 |           16/16 |
|               9= | Hidden-trail trajectory topology           |   4/16 | 5/16 | 6/16 |  15/48 |            4/15 |

Route-turn integration is the strongest current result: all three routes are at or below 3/16 and the
explicit running-counter control is 16/16 throughout. Selective flash counting and transition counting
also combine low native accuracy with ceiling controls. Sequential swaps and pair-specific collisions
show strong but incomplete control recovery, so identity maintenance is a plausible boundary rather
than a uniquely identified cause.

Hidden-trail topology is behaviorally hard but mechanistically weak. Drawing the trail does not recover
performance; the weakest route is only 4/15 on the control. This directly rules out presenting it as a
localized temporal-memory failure. It may instead reflect geometric intersection counting, clutter,
or an inadequate control. It stays in the atlas because the native holdout passes, with the limitation
prominent.

The most reusable video recipe is sequential state compression. Present a series of individually simple
events while requiring an exact latent state to be updated after each event: current identity mapping,
previous direction, a signed counter, a set of visited locations, or a multi-container ledger. Then
externalize that state in a matched control. This attacks the gap between recognizing local frames and
retaining a task-relevant sufficient statistic over the complete clip.

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

The source of truth is `src/data/admitted-families.json`; response-level records are in
`src/data/admitted-runs.json`. Re-running `npm run publish:admitted` reconstructs both from frozen plans,
manifests, and append-only result files and fails closed if any route falls below the substantive-answer
minimum or reaches 50%.
