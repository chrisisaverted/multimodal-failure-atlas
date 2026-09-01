import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createPairCollisionHardSet,
  pairCollisionHardVersion,
} from "../src/lib/discovery/pair-collision-hard";

const output = resolve("evaluation/discovery/pair-collision-hard-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/pair-collision-hard-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "pair-collision-hard-discovery-v1",
      generatorVersion: pairCollisionHardVersion,
      status: "discovery-only",
      frozenAt: "2026-09-01T12:14:00.000Z",
      hypothesis:
        "Variable target-pair binding, 32 collision events, and 12 single-target near misses will push the externally borderline Seed route below 50% while preserving explicit human-readable identities.",
      selectionRule:
        "Promote only if Gemini, Qwen, Kimi, Seed, and MiMo each provide eight substantive answers and score strictly below 4/8; the 16-case holdout is already reserved.",
      difficultyContract:
        "Every case has 32 events at 520 ms/event, 12 near misses containing exactly one target identity, adjacent answers 7-10, and a target pair printed throughout the video.",
      candidates: createPairCollisionHardSet("discovery"),
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  reservationOutput,
  `${JSON.stringify(
    {
      id: "pair-collision-hard-confirmatory-v1",
      generatorVersion: pairCollisionHardVersion,
      status: "reserved-untouched-confirmatory-candidates",
      frozenAt: "2026-09-01T12:14:00.000Z",
      separation:
        "Seeds 5210000+, shifted target-pair schedule, four cases per adjacent count, and new event permutations reserved before screening.",
      candidates: createPairCollisionHardSet("confirmatory"),
    },
    null,
    2,
  )}\n`,
);
console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
