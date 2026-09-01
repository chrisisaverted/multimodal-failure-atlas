# Failure-family admission ledger

This ledger counts latent capability families, not prompts, skins, answer ranges, or difficulty cells.
An observed pass means every prespecified route is strictly below 50% on a balanced frozen 16-case
holdout, with solve rates calculated only over substantive answers. Silence, parser failures, provider
errors, unsupported media, and reasoning exhaustion are disclosed and never scored as failures.
Wilson-qualified and human-validated are stricter, separately reported states.

## Image families

| Family | State | Gemini | Qwen | Kimi | Control | Human |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Identity-conditioned exact crossing count | observed holdout pass | 7/16 | 0/16 | 1/16 | 16/16, 16/16, 13/16 | unverified |
| Topological enclosure depth | observed holdout pass | 6/16 | 7/16 | 5/16 | 16/16, 16/16, 10/16 | unverified |
| Rotation-invariant exact correspondence | observed holdout pass | 6/16 | 4/14 substantive | 2/16 | 16/16, 16/16, 14/16 | unverified |
| Global bilateral symmetry verification | observed holdout pass | 6/16 | 3/16 | 1/16 | 16/16 each | unverified |
| Occluded cube-stack enumeration | observed holdout pass | 3/16 | 6/16 | 6/16 | 16/16 each | unverified |
| Maze reachability | frozen holdout incomplete | incomplete after 429 | 3/16 native; control incomplete | 4/16 | 16/16 Kimi | unverified |
| Dense cross-image change localization | harder replacement screen | 1/8 | pending | 0/8 | pending | unverified |
| Dense visual XOR composition | v2 replacement screen | v1 2/8 | v1 4/8 | v1 3/8 | pending | unverified |
| Visual graph-degree topology | screen incomplete | 1/4 substantive | pending | 1/8 | pending | unverified |
| 2D parity-matrix verification | screen queued | pending | pending | pending | pending | unverified |
| Irregular cube-net folding | screen queued | pending | pending | pending | pending | unverified |

The enclosure control only partially recovers Kimi, so it confirms behavioral difficulty but does not
fully localize the mechanism. The rotation Qwen denominator excludes two non-substantive outputs.

## Video families

No video family is admitted yet. Gemini 3.7 Flash, Qwen 3.8 Max, and Kimi K3 are the initial cohort;
all three routes have accepted the generated MP4 inputs. Several promising screens remain intentionally
uncounted until their frozen holdouts finish.

| Family | State | Gemini | Qwen | Kimi | Control | Human |
| --- | --- | ---: | ---: | ---: | --- | --- |
| Identity-conditioned selective flash count | frozen holdout incomplete | 4/14 native | 2/14 native | 2/16 native | current isolation control does not recover | unverified |
| Identity-conditioned spatial zone entries | screen running | 2/8 | pending | 3/8 | pending | unverified |
| Identity-pair collision counting | screen running | 3/8 | pending | pending | pending | unverified |
| Ordinal successor binding, 32 events | harder replacement screen | 2/8 | pending | pending | pending | unverified |
| Hidden causal activation transfer | screen incomplete | 0/8 | pending | 3/7 substantive | pending | unverified |
| Sequential identity permutation | screen queued | pending | pending | pending | pending | unverified |
| Latent causal set propagation | screen queued | pending | pending | pending | pending | unverified |
| Spatiotemporal collision disambiguation | screen queued | pending | pending | pending | pending | unverified |
| Temporal interval containment | screen queued | pending | pending | pending | pending | unverified |
| Occluded straight-trajectory continuity | screen queued | pending | pending | pending | pending | unverified |
| Identity-conditioned direction reversals | screen queued | pending | pending | pending | pending | unverified |

## Rejected or superseded searches

| Search | Reason it does not count |
| --- | --- |
| Single momentary symbol | Kimi solved the frozen native holdout 16/16. |
| Lattice flash counting | Gemini and Kimi each solved 12/16; Qwen solved 10/16. |
| Compositional static counting | Gemini solved 22/24; the hardest cell was exactly 2/4. |
| 64-crossing endpoint wire tracing | Discovery did not replicate: Gemini solved 10/16 and Kimi 9/16 on the frozen holdout. |
| 34×34 change localization | Gemini reached exactly 8/16 on the frozen holdout; a 42×42 replacement is a new cycle. |
| Geometric mirror ray tracing | Gemini solved 5/8 in the harder discovery cell. |
| Three-fold paper punching | Gemini solved 8/8 and Kimi reached exactly 4/8. |
| Strip-jigsaw ordering | Gemini solved 8/8. |
| Ribbon occlusion ordering | Gemini and Kimi solved 8/8. |
| Multiple-object endpoint tracking | Gemini solved 7/8. |
| Simple temporal ordering | Kimi solved 8/8. |
| Duration comparison | Gemini reached 4/8 and Kimi solved 7/8. |
| Periodic anomaly detection | Kimi solved 5/8. |
| Synchrony detection | Qwen solved 8/8. |
| Latent dynamic-state accumulation | Discovery failed to replicate: Qwen solved 12/16 native holdout cases. |
| 18-beat coflash counting | Gemini reached 4/8; the 30-beat replacement also left Kimi at exactly 4/8. |
| 20-event ordinal successor | Kimi answered 4/6 substantive cases correctly; replaced by the 32-event cell. |
| Twelve-arrow hidden path integration | Gemini solved 6/8. |

Discovery screens are cheap filters, not claims. A family moves above only after a precommitted,
seed-disjoint holdout replicates across every route and non-substantive outcomes have been rerun or
otherwise resolved without counting them as errors.
