import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createGatedGridSet, gatedGridSetVersion } from "../src/lib/discovery/gated-grid-set-cardinality";

const output = resolve("evaluation/discovery/gated-grid-set-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/gated-grid-set-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "gated-grid-set-discovery-v1", generatorVersion: gatedGridSetVersion, status: "discovery-only", frozenAt: "2026-09-01T13:10:00.000Z", hypothesis: "A case-variable frame-color predicate plus wrong-color echoes of target cells will expose failures to maintain a conditionally updated duplicate-suppressed set.", selectionRule: "Promote only if Gemini, Qwen, Kimi, Seed, and MiMo each provide eight substantive answers and score strictly below 4/8; the 16-case holdout is already reserved.", difficultyContract: "Every case has 40 flashes over a labeled 6x6 grid, 20 per gate color, eight target-cell echoes under the wrong color, adjacent answers 9-12, and a case-variable target color.", candidates: createGatedGridSet("discovery") }, null, 2)}\n`,
);
await writeFile(
  reservationOutput,
  `${JSON.stringify({ id: "gated-grid-set-confirmatory-v1", generatorVersion: gatedGridSetVersion, status: "reserved-untouched-confirmatory-candidates", frozenAt: "2026-09-01T13:10:00.000Z", separation: "Seeds 5410000+, four cases per answer, balanced target colors, disjoint cell sets, and unseen event permutations reserved before screening.", candidates: createGatedGridSet("confirmatory") }, null, 2)}\n`,
);
console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
