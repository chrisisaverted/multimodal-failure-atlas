import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { sha256 } from "../src/lib/evaluation/hash";
import { createDiscoveryGrid, discoveryGeneratorVersion } from "../src/lib/discovery/lattice-counting";

const output = resolve(process.argv[2] ?? "evaluation/discovery/lattice-counting-discovery-v1.json");
const body = `${JSON.stringify(
  {
    id: "lattice-counting-discovery-v1",
    createdAt: "2026-08-30",
    generatorVersion: discoveryGeneratorVersion,
    status: "discovery-only",
    scientificGuardrails: {
      humanSolvability: "unverified-until-blinded-human-baseline",
      optimizerTarget: "substantive-incorrect-answers-only",
      noAnswerReward: 0,
      confirmatoryCountsReserved: [4, 6, 8, 10],
      confirmatorySeedMinimum: 910000,
    },
    searchSpace: {
      flashDurationMs: [100, 233],
      intervalMs: [400, 700],
      phaseMs: [125, 375, 625],
      discoveryCounts: [3, 5, 7, 9],
    },
    candidates: createDiscoveryGrid(),
  },
  null,
  2,
)}\n`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, body);
console.log(
  JSON.stringify({ output, sha256: sha256(body), candidates: createDiscoveryGrid().length }, null, 2),
);
