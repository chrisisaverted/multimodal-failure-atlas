# The Multimodal Failure Atlas

A living, executable field guide to image and video failure modes in frontier multimodal models.

The atlas treats every failure as a falsifiable family rather than a spectacular anecdote. It combines a multi-axis literature-backed taxonomy, deterministic procedural specimens, explicit evidence labels, and infrastructure for immutable, cost-bounded model evaluations.

## Current release

- 32 mapped failure families across image, video, audiovisual, multi-image, and interleaved media
- 8 deterministic interactive generators with construction-grounded answers
- 34 primary research sources with retrieval dates and scope notes
- 44 statically prerendered routes
- Evidence ladder separating behavior, interventions, representations, hypotheses, and speculation
- Typed, provider-neutral evaluation contract
- 640 genuine, provenance-complete responses from 10 pinned model/provider routes
- $25 default campaign cap, $25 protected reserve, and a $200 prepaid evaluation ceiling
- 53 explicit no-answer outcomes and 10 review-routed responses retained rather than discarded
- A budgeted adaptive-discovery pipeline with disjoint confirmatory holdouts

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run check
```

The gate runs type checking, linting, generator and safety tests, and a production build.

## Architecture

The public application is static-first. Catalogue and citation data are typed modules rendered through server components; only generators and filters cross the client boundary. This keeps the public research site fast and useful without credentials.

Evaluation adapters are server-only and live under `src/lib/evaluation`. They expose availability,
preflight estimation, and evaluation interfaces. The fixture adapter is marked as such and disabled
in production. Paid adapters remain fail-closed unless evaluation is explicitly enabled and an exact
protocol, route, media hash, and cost ceiling pass validation.

See [docs/architecture.md](docs/architecture.md), [docs/methods.md](docs/methods.md),
[docs/adaptive-discovery.md](docs/adaptive-discovery.md), [docs/evaluation.md](docs/evaluation.md),
[docs/bibliography.md](docs/bibliography.md), [docs/provider-landscape.md](docs/provider-landscape.md),
and [docs/hosting.md](docs/hosting.md).

## Evaluation smoke test

```bash
npm run evaluate:fixture
npm run evaluate:fixture -- --execute
```

The first command is preflight-only. The second writes explicitly labelled fixture records, calls no model, and costs $0. See `docs/evaluation.md` before configuring any remote adapter.

## Adding a failure family

1. Add primary sources to `src/lib/sources.ts`.
2. Add a typed entry to `src/lib/catalogue.ts`.
3. State the trigger, symptom, violated expectation, proposed mechanism, alternatives, and disconfirming test.
4. If generator-backed, add a deterministic implementation to `src/lib/generators.ts` and rendering to `src/components/diagnostic-visual.tsx`.
5. Add determinism, validity, answer-balance, and minimal-pair tests.
6. Never use a stronger evidence label than the source and intervention record supports.

The contribution standard is described in [docs/methods.md](docs/methods.md).

## Environment

Copy `.env.example` to `.env.local` only when developing server-side evaluations. Never expose provider credentials through `NEXT_PUBLIC_` variables.

No external service is necessary to browse the atlas or generate public educational specimens.

## Budget

The user funded a $200 prepaid OpenRouter balance and authorized no further deposits. Total project
cash outlay must remain below $500; the code enforces a stricter $200 cumulative evaluation ceiling,
a protected $25 reserve, and a $25 default campaign cap. Current usage is recorded in
[docs/cost-ledger.csv](docs/cost-ledger.csv).

## Status

This is a research preview. The frozen pilot is diagnostic rather than a leaderboard: eight examples
per family and one trial can reveal candidate failure patterns but cannot establish stable rankings.
Public generator seeds are educational demonstrations; every scored pilot artifact and raw response
is published with its provenance.
