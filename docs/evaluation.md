# Evaluation operations

## Safety model

Remote evaluation is fail-closed. A paid run requires all of the following:

1. `ATLAS_EVALUATION_ENABLED=true`.
2. A server-only provider credential.
3. Explicit dated input and output prices for preflight accounting.
4. A declared per-case cost ceiling and project-wide recorded spend below the protected reserve.
5. Seed-specific media bytes or frames with a checksum.

The runner rejects batches above 1,000 jobs, unsupported input conditions, unknown media digests, duplicate immutable IDs, any individual call above its cap, and cumulative project spend that would enter the final $100 reserve. `ATLAS_RECORDED_SPEND_USD` carries spend outside the active result store into every preflight. The runner waits between calls, appends each completed record immediately, and resumes by deterministic run ID after interruption.

## Fixture smoke plan

`npm run evaluate:fixture` performs a read-only preflight. Add `-- --execute` to exercise the append-only storage and resume path without contacting a model or spending money. Fixture records are always labelled `fixture` and must never enter model comparisons.

The bundled CLI intentionally refuses non-fixture plans because its committed media are educational reference artifacts, not seed-specific evaluation renders. Genuine plans must materialize the exact generated instance and use `runEvaluationBatch` directly. This guard prevents a valid latent answer from being accidentally paired with the wrong pixels.

## Gemini adapter

The Gemini adapter uses inline image/video bytes or standardized frame arrays. Its capability assumptions are based on Google’s [official video-understanding guide](https://ai.google.dev/gemini-api/docs/video-understanding), retrieved 2026-08-30. That guide documents direct video input and warns that default processing can sample video at 1 FPS, which is itself an important evaluation condition.

Pricing is never compiled into the code. Before each dated run, copy the current official per-million-token rates into `ATLAS_GEMINI_INPUT_USD_PER_MILLION` and `ATLAS_GEMINI_OUTPUT_USD_PER_MILLION`. Video estimates use a deliberately conservative 320 visual/audio tokens per second plus the entire configured output allowance.

Kimi, GLM, and local Qwen slots remain unavailable until an exact endpoint/runtime has a dated conformance fixture. GLM-4.5V’s [official documentation](https://docs.z.ai/guides/vlm/glm-4.5v) lists video input, and the [Qwen3-VL model card](https://huggingface.co/Qwen/Qwen3-VL-30B-A3B-Instruct) reports video understanding; these documentation claims set adapter capability declarations but are not evaluation evidence. The current Kimi API review did not establish a specific native-video request contract, so that slot remains entirely fail-closed.

## Reporting

Do not publish model rankings from the fixture smoke test or a tiny pilot. A scored release must precommit seeds, generator version, model snapshot, prompt, trials, primary metrics, and exclusions; report denominators, Wilson intervals, parse failures, abstentions, latency, and spend; and separate native video from extracted-frame input.
