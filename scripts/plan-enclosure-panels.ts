import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createEnclosurePanelsSet, enclosurePanelsVersion } from "../src/lib/discovery/enclosure-panels";

const output = resolve("evaluation/discovery/enclosure-panels-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/enclosure-panels-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "enclosure-panels-discovery-v1",
      generatorVersion: enclosurePanelsVersion,
      status: "discovery-only",
      frozenAt: "2026-09-01T11:50:00.000Z",
      hypothesis:
        "A fixed four-panel scene with balanced target depths and answer positions removes the scalar-difficulty/answer confound while preserving exact topological counting.",
      selectionRule:
        "Promote only if every core route supplies eight substantive answers and scores strictly below 4/8; the confirmatory set is already generated from disjoint seeds.",
      candidates: createEnclosurePanelsSet("discovery"),
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  reservationOutput,
  `${JSON.stringify(
    {
      id: "enclosure-panels-confirmatory-v1",
      generatorVersion: enclosurePanelsVersion,
      status: "reserved-untouched-confirmatory-candidates",
      frozenAt: "2026-09-01T11:50:00.000Z",
      separation:
        "Seeds 2910000+, visual variants 700+, two target depths at each answer slot twice and two ordinal-rank templates; reserved before any discovery response.",
      candidates: createEnclosurePanelsSet("confirmatory"),
    },
    null,
    2,
  )}\n`,
);
console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
