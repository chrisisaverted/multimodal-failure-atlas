# Build and evaluation report

Release audit updated 2026-08-31.

## Delivered

- A static-first Next.js atlas deployed publicly on GitHub Pages
- A multi-axis catalogue of 32 image, video, audiovisual, multi-image, and interleaved-media failure families
- Eight deterministic interactive generators with construction-grounded answers and downloadable specimens
- A frozen 64-case pilot: eight independently seeded cases across four image and four video families
- 640 genuine responses from 10 distinct model families through pinned upstream providers
- 192 adaptive screening responses and 80 frozen-holdout responses, including 40 paired native/slow-motion probes
- Exact media, prompt, stimulus-plan, and evaluation-protocol hashes on every public response record
- Raw answers, finish reasons, no-answer outcomes, token usage, cost, scorer decisions, and review states
- A fail-closed evaluation runner with resumption, no provider fallback, denied data collection, and hard spending guards

## Frozen campaign result

Protocol `openrouter-frontier-matrix-v2-2026-08-30` used one trial per case, temperature 0,
minimal hidden reasoning, a 1,024-token answer ceiling, exact native PNG/MP4 inputs, and an
exact-option scorer frozen before the final run.

| Model            | Correct | Verified denominator | Review | No answer | Reported cost |
| ---------------- | ------: | -------------------: | -----: | --------: | ------------: |
| Gemini 3.7 Flash |      59 |                   64 |      0 |         0 |       $0.0749 |
| Qwen 3.8 Max     |      57 |                   64 |      0 |         1 |       $0.2259 |
| Kimi K3          |      54 |                   64 |      0 |         0 |       $0.5184 |
| Gemma 4 31B      |      53 |                   64 |      0 |         9 |       $0.0146 |
| GLM 5.3 Flash    |      52 |                   64 |      0 |         6 |       $0.0074 |
| MiMo V2.5        |      50 |                   62 |      2 |         4 |       $0.0107 |
| Seed 2.1 Turbo   |      48 |                   64 |      0 |        12 |       $0.1191 |
| Step 3.7 Flash   |      45 |                   64 |      0 |         8 |       $0.0262 |
| MiniMax M3       |      44 |                   64 |      0 |         7 |       $0.0410 |
| Nova 2 Lite      |      41 |                   56 |      8 |         6 |       $0.0865 |

The strongest shared failure was repeated-event counting: 17/80 verified correct (21.3%), with
42 no-answer outcomes. Attribute binding was 80/80 on this pilot, showing that the set is
diagnostic rather than uniformly difficult. Ten verbose responses remain `pending-review` because
the precommitted parser found more than one answer option; they were not retroactively rescored.

## Verification and limits

- 640 unique run IDs; exactly 64 records per model
- One stimulus-plan hash and one final-protocol hash across all published rows
- Ten pinned upstreams; zero fallback-enabled records; data collection denied on every request
- Final campaign usage: $1.1248; total OpenRouter usage including screening/debug calls: $1.1616
- Eight samples per family and one trial are exploratory, not a stable leaderboard
- “Easy for humans” is not claimed until a preregistered human baseline is collected
- Closed-model mechanism explanations remain hypotheses unless a controlled intervention supports them
- Provider-returned model IDs were aliases; dated endpoint revisions and quantization labels are the
  OpenRouter endpoint snapshot resolved when the protocol was frozen

## Adaptive counting experiment

The reusable discovery pipeline generated 48 event-counting videos over a 12-cell timing grid and
screened them against GLM, MiMo, Step, and a prespecified Gemma replacement. Its selection objective
used the Wilson 95% lower bound on substantive wrong answers multiplied by substantive model coverage;
no-answer and review outcomes had zero hardness weight. The two promoted timing cells were frozen
before generating an untouched eight-case holdout with unseen even counts and visual seeds. Each
holdout case has an exact-frame 4× slow-motion twin.

The screen produced 192 records: 52 substantive answers, of which 35 were wrong, plus 133 no-answer
and seven review outcomes. The confirmatory run produced 80 records from Gemini, Kimi, Qwen, GLM,
and MiMo: 63 substantive answers, of which 39 were correct and 24 wrong, plus 15 no-answer and two
review outcomes. Native video yielded 17/29 correct substantive answers; slow motion yielded 22/34.
Seven of 40 paired native failures were recovered by slowing the identical frames. This is evidence
of acquisition/timing sensitivity, not proof that sparse sampling is the sole causal mechanism;
some pairs regressed and stronger models were not uniformly defeated.

Human solvability remains unverified. The included blinded local self-test is a demonstration and
export tool, not a research-grade human baseline. The next defensible study step is preregistered
human validation followed by a dense-frame or event-transcript oracle intervention.

## Operations

Hosting is GitHub Pages at zero recurring cost. The only cash outlay was a $200 prepaid OpenRouter
credit purchase; no further deposits are authorized. As of the final audit, OpenRouter reported
$3.009663 used and approximately $196.99 remaining. Published rows account for $2.999496; $0.010167
is conservatively recorded as retry/aborted-request overhead. Code-level cumulative evaluation
allowance is $200 with a protected $25 reserve and a $25 default campaign ceiling, stricter than the
user’s $500 total-project limit.
