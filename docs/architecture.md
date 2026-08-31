# Architecture

## Design goals

The system separates four contract families:

1. **Scientific catalogue** — claims, taxonomic axes, evidence levels, citations, and alternative explanations.
2. **Diagnostic generators** — deterministic stimuli, latent state, questions, exact answers, minimal-pair contracts, and difficulty parameters.
3. **Evaluation records** — immutable provenance for a particular model, media artifact, prompt, scorer, and trial.
4. **Presentation** — accessible pages that never silently strengthen a scientific claim.

## Application structure

The application uses Next.js 16, React 19, TypeScript, and CSS with locally packaged fonts. Server components render catalogue pages. Client components are restricted to interactive filtering, live diagnostic controls, and animation.

```text
src/
├── app/                       routes and metadata
├── components/                presentation and interactive instruments
└── lib/
    ├── catalogue.ts           typed failure catalogue
    ├── generators.ts          pure seeded generators
    ├── sources.ts             primary-source bibliography
    ├── types.ts               domain contracts
    └── evaluation/
        ├── adapters/          provider-neutral adapter registry
        ├── cost.ts            hard spending constraints
        ├── hash.ts            provenance and seed commitments
        ├── runner.ts          resumable, rate-limited evaluation batches
        ├── schema.ts          request and immutable-run validation
        ├── scorer.ts          exact parsing and review routing
        ├── statistics.ts      Wilson intervals and run summaries
        └── store.ts           append-only JSONL and test stores
```

## Failure module contract

A complete generator-backed family contains a stable identifier and taxonomy, citations, falsifiable claim, evidence label, pure seeded generator, exact answer, balanced answer policy, minimal pair, difficulty axis, renderer, validation tests, scorer, and disconfirming intervention.

The initial release keeps metadata and generators in typed registries. A later package boundary can make each family independently publishable once third-party contributions justify the additional loading complexity.

## Evaluation lifecycle

```text
private seed commitment
        ↓
materialize exact media + metadata
        ↓
hash media and complete prompt
        ↓
adapter availability + capability check
        ↓
cost preflight + project ledger check
        ↓
server-side model call
        ↓
construct one record with raw response + deterministic score/review route
        ↓
append immutable run record immediately
        ↓
aggregate only above declared sample threshold
```

The public browser never receives provider credentials. Public user-triggered generation is local and free; public paid evaluation is disabled.

## Data integrity

- Every scored media artifact receives SHA-256 identity.
- Generator version and seed are stored with the artifact.
- Model aliases are insufficient; a dated model identifier is required.
- A new run appends rather than overwrites history.
- Fixtures carry `status: fixture` and cannot appear as verified observations.
- Closed-model mechanisms are hypotheses unless an intervention supports them.

## Static-first deployment

All current catalogue pages prerender. Interactive generators execute in the browser and need no backend. This makes the research preview deployable at zero recurring infrastructure cost while evaluation infrastructure matures independently.
