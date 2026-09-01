# Strict-20 human study protocol

Status: study-ready instrument, not a completed human baseline.

## Question

At the exact frozen settings where all five evaluated routes scored below 50%, can attentive adult humans solve the native-media tasks reliably above chance?

## Design

- Population: adults with normal or corrected-to-normal vision and sufficient English to read the prompts.
- Stimuli: all 320 native holdout cases: 16 cases from each of the 20 admitted families.
- Assignment: eight deterministic blocks. Each block contains two cases from every family (40 trials), and each native case appears in exactly one block.
- Proposed sample: 10 independent participants per block (80 total; 3,200 judgments), giving 10 judgments per stimulus and 160 per family.
- Presentation: images remain visible until response. Videos play once, uninterrupted, at 1× with no seek or replay controls. The answer unlocks only after playback ends.
- Response: one forced choice from the same options used for the model evaluation. Option order is deterministically counterbalanced per case and block.
- Feedback: none during the block. The participant packet intentionally contains no answer key.
- Instrumentation: response latency, presentation duration, visibility interruptions, block ID, case ID, and media hash are stored locally and exported as JSON. The public site does not transmit or collect responses.

## Primary estimands

1. Human accuracy for each family, with a 95% interval that accounts for participant and item variation.
2. Human-minus-model accuracy at the frozen setting, reported separately for each model route and family.
3. The proportion of families for which the lower human interval exceeds 50% while every model route remains below 50% by observed accuracy.

Fit a hierarchical logistic model with crossed participant and item intercepts and family-level effects. Also publish raw proportions with Wilson intervals so the principal result does not depend on one model specification. Treat model runs as fixed route-specific observations, not samples from a population of all models.

## Exclusions and sensitivity analyses

Preregister exclusions before recruitment. Suggested participant-level exclusions are: abandoning more than 20% of trials, duplicate participation, or failing a separate attention check. Do not exclude trials for being incorrect or slow. Flag visibility interruptions prospectively and report both intention-to-measure and uninterrupted-session sensitivity analyses.

The browser instrument prevents ordinary video replay and speed changes but is not a secure examination environment. Do not infer noncompliance merely from a surprising score. Accessibility accommodations should be specified before data collection and analyzed transparently.

## Recruitment, ethics, and privacy

Obtain the applicable institutional review or exemption determination before recruiting or collecting identifiable information. The current public instrument performs no network submission. A deployed collection backend would require a consent flow, retention policy, deletion procedure, access control, and a data-processing review.

## Reproducibility

Run `npm run build:human-study` to regenerate the answer-free block manifest. The generator fails unless it finds exactly 20 families, 16 unique native cases per family, 40 trials per block, and two trials from every family in every block. Media hashes bind every presented artifact to the frozen evaluation stimulus.

After placing downloaded packets in a private local directory, run `npm run score:human-study -- --input <packet-directory>`. The scorer rejects duplicate sessions, incomplete blocks, unassigned cases, duplicate responses, altered media hashes, and protocol mismatches. It emits aggregate family statistics without copying selected answers or session-level rows into the summary. Add `--allow-partial` only for a separately declared attrition analysis.

The original evaluation manifests contain constructed answers and remain available to researchers for scoring after collection. Participants should use only the answer-free study page and exported response packet. This is procedural blinding, not cryptographic secrecy: the project and its evidence are public.
