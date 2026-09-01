<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Atlas research invariants

Before designing or running paid multimodal failure searches, read
`.agents/skills/multimodal-hardness-discovery/SKILL.md` and `docs/adaptive-discovery.md`.

- Rank generators by the easiest target model, never pooled average failure. A retained mode must
  have at least one reproducible difficulty setting below 50% substantive solve rate for every named
  holdout model; easier settings may remain to expose the boundary.
- Empty, refused, errored, and review-routed responses never count as evidence of cognitive hardness.
- Balance answer labels inside each parameter cell. Freeze scorers, target routes, budgets, and plan
  hashes before querying models.
- Discovery and confirmation use disjoint seeds, visual variants, and any answer-bearing values that
  can reasonably be reserved. Never promote discovery rows as confirmatory evidence.
- Pair lossy video/image conditions with an evidence-preserving oracle control when the proposed
  mechanism is acquisition or compression.
- Construction-grounded answers do not establish human ease. Keep human solvability unverified until
  a blinded baseline reports accuracy, exclusions, display conditions, and response times.
- Use only existing prepaid provider credit. Never add funds, enable provider fallback, or publish a
  credential.
