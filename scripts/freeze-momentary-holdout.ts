import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  createMomentarySymbolHoldout,
  momentarySymbolCandidateSchema,
  momentarySymbolGeneratorVersion,
} from "../src/lib/discovery/momentary-symbol";
import { sha256 } from "../src/lib/evaluation/hash";

const discoveryPath = resolve(process.argv[2] ?? "evaluation/discovery/momentary-symbol-discovery-v1.json");
const rankingPath = resolve(process.argv[3] ?? "evaluation/discovery/momentary-symbol-ranking-v1.json");
const outputPath = resolve(process.argv[4] ?? "evaluation/discovery/momentary-symbol-confirmatory-v1.json");
const discoveryBytes = await readFile(discoveryPath);
const rankingBytes = await readFile(rankingPath);
const discovery = z
  .object({ candidates: z.array(momentarySymbolCandidateSchema) })
  .parse(JSON.parse(discoveryBytes.toString("utf8")));
const ranking = z
  .object({
    planSha256: z.string(),
    cells: z.array(
      z.object({
        cellId: z.string(),
        observedAdmitted: z.boolean(),
        evidenceComplete: z.boolean(),
      }),
    ),
  })
  .parse(JSON.parse(rankingBytes.toString("utf8")));
if (ranking.planSha256 !== sha256(discoveryBytes)) throw new Error("Ranking is stale.");
const winner = ranking.cells.find((cell) => cell.observedAdmitted && cell.evidenceComplete);
if (!winner) throw new Error("No discovery cell clears the all-model observed admission bar.");
const representative = discovery.candidates.find((candidate) => candidate.cellId === winner.cellId)!;
const discoveryEventSeconds = discovery.candidates
  .filter((candidate) => candidate.cellId === winner.cellId)
  .map((candidate) => candidate.parameters.eventSecond);
const candidates = createMomentarySymbolHoldout(representative, discoveryEventSeconds);
const body = `${JSON.stringify(
  {
    id: "momentary-symbol-confirmatory-v1",
    createdAt: "2026-08-31",
    generatorVersion: momentarySymbolGeneratorVersion,
    status: "frozen-confirmatory-holdout",
    derivedFrom: {
      discoveryPlanSha256: sha256(discoveryBytes),
      rankingSha256: sha256(rankingBytes),
      selectedCellId: winner.cellId,
      selectionRule: "first ranked cell clearing the all-model observed below-50% bar",
    },
    holdoutGuarantees: {
      balancedLabels: true,
      candidatesPerModel: 16,
      disjointSeedMinimum: 920000,
      newEventTimesAndVisualVariants: true,
      constructionAmendment:
        "Before any holdout request, validation replaced the first draft's temporal locations with 2, 3, 4, and 6 seconds because those exact windows avoid the separately rounded reference indices at 1, 2, and 4 FPS. No model saw either draft before this correction.",
      humanSolvability: "unverified-until-blinded-human-baseline",
    },
    interventions: [
      {
        id: "native-1x",
        description: "Exact source video at native speed; primary admission condition.",
      },
      {
        id: "oracle-critical-frame",
        description: "The answer-bearing frame as a still image; positive acquisition control.",
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
    { outputPath, sha256: sha256(body), selectedCellId: winner.cellId, candidates: 16 },
    null,
    2,
  ),
);
