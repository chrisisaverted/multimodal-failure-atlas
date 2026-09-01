import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createPairCollisionGatedSet,
  pairCollisionGatedVersion,
} from "../src/lib/discovery/pair-collision-gated";

const output = resolve("evaluation/discovery/pair-collision-gated-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/pair-collision-gated-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "pair-collision-gated-discovery-v1",
      generatorVersion: pairCollisionGatedVersion,
      status: "discovery-only",
      frozenAt: "2026-09-01T12:31:00.000Z",
      hypothesis:
        "Conjoining variable target-pair identity with an explicit frame-color gate will eliminate the Qwen threshold result while remaining directly countable by attentive humans.",
      selectionRule:
        "Promote only if Gemini, Qwen, Kimi, Seed, and MiMo each provide eight substantive answers and score strictly below 4/8; the 16-case holdout is already reserved.",
      difficultyContract:
        "Every case has 32 events, 16 per frame color, six target-pair collisions under the wrong color, a case-variable target pair and target color, and adjacent answers 5-8.",
      candidates: createPairCollisionGatedSet("discovery"),
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  reservationOutput,
  `${JSON.stringify(
    {
      id: "pair-collision-gated-confirmatory-v1",
      generatorVersion: pairCollisionGatedVersion,
      status: "reserved-untouched-confirmatory-candidates",
      frozenAt: "2026-09-01T12:31:00.000Z",
      separation:
        "Seeds 5310000+, shifted pair schedule, four cases per answer, balanced target colors, and unseen event permutations reserved before screening.",
      candidates: createPairCollisionGatedSet("confirmatory"),
    },
    null,
    2,
  )}\n`,
);
console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
