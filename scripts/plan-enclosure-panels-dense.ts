import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  createEnclosurePanelsDenseSet,
  enclosurePanelsDenseVersion,
} from "../src/lib/discovery/enclosure-panels-dense";

const output = resolve("evaluation/discovery/enclosure-panels-dense-discovery-v1.json");
const reservationOutput = resolve("evaluation/reservations/enclosure-panels-dense-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await mkdir(dirname(reservationOutput), { recursive: true });

await writeFile(
  output,
  `${JSON.stringify(
    {
      id: "enclosure-panels-dense-discovery-v1",
      generatorVersion: enclosurePanelsDenseVersion,
      status: "discovery-only",
      frozenAt: "2026-09-01T15:05:00.000Z",
      hypothesis:
        "A fixed query of exactly 18 boundaries with distractors on both sides removes answer-bearing difficulty and ordinal shortcuts while increasing topological density.",
      selectionRule:
        "Promote only if every core route supplies eight substantive answers and scores strictly below 4/8; the confirmatory set is generated from disjoint seeds before any discovery response.",
      difficultyContract:
        "Every case asks for depth 18, uses four panels in a 2x2 layout, eight lighter open decoys per panel, irregularity 0.35, and a rank-two or rank-three target. Only answer position, distractor template, path geometry, and visual phase vary.",
      candidates: createEnclosurePanelsDenseSet("discovery"),
    },
    null,
    2,
  )}\n`,
);

await writeFile(
  reservationOutput,
  `${JSON.stringify(
    {
      id: "enclosure-panels-dense-confirmatory-v1",
      generatorVersion: enclosurePanelsDenseVersion,
      status: "reserved-untouched-confirmatory-candidates",
      frozenAt: "2026-09-01T15:05:00.000Z",
      separation:
        "Seeds 3110000+, visual variants 1100+, four cases per answer position; reserved before any discovery response.",
      candidates: createEnclosurePanelsDenseSet("confirmatory"),
    },
    null,
    2,
  )}\n`,
);

console.log({ output, reservationOutput, discoveryCandidates: 8, reservedCandidates: 16 });
