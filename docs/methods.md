# Methods and evidence standard

## Unit of evidence

The atlas does not treat a single failed prompt as a failure mode. A failure family requires a controlled distribution of instances and a declared invariant or expected transformation.

For an input transformation `T` and answer function `A`, an invariance test expects `A(T(x)) = A(x)`. An equivariance test expects a declared corresponding change, such as reversing a video reversing the event-order answer.

## Evidence ladder

1. **Literature-established** — a primary source documents the behavior with a stated protocol.
2. **Reproduced here** — an atlas run reproduces the behavior on precommitted instances.
3. **Behavioral evidence** — output sensitivity supports a phenomenon but not an internal cause.
4. **Causal intervention** — a targeted manipulation changes failure probability while alternatives are controlled.
5. **Representation evidence** — probes or activation interventions locate task-relevant information at an internal stage.
6. **Hypothesis** — plausible and falsifiable, but not currently established.
7. **Speculative** — research question without sufficient behavioral evidence.

The catalogue may use only the strongest label actually justified by its sources and local evidence.

## First-error attribution

Attribution follows the earliest erroneous stage:

1. Was the answer-bearing evidence present in the decoded source media?
2. Was it retained after the provider or local frame-selection policy?
3. Does the visual encoder represent it on held-out instances?
4. Does it survive compression and cross-modal projection?
5. Can the backbone use it when queried directly?
6. Are correctly perceived facts combined correctly?
7. Does language generation report the inferred state faithfully?

A later rationalization never proves an earlier perceptual failure.

## Generator validation

Every generator must demonstrate determinism, exact answers from latent state, answer-class balance, minimal pairs, no metadata leakage, meaningful difficulty parameters, and multiple visual renderers before claims of style generalization.

Public examples and scored seeds are disjoint.

## Model evaluation

- Precommit generator version, seeds, model IDs, prompt, decoding settings, primary metrics, and exclusions.
- Run multiple trials when an API is nondeterministic.
- Report denominators, confidence intervals, abstentions, parse failures, latency, and cost.
- Do not rank models from small samples.
- Compare native video input separately from standardized extracted frames.
- Preserve raw responses and judge decisions.
- Treat provider preprocessing as unknown unless documented for the exact endpoint and date.

## Human validity

Claims that a task is easy for humans require evidence. Initial procedural checks establish unambiguous construction-grounded answers, not human ease. Before publication, collect a preregistered human baseline with response-time and exclusion criteria.

## Contamination resistance

Fresh pixels prevent exact item memorization, not necessarily distributional familiarity. Reports distinguish fresh seed, fresh composition, held-out renderer, held-out generator grammar, and structural distribution shift.

Private seeds use salted commit–reveal hashes. The salt is never committed. If future models pass a family, the historical result remains and the pass is recorded as progress.
