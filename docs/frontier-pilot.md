# Frontier pilot protocol

## Scope

The first atlas pilot is an exploratory diagnostic, not a leaderboard. It contains 64 freshly
rendered cases: eight cases from each of eight executable failure families. Four families use a
700×500 PNG and four use a 30 FPS H.264 MP4. All cases use generator version 1.2.0, difficulty 90,
variant 0, and one deterministic seed. The plan was frozen in
`evaluation/plans/frontier-pilot.json` before any remote response was observed.

## Evaluation condition

Each exact artifact is sent through the provider's native image or native video input. The system
instruction requests exactly one answer from an explicit answer set and no explanation. The final
versioned protocol uses temperature 0, minimal hidden reasoning, and a maximum of 1,024 output
tokens. The larger ceiling was frozen after screening showed that 128 tokens could be consumed
entirely by hidden reasoning before an answer was emitted. Screening records are excluded from the
final campaign. There is one trial per item. Native-image and native-video results are always
reported separately because provider preprocessing paths differ.

The generated artifacts, prompts, expected answers, seeds, and latent construction states remain
private until the remote run is complete. They are published together afterward. This protects the
specific pixels from prior exposure; it does not establish structural distribution novelty or rule
out familiarity with the general task grammar.

## Admission and scoring

The exact media bytes and complete prompt are SHA-256 hashed before submission. The append-only run
record retains those hashes, the frozen evaluation-plan hash, generator version, model ID requested,
provider-returned model version,
timestamp, raw response, finish reason, no-answer flag, exact-option parse, expected answer, latency,
input condition, preprocessing notes, and estimated or provider-reported cost. An unambiguous
exact-option parse is `verified`;
ambiguous or unparsable output is `pending-review` and excluded from accuracy.

A successful provider response that emits no visible answer is a verified incorrect outcome, not a
transport error. The ledger preserves its finish reason and hidden-reasoning token count. The frozen
scorer is not changed after outputs are observed; verbose-but-clear terminal answers left ambiguous
by version 1 remain `pending-review` in this campaign.

Accuracy is reported with its denominator and a 95% Wilson interval. Eight examples per family and
one trial are insufficient for stable model rankings or broad capability claims. The pilot can
identify candidate failure patterns worth a powered confirmatory study. No claim that these tasks
are easy for people is made without a preregistered human baseline.

## Reproduction

`npm run generate:pilot` deterministically materializes the precommitted plan. `npm run
evaluate:pilot` performs budget preflight, verifies the frozen protocol/model route, submits the
exact bytes, appends each response immediately, resumes completed deterministic run IDs, and
publishes only schema-valid final-protocol records. The server-only
credential lives in `.env.local`, which is ignored by version control. The repository's full check
and static production build must pass before deployment.
