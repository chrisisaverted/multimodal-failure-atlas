import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  enclosurePanelsDenseCandidateSchema,
  enclosurePanelsDenseVersion,
} from "../src/lib/discovery/enclosure-panels-dense";
import { evaluationRunSchema } from "../src/lib/evaluation/schema";
import { sha256 } from "../src/lib/evaluation/hash";

const discoveryPath = resolve("evaluation/discovery/enclosure-panels-dense-discovery-v1.json");
const reservationPath = resolve("evaluation/reservations/enclosure-panels-dense-confirmatory-v1.json");
const resultPaths = [
  "evaluation/results/enclosure-panels-dense-discovery-v1-gemini.jsonl",
  "evaluation/results/enclosure-panels-dense-discovery-v1-qwen.jsonl",
  "evaluation/results/enclosure-panels-dense-discovery-v1-kimi.jsonl",
];
const discoveryBytes = await readFile(discoveryPath);
const reservationBytes = await readFile(reservationPath);
const reservation = z
  .object({
    id: z.literal("enclosure-panels-dense-confirmatory-v1"),
    generatorVersion: z.literal(enclosurePanelsDenseVersion),
    status: z.literal("reserved-untouched-confirmatory-candidates"),
    candidates: z.array(enclosurePanelsDenseCandidateSchema).length(16),
  })
  .parse(JSON.parse(reservationBytes.toString()));

const discoveryEvidence = await Promise.all(
  resultPaths.map(async (path) => {
    const bytes = await readFile(resolve(path));
    const runs = bytes
      .toString()
      .split("\n")
      .filter(Boolean)
      .map((line) => evaluationRunSchema.parse(JSON.parse(line)));
    const substantive = runs.filter((run) => run.status === "verified" && !run.emptyResponse);
    const correct = substantive.filter((run) => run.correct).length;
    if (runs.length !== 8 || substantive.length !== 8 || correct >= 4)
      throw new Error(`${path} does not satisfy the frozen discovery promotion rule`);
    return {
      path,
      sha256: sha256(new Uint8Array(bytes)),
      requests: runs.length,
      substantiveAnswers: substantive.length,
      correct,
    };
  }),
);

const output = resolve("evaluation/discovery/enclosure-panels-dense-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: reservation.id,
      generatorVersion: reservation.generatorVersion,
      status: "frozen-confirmatory-holdout",
      frozenAt: "2026-09-01T12:08:00.000Z",
      derivedFrom: {
        discoveryPlanSha256: sha256(discoveryBytes),
        reservationSha256: sha256(reservationBytes),
        discoveryEvidence,
      },
      holdoutSeparation:
        "Exactly the 16 seed-disjoint, answer-balanced cases reserved before discovery; no candidate, answer position, distractor template, or visual phase was selected after model responses.",
      interventions: [
        { id: "native-image", description: "Fixed-target unannotated panel image; primary condition." },
        {
          id: "exact-count-badges",
          description:
            "Closed boundaries are highlighted and each panel's exact count is shown; positive control.",
        },
      ],
      candidates: reservation.candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: reservation.candidates.length, discoveryEvidence });
