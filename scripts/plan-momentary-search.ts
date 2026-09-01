import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { sha256 } from "../src/lib/evaluation/hash";
import {
  createMomentarySymbolDiscoveryGrid,
  momentarySymbolGeneratorVersion,
} from "../src/lib/discovery/momentary-symbol";

const output = resolve(process.argv[2] ?? "evaluation/discovery/momentary-symbol-discovery-v1.json");
const candidates = createMomentarySymbolDiscoveryGrid();
const body = `${JSON.stringify(
  {
    id: "momentary-symbol-discovery-v1",
    createdAt: "2026-08-31",
    generatorVersion: momentarySymbolGeneratorVersion,
    status: "discovery-only",
    scientificGuardrails: {
      humanSolvability: "unverified-until-blinded-human-baseline",
      optimizerTarget: "minimize-the-maximum-substantive-solve-rate-across-target-models",
      noAnswerReward: 0,
      balancedFourWayLabelsWithinEveryCell: true,
      confirmatorySeedMinimum: 920000,
      oracleControl: "critical event frame presented as a still image",
    },
    searchSpace: {
      eventDurationMs: [67, 100, 133],
      phaseMs: [150, 250, 350],
      videoDurationMs: [20000],
      symbols: ["triangle", "square", "diamond", "star"],
    },
    candidates,
  },
  null,
  2,
)}\n`;
await mkdir(dirname(output), { recursive: true });
await writeFile(output, body);
console.log(JSON.stringify({ output, sha256: sha256(body), candidates: candidates.length }, null, 2));
