# Difficulty-setting contract

The atlas uses a 0–100 difficulty control inside each generator. It is a family-local intervention coordinate, not a universal scale. Admission requires at least one frozen setting where every selected route is below 50% on 16 substantive native answers. It does not require failure at every setting, and a higher number in one family is not necessarily harder than a lower number in another.

## Frozen admitted settings

| Modality | Family                          |       Setting | Principal structural load at that setting                                  |
| -------- | ------------------------------- | ------------: | -------------------------------------------------------------------------- |
| image    | exact wire-crossing count       |           100 | 40 total crossings; trace one wire and choose among adjacent exact counts  |
| image    | enclosure depth                 | 57–72 stratum | answers 9–12 counterbalance closed loop count; 12 open decoys remain fixed |
| image    | rotation correspondence         |            46 | 9-vertex irregular reference; rotation versus near-reflection candidates   |
| image    | bilateral symmetry              |            82 | dense 24×24 field with a near-symmetric defect                             |
| image    | occluded cube enumeration       |            77 | solid columns totaling roughly 28 cubes under occlusion                    |
| image    | visual XOR composition          |            98 | 20×20 paired grids; distractors differ by one output flip                  |
| image    | change localization             |           100 | 42×42 paired grids with one answer-bearing local change                    |
| image    | maze reachability               |            55 | four 11×11 mazes; exact start-to-goal connectivity                         |
| image    | graph degree topology           |            87 | dense candidate graphs with one exact degree-pattern match                 |
| image    | visual parity                   |            96 | 24×24 parity panels with near-miss candidates                              |
| video    | identity-conditioned zone entry |            86 | track one identity through four cycles and eight entries                   |
| video    | pair-specific collision count   |            91 | 24 collision events across six identities; count one pair only             |
| video    | sequential identity permutation |            88 | maintain an identity across 12 swaps                                       |
| video    | selective flash count           |            86 | eight target flashes among four distractor objects                         |
| video    | target-transition count         |            94 | count an exact temporal pattern rather than state occupancy                |
| video    | temporal set cardinality        |            98 | maintain a set of 21 uniquely activated locations                          |
| video    | route-turn integration          |            96 | integrate 20 turns over a 41-position path                                 |
| video    | conservation ledger             |            96 | update a target container across multiple transfers                        |
| video    | hidden-trail topology           |            94 | retain a route and count true self-intersections                           |
| video    | signed state accumulation       |            97 | integrate signed temporal updates to an exact final balance                |

The table describes the common structural load. Seeds change answer-bearing values, layouts, labels, and distractors while preserving the frozen setting. Exact case parameters and media hashes live in each public manifest. Enclosure depth is explicitly a four-value answer-balanced stratum—not one scalar point—because its answer is itself the number of enclosing loops. The site does not collapse that stratum to its first case.

## Requirements for a useful slider

1. **Semantic validity at every point.** The oracle must remain exact and the stimulus must remain legible; difficulty cannot mean corruption into ambiguity.
2. **Answer balance within cells.** Moving the slider must not introduce an answer prior that a model can exploit.
3. **Independent dimensions underneath.** Density, event count, duration, distractor count, answer spacing, and display resolution should be separately addressable even if the public UI exposes one composite value.
4. **Measured, not assumed, monotonicity.** A larger parameter can make a task easier through rhythm, redundancy, or a new heuristic. Publish empirical route curves and reversals.
5. **Frozen boundary selection.** Difficulty search is exploratory. Once a candidate point is selected, freeze new seeds, appearances, answer values, protocols, and the scorer before confirmation.
6. **Human overlap.** The scientifically valuable region is not maximal model failure; it is the interval where blinded human accuracy remains high while every route is below the declared model threshold.

The first release proves one admissible point per family. It does not yet claim calibrated full curves. The next confirmatory release should predeclare at least five settings around each boundary, use fresh cases at every setting, and fit a monotone model only when the observed data support monotonicity.
