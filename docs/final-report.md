# Build and evaluation report

Release audit updated 1 September 2026.

## Current release

- Public static application: <https://chrisisaverted.github.io/multimodal-failure-atlas/>
- Machine-readable five-route matrix: <https://chrisisaverted.github.io/multimodal-failure-atlas/evidence/five-route-matrix.json>
- 52 mapped image, video, audiovisual, multi-image, and interleaved-media failure families
- 20 strictly admitted synthetic families: 10 image and 10 video
- Three frozen admission routes: Gemini 3.7 Flash, Qwen 3.8 Max, and Kimi K3
- Two frozen route-expansion routes: Seed 2.1 Turbo and MiMo 2.5
- 28 deterministic browser generators with exact construction answers and family-local difficulty controls, including all 20 current admitted families (10 image and 10 video)
- 640 native/control artifacts in the admitted manifests, totaling 106,125,005 bytes
- An answer-free human instrument with eight blocks, 40 trials per block, and all 320 native cases
- A static response ledger, exact manifests, raw external-replication evidence, and rejected-search ledger

## Admission contract

A family is admitted only when every prespecified admission route supplies at least 16 substantive answers
on an untouched, seed-disjoint native-media holdout and every observed solve rate is strictly below 50%.
Answer labels are balanced. Media, prompt, plan, protocol, route, scorer, and response identities are frozen
and hashed. Silence, provider errors, empty responses, unsupported media, parser ambiguity, and output or
reasoning exhaustion never count as model failures.

The current admitted ledger contains 2,064 requests and 2,047 substantive answers. Ten explicit terminal
answers were recovered under an answer-key-blind declaration rule; 17 unresolved or empty requests remain
visible and excluded. The publisher fails closed if a core or embedded expansion route lacks the required
denominator or reaches 50%.

Observed below-half is a finite-holdout gate, not a population claim. Several 95% Wilson intervals cross
50%. Human solvability is unverified until blinded participants are measured under the published protocol.

## Current findings

The conservative hardness order uses the easiest of all five current routes, with pooled accuracy only as a tie-breaker.
This prevents a weak route from hiding a stronger route.

The strongest image result is parity-matrix verification: no route exceeds 5/16, pooled accuracy is 17/80,
and every control is 16/16. Change localization and graph topology also remain at or below 5/16, but their
weakest controls are only 9/16 and 11/16. Exact wire counting has the lowest pooled image score, 14/80, but
one route reaches 7/16, so it is not ranked first.

Selective flash counting is behaviorally hardest across all five routes: no route exceeds 4/16 and pooled
accuracy is 16/80, but its weakest control is only 6/16. The cleanest hard video result is dynamic route-turn
integration: no route exceeds 5/16, pooled accuracy is 17/80, and every control is 16/16. Gated exact-frequency
cardinality is similarly diagnostic at an easiest-route score of 6/16, pooled 17/80, and ceiling controls.

The strongest reusable image recipe is distributed exact verification: make the answer depend on a global
invariant or one near-miss defect, balance adjacent answers, and expose the missing intermediate in a
matched control. Symmetry, parity, XOR, graph degree, and path-conditioned counting instantiate distinct
operations within this shape.

The strongest reusable video recipe is conditional sequential state: each event is locally legible, but the
answer requires an exact identity map, signed ledger, direction state, set, or per-location histogram. A
successful repair makes two predicates independently insufficient, includes distractors satisfying either
predicate alone, varies both targets by case, and exposes only the conjunction's sufficient statistic in the
control.

Full scores, uncertainty, control denominators, and limitations are in
[`verified-findings.md`](verified-findings.md).

## Frozen route expansion and repairs

The Seed/MiMo campaign was frozen after the original 20-family core campaign. It contains 1,408 attempts,
of which 1,391 are canonical, and cost $1.561965. Eighteen original generators remained complete and below
half on both routes.

Two families crossed the threshold:

- Seed solved exactly 8/16 pair-only collision-counting cases.
- MiMo solved 9/16 ungated temporal set-cardinality cases.

Neither result was hidden or retroactively rescored. Both original campaigns remain on the public
replication page. New holdout reservations were made before repair screening.

The gated pair repair uses 32 labeled events, a variable target pair, a variable target frame color, and six
target-pair collisions under the wrong color. Gemini, Qwen, Kimi, Seed, and MiMo scored 3/16, 4/16, 5/16,
3/16, and 5/16. Controls recovered to 16/16, 15/16, 16/16, 12/16, and 16/16.

The first temporal repair—color-gated distinct-set cardinality—passed all five eight-case screens but was
rejected when Kimi reached 8/15 on its untouched holdout. The second repair asks how many cells occur
exactly twice under one target frame color across 40 flashes, with eight wrong-color target-cell echoes.
Gemini, Qwen, Kimi, Seed, and MiMo scored 2/16, 3/16, 2/16, 6/16, and 4/16; every visible-histogram control
was 16/16.

These reversals are central evidence about the search process: an eight-case screen is a filter, not a
finding, and a new route is a generator audit rather than another score to pool away.

## Human validation

Construction-grounded answers establish truth, not ease. The public human instrument contains every native
holdout case exactly once across eight deterministic blocks. Each participant receives two cases from every
family. Images remain visible until response; videos play once at 1× and unlock answers only after playback.
The browser stores answer-free packets locally and never transmits them.

The proposed confirmatory design uses 80 participants—10 per block—so each item receives 10 independent
judgments. Ethics review or exemption, consent, recruitment, exclusion rules, and a crossed participant/item
analysis must be fixed before collection. No human-accuracy claim is currently made.

## Reproducibility and deployment

`npm run check` runs type checking, linting, all unit and contract tests, admitted-manifest byte audits, and a
production build. GitHub Pages repeats the source gate, static build, and internal link/media audit before
deployment. Paid evaluation remains outside public request handlers, so site traffic cannot spend model
credit or expose credentials.

The public failure pages serve exact frozen PNG/MP4 artifacts, model denominators and Wilson intervals,
plan hashes, response-level records, route-expansion confirmation, alternative explanations, and
disconfirming tests. Selected admitted families also expose fresh educational generators. Their generated
seeds are deliberately not added to scored evidence.

## Cost and credential audit

The user funded a $200 prepaid OpenRouter balance and authorized no further deposits. The repository retains
a $200 cumulative ceiling, a protected $25 reserve, and a $25 default campaign cap. Across 7,800 unique
recorded requests, reconciled model-evaluation spend is $111.608224. The public site and repository contain
no provider credentials. Hosting remains GitHub Pages at zero recurring charge.

The detailed reconciliation is in [`cost-ledger.csv`](cost-ledger.csv).

## Remaining limits

- Results apply to pinned hosted routes, not to all checkpoints or all preprocessing configurations.
- Behavioral interventions do not identify hidden representations without open-model probing and activation
  experiments.
- One difficulty point per admitted family is confirmed; full monotonic psychometric curves are not yet
  established.
- Route-expansion results are a generator audit, not statistically independent samples from a population of
  models.
- Human-model separation remains a hypothesis until blinded human data are collected.
