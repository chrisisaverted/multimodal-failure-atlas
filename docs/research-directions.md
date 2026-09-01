# Research directions from the first 20 Atlas families

These directions are deliberately narrower than “models are bad at video.” Each proposes a falsifiable
mechanism, a procedural task, an intervention, and a result that would disconfirm the story. The current
Atlas findings motivate them but do not establish their mechanisms.

## 1. Sufficient-statistic intervention curves

The cleanest video result, route-turn integration, asks a model to update only two latent variables:
previous direction and turn count. Native accuracy is 17/80 pooled across five routes, while an on-screen
running counter recovers to 80/80. That leaves several explanations entangled: motion acquisition, previous-direction
retention, comparison, and count update.

Build a four-condition factorial family:

1. moving marker, no trail;
2. persistent trail, no direction label;
3. current direction label, no count;
4. running count, with or without the other aids.

Vary path length while keeping segment visibility, turn rate, and answer distribution fixed. Ask both the
final count and randomly probed intermediate states. A state-space model can predict which intervention
should flatten which error curve. If persistent trails alone recover fully, the failure lies closer to
trajectory retention; if only the count recovers, comparison or exact aggregation remains implicated.
If none recover, the original control likely changed more than the hypothesized sufficient statistic.

This could become a paper because it estimates the minimal external state needed to restore a deployed
video model, rather than just documenting low accuracy.

The gated exact-frequency family now supplies a complementary structured-state case. Its sufficient
statistic is not one counter but a frame-color-conditioned 6×6 histogram followed by an exact-multiplicity
predicate. Compare six frozen interventions: native video; accepted-event markers; persistent per-cell
visit flags; persistent per-cell counts; highlights only on cells currently equal to two; and the final
qualifying-set cardinality. The current native scores are 2/16, 3/16, 2/16, 6/16, and 4/16 across five
routes, while the full visible histogram is 16/16 throughout. The first intervention that restores each
route estimates how much state must be externalized without assuming access to hidden computation.

## 2. Relevance-shift stress tests for visual-token retention

Work on visual-token pruning reports that the relevant visual information can shift during decoding.
Create one dense image containing four equally salient subgraphs. The question begins with a chain of
symbolic references whose last step determines which subgraph matters; no early token can identify the
answer region. Compare:

- target named before the image;
- target revealed only at the end of the prompt;
- target determined by a two- or three-hop visual reference;
- all four region crops supplied separately;
- the final target crop supplied as an oracle.

Keep the final local operation identical. Sweep the number of decoy regions and the depth at which target
identity becomes knowable. The central prediction is an interaction: late target revelation should hurt
compressed architectures more than early revelation, even at the same pixel density. Full-resolution
open-weight baselines with pruning disabled provide the decisive control. No late-revelation penalty when
tokens are matched would disconfirm a relevance-shift account.

## 3. Black-box temporal sampling tomography

Google documents one-frame-per-second default video processing and exposes custom FPS in its direct API.
Hosted gateways and open models use different or undisclosed paths. Generate a brief answer-bearing event
with independently varied onset phase, duration, clip length, and temporal location. Evaluate the exact same
encoded clip under:

- native provider default;
- explicitly requested 1, 2, 4, 8, and 16 FPS where supported;
- externally extracted timestamped frames at those rates;
- slow motion that preserves frame identities;
- a critical-frame oracle.

Fit a periodic response surface rather than reporting one duration threshold. A lattice-like phase pattern
that shifts with requested FPS is strong system-identification evidence for sampling. Dense FPS without
recovery points toward token compression or downstream integration. A critical-frame failure points farther
downstream still. Randomizing codec keyframe placement tests whether apparent phase effects are container or
decode artifacts.

## 4. Recognition-to-state-update decomposition

Several admitted video tasks use individually obvious events but require a persistent update: gated
per-location histograms, signed accumulation, identity swaps, pair-and-color collision counts, and
conservation transfers. For every event sequence, collect four outputs:

1. event recognition at each step;
2. state before update;
3. state after update;
4. final answer.

Generate counterfactual paired clips differing in exactly one event. Score state traces against the
construction oracle, but do not assume verbal chain-of-thought faithfully exposes hidden computation.
Instead, use the trace as an auxiliary behavioral readout. Add an intervention where the exact recognized
event is supplied as text after every frame. If event recognition is accurate but state diverges, acquisition
is not sufficient to explain the failure. If text events recover the task, the bottleneck is visual evidence
extraction or visual-to-state transfer. If text also fails, the update program itself is implicated.

## 5. Cross-modal program transfer

Train or prompt a model on a randomly generated transition system entirely in text, then evaluate the same
system rendered as video without text labels. Include unseen rules whose evidence appears only in video.
Use three splits:

- rules and events both expressed in text;
- rules in text, events in video;
- rules demonstrated only in video, queried in text.

The third split is the sharp version of the original “subset C” question. The model must infer a latent
visual dynamics rule and project it into a language answer without ever receiving a textual label for that
rule. Compare a joint multimodal model, a frozen vision adapter attached to a text model, and a model trained
with explicit visual-next-token or latent-dynamics objectives. Success on recognition controls but failure on
the video-only rule split would reveal a cross-modal knowledge-transfer gap; it would not by itself prove that
language-only loss is the cause.

## 6. Latent simulation versus textual scratchpads

Construct reversible physical micro-worlds whose answer requires maintaining continuous geometry—colliding
disks, gears, occluded trajectories, folded surfaces—but whose final answer is discrete. Compare inference
conditions with equal total compute:

- ordinary text reasoning;
- forced terse answer;
- self-generated diagrams or coordinate tables;
- a learned latent recurrent workspace;
- tool-assisted simulation.

Measure not only final accuracy but counterfactual consistency under small perturbations and the fidelity of
predicted intermediate states. The key causal test is whether a nonlinguistic workspace improves transfer to
novel renderings more than an equally large text-token budget. A gain from simulation tools alone shows that
the base model can use external dynamics, not that its native reasoning is text-only; internal activation
analyses are needed before making that stronger claim.

## 7. Human-easy boundary estimation

The current construction oracles establish truth, not ease. Pre-register a human study with 16 native cases
per family, randomized family order, native browser media, no replay in the primary condition, and separate
replay/slow-motion conditions. Report participant exclusions, case-level accuracy, Wilson or hierarchical
intervals, and response time.

The primary publishable subset should require a lower confidence bound above a human criterion (for example
80%) while every model route remains below 50% observed. Fit difficulty curves jointly to people and models;
the scientifically useful quantity is the region with a large, stable human-model separation, not the single
hardest model item.

## 8. Adaptive discovery with a sealed model panel

The first campaign shows severe screen-to-holdout reversal. Make the search itself the object of study:
optimize generators against a development model panel while keeping two strong routes API-sealed until the
end. Compare random search, Bayesian optimization, evolutionary search, and an RL questioner under equal
request budgets. Score success by the number of distinct mechanisms that transfer below threshold on both
sealed routes, penalized by human error and weak controls.

This directly tests whether model-guided synthetic discovery finds real capability boundaries or merely
overfits hosted quirks. The Seed and MiMo cohort is a small first version of this design: it rejected two of
20 original generators. Their replacements were then reserved before screening; one additional temporal
repair passed its screen but failed the holdout before the exact-frequency design finally passed all five
routes. That sequence makes discovery-to-holdout and route-to-route transfer measurable outcomes rather than
footnotes.

## Near-term priority

The best paper-shaped next experiment is a preregistered sufficient-statistic ladder on three complementary
video families: scalar route-turn state, structured gated-frequency histograms, and conjunctive pair/color
event counting. All three are exact, have strong native failures, useful controls, and frozen evidence; the
latter two also pass five-route confirmation after shortcut-driven redesign. The primary scientific endpoint
should be the earliest intervention that restores each route, not another aggregate benchmark score.

In parallel, run the blinded human pilot before using “human-easy” in a title or abstract. The strongest
publishable subset is the intersection where a prespecified human lower bound clears the criterion, all five
routes remain below 50%, and the sufficient-statistic ladder localizes a recoverable boundary.

Relevant starting points include:

- [Kimi K3 technical report](https://arxiv.org/abs/2607.24653)
- [Qwen3-VL technical report](https://arxiv.org/abs/2511.21631)
- [Gemini video-understanding documentation](https://ai.google.dev/gemini-api/docs/video-understanding)
- [Video-MME-Logical](https://arxiv.org/abs/2606.27828)
- [Moment-Video](https://arxiv.org/abs/2606.02522)
- [Why and When Visual Token Pruning Fails](https://research.nvidia.com/labs/twn/publication/eccv_2026_dstp/)
- [Discovering Failure Modes in VLMs using RL](https://arxiv.org/abs/2604.04733)
