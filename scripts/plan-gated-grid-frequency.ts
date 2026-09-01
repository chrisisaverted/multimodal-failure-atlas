import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createGatedGridFrequencySet,
  gatedGridFrequencyVersion,
} from "../src/lib/discovery/gated-grid-exact-frequency";

const output = resolve("evaluation/discovery/gated-grid-frequency-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/gated-grid-frequency-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify({ id: "gated-grid-frequency-discovery-v1", generatorVersion: gatedGridFrequencyVersion, status: "discovery-only", frozenAt: "2026-09-01T14:30:00.000Z", hypothesis: "Replacing set membership with a conditionally updated per-cell frequency histogram will eliminate Kimi's near-exact set-count shortcut while remaining manually tallyable.", selectionRule: "Promote only if Gemini, Qwen, Kimi, Seed, and MiMo each provide eight substantive answers and score strictly below 4/8; the 16-case holdout is already reserved.", difficultyContract: "Every case has 40 flashes, 20 per gate color, eight wrong-gate target-cell echoes, a variable target color, and asks how many cells occur exactly twice under that color; answers 3-6 are balanced.", candidates: createGatedGridFrequencySet("discovery") }, null, 2)}\n`,
);
await writeFile(
  reservationOutput,
  `${JSON.stringify({ id: "gated-grid-frequency-confirmatory-v1", generatorVersion: gatedGridFrequencyVersion, status: "reserved-untouched-confirmatory-candidates", frozenAt: "2026-09-01T14:30:00.000Z", separation: "Seeds 5430000+, four cases per answer, balanced target colors, disjoint cell histograms, and unseen event permutations reserved before screening.", candidates: createGatedGridFrequencySet("confirmatory") }, null, 2)}\n`,
);
console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
