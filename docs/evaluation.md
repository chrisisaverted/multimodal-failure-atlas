# Evaluation operations

## Safety model

Remote evaluation is fail-closed. A paid run requires all of the following:

1. `ATLAS_EVALUATION_ENABLED=true`.
2. A server-only provider credential.
3. Explicit dated input and output prices for preflight accounting.
4. A declared per-case cost ceiling and project-wide recorded spend below the protected reserve.
5. Seed-specific media bytes or frames with a checksum.

The runner rejects batches above 1,000 jobs, unsupported input conditions, unknown media digests,
duplicate immutable IDs, any individual call above its cap, and cumulative evaluation usage that
would enter the final $25 prepaid reserve. `ATLAS_RECORDED_SPEND_USD` carries usage outside the active
result store into every preflight. The runner waits between calls, appends each completed record
immediately, and resumes by deterministic run ID after interruption.

The deterministic run ID is a logical case/configuration key, not a billable-request identity. A
prospectively authorized completion retry can reuse that logical key while receiving a new provider request
ID. `npm run audit:budget` scans every JSONL row, deduplicates only exact provider request IDs, and fails the
build on conflicting duplicates or spend above the declared project ceiling. Rows without a provider request
ID are conservatively counted by append-only source location.

## Fixture smoke plan

`npm run evaluate:fixture` performs a read-only preflight. Add `-- --execute` to exercise the append-only storage and resume path without contacting a model or spending money. Fixture records are always labelled `fixture` and must never enter model comparisons.

The bundled CLI intentionally refuses non-fixture plans because its committed media are educational reference artifacts, not seed-specific evaluation renders. Genuine plans must materialize the exact generated instance and use `runEvaluationBatch` directly. This guard prevents a valid latent answer from being accidentally paired with the wrong pixels.

## Gemini adapter

The Gemini adapter uses inline image/video bytes or standardized frame arrays. Its capability assumptions are based on Google’s [official video-understanding guide](https://ai.google.dev/gemini-api/docs/video-understanding), retrieved 2026-08-30. That guide documents direct video input and warns that default processing can sample video at 1 FPS, which is itself an important evaluation condition.

Pricing is never compiled into the code. Before each dated run, copy the current official per-million-token rates into `ATLAS_GEMINI_INPUT_USD_PER_MILLION` and `ATLAS_GEMINI_OUTPUT_USD_PER_MILLION`. Video estimates use a deliberately conservative 320 visual/audio tokens per second plus the entire configured output allowance.

## OpenRouter cohort adapter

The OpenRouter adapter sends exact PNG bytes as an image data URL and exact MP4 bytes as a video
data URL. Every request pins one upstream provider, disables fallbacks, requests denied data
collection, and records gateway/upstream identity and reported usage. The final protocol resolves a
dated endpoint revision and quantization label before the campaign; generation responses may still
return only a model alias, and the report does not mislabel that alias as a dated snapshot.

A successful generation with an empty visible answer is retained as an incorrect no-answer outcome,
including its finish reason and reasoning-token usage. Gateway/provider errors are never scored.
The 2026-08-30 campaign encountered a new-account 20-RPM limit and therefore used a 3.3-second
minimum cadence with resumable checkpoints.

## Reporting

Do not publish model rankings from the fixture smoke test or a tiny pilot. A scored release must precommit seeds, generator version, model snapshot, prompt, trials, primary metrics, and exclusions; report denominators, Wilson intervals, parse failures, abstentions, latency, and spend; and separate native video from extracted-frame input.
