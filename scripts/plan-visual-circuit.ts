import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createVisualCircuitSet, visualCircuitVersion } from "../src/lib/discovery/visual-circuit";

const output = resolve("evaluation/discovery/visual-circuit-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/visual-circuit-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });

await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "visual-circuit-discovery-v1",
      generatorVersion: visualCircuitVersion,
      status: "discovery-only",
      frozenAt: "2026-09-01T14:55:00.000Z",
      hypothesis:
        "A fixed-layout nine-gate Boolean circuit exposes failures of multi-step visual execution without scalar difficulty or answer-position confounds.",
      selectionRule:
        "Promote only if every core route supplies eight substantive answers and scores strictly below 4/8; the confirmatory set is generated from disjoint seeds before any discovery response.",
      difficultyContract:
        "Every native stimulus has exactly six displayed input bits, nine labeled gates, depth three after the input layer, two output gates, and displayed difficulty 88/100. Gate types vary, but all three types occur in every case and outputs are balanced.",
      candidates: createVisualCircuitSet("discovery"),
    },
    null,
    2,
  )}\n`,
);

await writeFile(
  reservationOutput,
  `${JSON.stringify(
    {
      id: "visual-circuit-confirmatory-v1",
      generatorVersion: visualCircuitVersion,
      status: "reserved-untouched-confirmatory-candidates",
      frozenAt: "2026-09-01T14:55:00.000Z",
      separation:
        "Seeds 3010000+, visual variants 300+, four examples per balanced two-bit answer; reserved before any discovery response.",
      candidates: createVisualCircuitSet("confirmatory"),
    },
    null,
    2,
  )}\n`,
);

console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
