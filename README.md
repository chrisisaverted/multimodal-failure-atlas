# The Multimodal Failure Atlas

A living, executable field guide to image and video failure modes in frontier multimodal models.

The atlas treats every failure as a falsifiable family rather than a spectacular anecdote. It combines a multi-axis literature-backed taxonomy, deterministic procedural specimens, explicit evidence labels, and infrastructure for immutable, cost-bounded model evaluations.

## Current release

- 52 mapped failure families across image, video, audiovisual, multi-image, and interleaved media
- 20 strictly admitted frozen families: 10 image and 10 video
- 20 deterministic interactive generators with construction-grounded answers, including live variants of 12 current admitted families
- 38 primary or official technical sources with retrieval dates and scope notes
- 71 statically prerendered routes
- Evidence ladder separating behavior, interventions, representations, hypotheses, and speculation
- Typed, provider-neutral evaluation contract
- 2,064 requests in the current admitted-family ledger, yielding 2,047 substantive answers
- A separate 1,391-request canonical Seed/MiMo route-expansion audit, with every current family now confirmed on both routes
- $25 default campaign cap, $25 protected reserve, and a $200 prepaid evaluation ceiling
- 17 non-substantive admitted-family requests retained and excluded rather than scored as model failures
- A budgeted adaptive-discovery pipeline with disjoint 16-case confirmatory holdouts and paired native/control interventions

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
[docs/verified-findings.md](docs/verified-findings.md), [docs/research-directions.md](docs/research-directions.md),
[docs/followup-preregistration.md](docs/followup-preregistration.md),
[docs/final-report.md](docs/final-report.md), and [docs/hosting.md](docs/hosting.md).

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
a protected $25 reserve, and a $25 default campaign cap. Reconciled unique-request model spend is
$111.608224. Current usage is recorded in
[docs/cost-ledger.csv](docs/cost-ledger.csv).

## Status

This is a research preview, not a leaderboard. The admitted cohort requires 16 substantive native-media
answers per route and a strictly below-half observed solve rate for every selected route. These finite
holdouts reveal reproducible candidate boundaries but do not establish universal rankings; human
solvability is still unverified. Every scored artifact and raw response is published with its provenance.
