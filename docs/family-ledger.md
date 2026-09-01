# Failure-family admission ledger

This ledger counts latent capability families, not prompts, skins, answer ranges, or difficulty cells.
An observed pass means every prespecified route is strictly below 50% on a balanced frozen 16-case
holdout, with solve rates calculated only over substantive answers. Silence, parser failures, provider
errors, unsupported media, and reasoning exhaustion are disclosed and never scored as failures.
Wilson-qualified and human-validated are stricter, separately reported states.

## Image families

| Family                                    | State                     |               Gemini |                            Qwen | Kimi | Control             | Human      |
| ----------------------------------------- | ------------------------- | -------------------: | ------------------------------: | ---: | ------------------- | ---------- |
| Identity-conditioned exact crossing count | observed holdout pass     |                 7/16 |                            0/16 | 1/16 | 16/16, 16/16, 13/16 | unverified |
| Topological enclosure depth               | observed holdout pass     |                 6/16 |                            7/16 | 5/16 | 16/16, 16/16, 10/16 | unverified |
| Rotation-invariant exact correspondence   | observed holdout pass     |                 6/16 |                            5/16 | 2/16 | 16/16, 16/16, 14/16 | unverified |
| Global bilateral symmetry verification    | observed holdout pass     |                 6/16 |                            3/16 | 1/16 | 16/16 each          | unverified |
| Occluded cube-stack enumeration           | observed holdout pass     |                 3/16 |                            6/16 | 6/16 | 16/16 each          | unverified |
| Dense visual XOR composition              | observed holdout pass     |                 4/16 |                            2/16 | 7/16 | 16/16, 15/15, 16/16 | unverified |
| Dense cross-image change localization     | observed holdout pass     |                 4/16 |                            2/16 | 5/16 | 16/16, 16/16, 9/16  | unverified |
| Maze reachability                         | observed holdout pass     |                 6/16 |                            3/16 | 4/16 | 16/16, 9/9, 16/16  | unverified |
| Visual graph-degree topology              | observed holdout pass     |                 4/16 |                            5/16 | 2/16 | 16/16 each          | unverified |
| 2D parity-matrix verification             | replicated holdout pass  |                 5/16 |                            4/16 | 4/16 | 16/16 each          | unverified |

The enclosure control only partially recovers Kimi, so it confirms behavioral difficulty but does not
fully localize the mechanism. Rotation required two prospective Qwen reruns after length-exhausted
responses; the final native denominator is 16 substantive answers from 18 requests.

## Video families

Gemini 3.7 Flash, Qwen 3.8 Max, and Kimi K3 are the initial cohort; all three routes have accepted the
generated MP4 inputs. Several promising screens remain intentionally uncounted until their frozen
holdouts finish.

| Family                                     | State                       |      Gemini |             Qwen |        Kimi | Control                           | Human      |
| ------------------------------------------ | --------------------------- | ----------: | ---------------: | ----------: | --------------------------------- | ---------- |
| Identity-conditioned spatial zone entries  | observed holdout pass       |        4/16 |             7/16 |        4/16 | 16/16 each                        | unverified |
| Identity-pair collision counting           | observed holdout pass       |        4/16 |             3/16 |        3/16 | 16/16, 12/16, 16/16               | unverified |
| Sequential identity permutation            | observed holdout pass       |        2/16 |             1/16 |        5/16 | 16/16, 13/16, 16/16               | unverified |
| Identity-conditioned selective flash count | observed holdout pass       |        2/16 |             4/16 |        2/16 | 16/16 each                        | unverified |
| Temporal target-transition counting         | observed holdout pass       |        3/16 |             5/16 |        3/16 | 16/16 each                        | unverified |
| Temporal set cardinality                    | observed holdout pass       |        5/16 |             4/16 |        4/16 | 16/16 each                        | unverified |
| Dynamic route turn integration              | replicated holdout pass     |        2/16 |             2/16 |        3/16 | 16/16 each                        | unverified |
| Dynamic conservation ledger                 | replication awaiting Kimi   |        7/16 |             5/16 |      running | 16/16 each on completed routes    | unverified |
| Hidden-trail trajectory topology            | observed holdout pass       |        4/16 |             5/16 |        6/16 | 6/16, 5/16, 4/15                 | unverified |

## Rejected or superseded searches

| Search                                   | Reason it does not count                                                                                                                     |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Single momentary symbol                  | Kimi solved the frozen native holdout 16/16.                                                                                                 |
| Lattice flash counting                   | Gemini and Kimi each solved 12/16; Qwen solved 10/16.                                                                                        |
| Compositional static counting            | Gemini solved 22/24; the hardest cell was exactly 2/4.                                                                                       |
| 64-crossing endpoint wire tracing        | Discovery did not replicate: Gemini solved 10/16 and Kimi 9/16 on the frozen holdout.                                                        |
| 34×34 change localization                | Gemini reached exactly 8/16 on the frozen holdout; a 42×42 replacement is a new cycle.                                                       |
| Geometric mirror ray tracing             | Gemini solved 5/8 in the harder discovery cell.                                                                                              |
| Three-fold paper punching                | Gemini solved 8/8 and Kimi reached exactly 4/8.                                                                                              |
| Four-fold paper propagation              | The denser replacement remained easy for Gemini at 6/8.                                                                                      |
| Strip-jigsaw ordering                    | Gemini solved 8/8.                                                                                                                           |
| Ribbon occlusion ordering                | Gemini and Kimi solved 8/8.                                                                                                                  |
| Multiple-object endpoint tracking        | Gemini solved 7/8.                                                                                                                           |
| Simple temporal ordering                 | Kimi solved 8/8.                                                                                                                             |
| Duration comparison                      | Gemini reached 4/8 and Kimi solved 7/8.                                                                                                      |
| Periodic anomaly detection               | Kimi solved 5/8.                                                                                                                             |
| Synchrony detection                      | Qwen solved 8/8.                                                                                                                             |
| Repeated 180 ms phase lag                | Gemini and Kimi solved 8/8; Qwen solved all 6 substantive cases, with two parser-pending outputs excluded.                                  |
| Latent dynamic-state accumulation        | Discovery failed to replicate: Qwen solved 12/16 native holdout cases.                                                                       |
| Latent causal set propagation            | Gemini solved 8/8 and Kimi solved 7/8 discovery cases.                                                                                       |
| Hidden causal activation transfer        | Qwen solved 6/8 discovery cases.                                                                                                             |
| Explicit collision timing                | Gemini solved 6/8 and Kimi solved 8/8 discovery cases.                                                                                       |
| Temporal interval containment            | Gemini and Kimi each solved all 8 discovery cases.                                                                                           |
| Occluded straight-trajectory continuity  | Gemini solved 7/8 while Kimi and Qwen each solved all 8 discovery cases.                                                                     |
| 18-beat coflash counting                 | Gemini reached 4/8; the 30-beat replacement also left Kimi at exactly 4/8.                                                                   |
| 20-event ordinal successor               | Kimi answered 4/6 substantive cases correctly; replaced by the 32-event cell.                                                                |
| 32-event ordinal successor               | Kimi answered 5/6 substantive cases correctly after conservative terminal-sentence adjudication; two length-truncated outputs were excluded. |
| Twelve-arrow hidden path integration     | Gemini solved 6/8.                                                                                                                           |
| Twelve-symbol exact sequence             | Gemini solved 5/8 and Kimi solved 8/8; a faster, longer sequence requires a new screen.                                                      |
| Identity-conditioned direction reversals | Gemini solved 7/7 substantive cases; one parser-pending response was excluded.                                                               |
| Irregular cube-net folding               | Gemini solved all 8 discovery cases.                                                                                                         |
| Occurrence-indexed successor binding     | The harder discovery replacement left Kimi at 4/7 substantive answers correct, so it did not earn a frozen holdout.                         |
| 48-event temporal run-length maximum     | Discovery did not replicate: Qwen already solved 10/15 substantive native cases on the frozen holdout; one pending output cannot change the decision. |
| 41-event signed temporal accumulator     | Qwen finished the balanced discovery screen at exactly 4/8, so the cell did not satisfy the strict below-half promotion rule.                       |

Discovery screens are cheap filters, not claims. A family moves above only after a precommitted,
seed-disjoint holdout replicates across every route and non-substantive outcomes have been rerun or
otherwise resolved without counting them as errors.
