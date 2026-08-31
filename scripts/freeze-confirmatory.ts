import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  createConfirmatoryCandidates,
  discoveryGeneratorVersion,
} from "../src/lib/discovery/lattice-counting";
import { discoveryCandidateSchema } from "../src/lib/discovery/schema";
import { sha256 } from "../src/lib/evaluation/hash";

const discoveryPath = resolve(process.argv[2] ?? "evaluation/discovery/lattice-counting-discovery-v1.json");
const rankingPath = resolve(process.argv[3] ?? "evaluation/discovery/lattice-counting-ranking-v1.json");
const outputPath = resolve(process.argv[4] ?? "evaluation/discovery/lattice-counting-confirmatory-v1.json");
const discoveryBytes = await readFile(discoveryPath);
const rankingBytes = await readFile(rankingPath);
const discovery = z
  .object({ candidates: z.array(discoveryCandidateSchema) })
  .parse(JSON.parse(discoveryBytes.toString("utf8")));
const ranking = z
  .object({
    status: z.literal("adaptive-discovery-not-confirmatory-evidence"),
    cells: z.array(z.object({ cellId: z.string(), rankScore: z.number() })).min(2),
  })
  .parse(JSON.parse(rankingBytes.toString("utf8")));
const winners = ranking.cells.slice(0, 2).map((score) => {
  const representative = discovery.candidates.find((candidate) => candidate.cellId === score.cellId);
  if (!representative) throw new Error(`Missing winning cell ${score.cellId}.`);
  return representative;
});
const candidates = createConfirmatoryCandidates(winners);
const body = `${JSON.stringify(
  {
    id: "lattice-counting-confirmatory-v1",
    createdAt: "2026-08-30",
    generatorVersion: discoveryGeneratorVersion,
    status: "frozen-confirmatory-holdout",
    derivedFrom: {
      discoveryPlanSha256: sha256(discoveryBytes),
      rankingSha256: sha256(rankingBytes),
      selectionRule: "top two predeclared cell scores",
    },
    holdoutGuarantees: {
      unseenCounts: [4, 6, 8, 10],
      disjointSeedMinimum: 910000,
      humanSolvability: "unverified-until-blinded-human-baseline",
    },
    interventions: [
      {
        id: "native-1x",
        description: "Exact source video at its native temporal rate.",
      },
      {
        id: "slow-motion-4x",
        description:
          "The same rendered frames held four times longer; event count and visual states are unchanged.",
      },
    ],
    candidates,
  },
  null,
  2,
)}\n`;
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, body);
console.log(
  JSON.stringify(
    { outputPath, sha256: sha256(body), candidates: candidates.length, cells: winners.map((x) => x.cellId) },
    null,
    2,
  ),
);
