# Failure-family admission ledger

This ledger counts latent capability families, not prompts, skins, answer ranges, or difficulty cells.
An observed pass means every prespecified route is strictly below 50% on a balanced frozen 16-case
holdout, with solve rates calculated only over substantive answers. Silence, parser failures, provider
errors, unsupported media, and reasoning exhaustion are disclosed and never scored as failures.
Wilson-qualified and human-validated are stricter, separately reported states.

## Image families

| Family                                    | State                   | Gemini | Qwen | Kimi | Seed | MiMo | Weakest control | Human      |
| ----------------------------------------- | ----------------------- | -----: | ---: | ---: | ---: | ---: | --------------: | ---------- |
| Identity-conditioned exact crossing count | five-route holdout pass |   7/16 | 0/16 | 1/16 | 3/16 | 3/16 |           13/16 | unverified |
| Topological enclosure depth               | five-route holdout pass |   4/16 | 5/16 | 3/16 | 2/16 | 6/16 |           15/16 | unverified |
| Rotation-invariant exact correspondence   | five-route holdout pass |   6/16 | 5/16 | 2/16 | 1/16 | 3/16 |            1/16 | unverified |
| Global bilateral symmetry verification    | five-route holdout pass |   6/16 | 3/16 | 1/16 | 4/16 | 7/16 |           16/16 | unverified |
| Occluded cube-stack enumeration           | five-route holdout pass |   3/16 | 6/16 | 6/16 | 3/16 | 3/16 |           15/16 | unverified |
| Dense visual XOR composition              | five-route holdout pass |   4/16 | 2/16 | 7/16 | 4/16 | 6/16 |           15/16 | unverified |
| Dense cross-image change localization     | five-route holdout pass |   4/16 | 2/16 | 5/16 | 4/16 | 3/16 |            9/16 | unverified |
| Maze reachability                         | five-route holdout pass |   6/16 | 3/16 | 4/16 | 5/16 | 5/16 |           14/16 | unverified |
| Visual graph-degree topology              | five-route holdout pass |   4/16 | 5/16 | 2/16 | 3/16 | 5/16 |           11/16 | unverified |
| 2D parity-matrix verification             | five-route holdout pass |   5/16 | 4/16 | 4/16 | 3/16 | 1/16 |           16/16 | unverified |

The published enclosure family is the fixed-target dense replacement: every case asks for 18 boundaries,
the target is neither systematically smallest nor largest, and all three exact-count controls recover to
16/16; the two expansion controls recover to 15/16 and 16/16. The earlier answer-balanced 57–72 stratum
remains preserved but is superseded. Rotation required
two prospective Qwen reruns after length-exhausted responses; the final native denominator is 16
substantive answers from 18 requests.

## Video families

Gemini 3.7 Flash, Qwen 3.8 Max, and Kimi K3 are the core cohort; Seed 2.1 Turbo and MiMo 2.5 are the
untouched expansion cohort. Every listed route accepted the generated MP4 inputs.

| Family                                     | State                   | Gemini | Qwen | Kimi | Seed | MiMo | Weakest control | Human      |
| ------------------------------------------ | ----------------------- | -----: | ---: | ---: | ---: | ---: | --------------: | ---------- |
| Identity-conditioned spatial zone entries  | five-route holdout pass |   4/16 | 7/16 | 4/16 | 5/16 | 5/16 |           16/16 | unverified |
| Gated identity-pair collision counting     | five-route holdout pass |   3/16 | 4/16 | 5/16 | 3/16 | 5/16 |           12/16 | unverified |
| Sequential identity permutation            | five-route holdout pass |   2/16 | 1/16 | 5/16 | 4/16 | 4/16 |            2/16 | unverified |
| Identity-conditioned selective flash count | five-route holdout pass |   2/16 | 4/16 | 2/16 | 4/16 | 4/16 |            6/16 | unverified |
| Temporal target-transition counting        | five-route holdout pass |   3/16 | 5/16 | 3/16 | 4/16 | 6/16 |           11/16 | unverified |
| Gated exact-frequency set cardinality      | five-route holdout pass |   2/16 | 3/16 | 2/16 | 6/16 | 4/16 |           16/16 | unverified |
| Dynamic route turn integration             | five-route holdout pass |   2/16 | 2/16 | 3/16 | 5/16 | 5/16 |           16/16 | unverified |
| Dynamic conservation ledger                | five-route holdout pass |   7/16 | 5/16 | 2/16 | 5/16 | 2/16 |           13/16 | unverified |
| Hidden-trail trajectory topology           | five-route holdout pass |   4/16 | 5/16 | 6/16 | 3/16 | 5/16 |            3/16 | unverified |
| Signed temporal state accumulation         | five-route holdout pass |   5/16 | 3/16 | 4/16 | 6/16 | 5/16 |           13/16 | unverified |

The collision row is the preregistered gated replacement. Seed 2.1 Turbo scored 3/16 native versus
12/16 control and MiMo 2.5 scored 5/16 versus 16/16 on the same untouched holdout, so all five
prespecified routes are below half. Every case has 32 labeled events, a variable target pair, a variable
target frame color, and six target-pair collisions under the wrong color. The older pair-only campaign
remains preserved but is superseded after Seed reached exactly 8/16 in post-confirmatory replication.

The frequency row is the second preregistered repair. Gemini, Qwen, and Kimi scored 2/16, 3/16, and
2/16; Seed scored 6/16 and MiMo scored 4/16. All five visible-histogram controls recovered to 16/16.
The task has 40 labeled flashes, a variable target frame color, eight wrong-color echoes of target cells,
and asks for the number of cells occurring exactly twice. One Gemini answer was recovered by the frozen
answer-key-blind declaration rule; no request error, silence, or exhausted output entered a denominator.

## Rejected or superseded searches

| Search                                     | Reason it does not count                                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single momentary symbol                    | Kimi solved the frozen native holdout 16/16.                                                                                                                   |
| Lattice flash counting                     | Gemini and Kimi each solved 12/16; Qwen solved 10/16.                                                                                                          |
| Compositional static counting              | Gemini solved 22/24; the hardest cell was exactly 2/4.                                                                                                         |
| 64-crossing endpoint wire tracing          | Discovery did not replicate: Gemini solved 10/16 and Kimi 9/16 on the frozen holdout.                                                                          |
| 34×34 change localization                  | Gemini reached exactly 8/16 on the frozen holdout; a 42×42 replacement is a new cycle.                                                                         |
| Geometric mirror ray tracing               | Gemini solved 5/8 in the harder discovery cell.                                                                                                                |
| Three-fold paper punching                  | Gemini solved 8/8 and Kimi reached exactly 4/8.                                                                                                                |
| Four-fold paper propagation                | The denser replacement remained easy for Gemini at 6/8.                                                                                                        |
| Strip-jigsaw ordering                      | Gemini solved 8/8.                                                                                                                                             |
| Ribbon occlusion ordering                  | Gemini and Kimi solved 8/8.                                                                                                                                    |
| Multiple-object endpoint tracking          | Gemini solved 7/8.                                                                                                                                             |
| Simple temporal ordering                   | Kimi solved 8/8.                                                                                                                                               |
| Duration comparison                        | Gemini reached 4/8 and Kimi solved 7/8.                                                                                                                        |
| Periodic anomaly detection                 | Kimi solved 5/8.                                                                                                                                               |
| Synchrony detection                        | Qwen solved 8/8.                                                                                                                                               |
| Repeated 180 ms phase lag                  | Gemini and Kimi solved 8/8; Qwen solved all 6 substantive cases, with two parser-pending outputs excluded.                                                     |
| Latent dynamic-state accumulation          | Discovery failed to replicate: Qwen solved 12/16 native holdout cases.                                                                                         |
| Latent causal set propagation              | Gemini solved 8/8 and Kimi solved 7/8 discovery cases.                                                                                                         |
| Hidden causal activation transfer          | Qwen solved 6/8 discovery cases.                                                                                                                               |
| Explicit collision timing                  | Gemini solved 6/8 and Kimi solved 8/8 discovery cases.                                                                                                         |
| Temporal interval containment              | Gemini and Kimi each solved all 8 discovery cases.                                                                                                             |
| Occluded straight-trajectory continuity    | Gemini solved 7/8 while Kimi and Qwen each solved all 8 discovery cases.                                                                                       |
| 18-beat coflash counting                   | Gemini reached 4/8; the 30-beat replacement also left Kimi at exactly 4/8.                                                                                     |
| 20-event ordinal successor                 | Kimi answered 4/6 substantive cases correctly; replaced by the 32-event cell.                                                                                  |
| 32-event ordinal successor                 | Kimi answered 5/6 substantive cases correctly after conservative terminal-sentence adjudication; two length-truncated outputs were excluded.                   |
| Twelve-arrow hidden path integration       | Gemini solved 6/8.                                                                                                                                             |
| Twelve-symbol exact sequence               | Gemini solved 5/8 and Kimi solved 8/8; a faster, longer sequence requires a new screen.                                                                        |
| Identity-conditioned direction reversals   | Gemini solved 7/7 substantive cases; one parser-pending response was excluded.                                                                                 |
| Irregular cube-net folding                 | Gemini solved all 8 discovery cases.                                                                                                                           |
| Occurrence-indexed successor binding       | The harder discovery replacement left Kimi at 4/7 substantive answers correct, so it did not earn a frozen holdout.                                            |
| 48-event temporal run-length maximum       | Discovery did not replicate: Qwen already solved 10/15 substantive native cases on the frozen holdout; one pending output cannot change the decision.          |
| 80-event temporal run-length maximum       | The harder discovery replacement also failed to replicate: Gemini rose from 3/8 in discovery to 9/16 on its frozen native holdout.                             |
| 41-event signed temporal accumulator       | Qwen finished the balanced discovery screen at exactly 4/8, so the cell did not satisfy the strict below-half promotion rule.                                  |
| 28-instruction visual stack program        | Gemini solved 5/8 discovery cases, so the LIFO family did not advance to a frozen holdout.                                                                     |
| Fixed-structure four-panel enclosure depth | The shortcut-controlled replacement was rejected when Gemini reached exactly 4/8; Kimi scored 1/8 and the remaining Qwen screen was stopped prospectively.     |
| Nine-gate visual Boolean circuit           | Gemini solved all 8/8 balanced discovery cases; Kimi scored 3/8 and Qwen was stopped after five requests once rejection was certain.                           |
| 32-event variable-target pair collisions   | The ungated five-route replacement improved Seed, Gemini, and Kimi to 2/8 each, but Qwen reached exactly 4/8; MiMo was not queried after rejection.            |
| Color-gated temporal set cardinality       | The five-route screen passed, but Kimi reached 8/15 substantive native answers on the untouched holdout; its final pair and Qwen's unfinished tail stopped.    |
| Ungated temporal set cardinality           | The original three-route result did not survive route expansion: MiMo solved 9/16, so a new gated family was required rather than relabeling the old evidence. |

Discovery screens are cheap filters, not claims. A family moves above only after a precommitted,
seed-disjoint holdout replicates across every route and non-substantive outcomes have been rerun or
otherwise resolved without counting them as errors.

The conservation Kimi denominator required nine prospective completion requests after nine
length-exhausted outputs. Its reported 2/16 uses only the final substantive answers; the audit trail
therefore contains 25 native requests and discloses all nine excluded outputs.
