import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  gatedGridFrequencyCandidateSchema,
  gatedGridFrequencyVersion,
} from "../src/lib/discovery/gated-grid-exact-frequency";
import { adjudicateExplicitDeclaration } from "../src/lib/evaluation/adjudication";
import { sha256 } from "../src/lib/evaluation/hash";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const discoveryPath = resolve("evaluation/discovery/gated-grid-frequency-discovery-v1.json");
const reservationPath = resolve("evaluation/reservations/gated-grid-frequency-confirmatory-v1.json");
const cohorts = [
  {
    modelId: "google/gemini-3.7-flash",
    paths: ["evaluation/results/gated-grid-frequency-discovery-v1-gemini.jsonl"],
  },
  { modelId: "qwen/qwen3.8-max", paths: ["evaluation/results/gated-grid-frequency-discovery-v1-qwen.jsonl"] },
  {
    modelId: "moonshotai/kimi-k3",
    paths: [
      "evaluation/results/gated-grid-frequency-discovery-v1-kimi.jsonl",
      "evaluation/results/gated-grid-frequency-discovery-v1-kimi-completion.jsonl",
      "evaluation/results/gated-grid-frequency-discovery-v1-kimi-declaration.jsonl",
    ],
  },
  {
    modelId: "bytedance-seed/seed-2-1-turbo",
    paths: ["evaluation/results/gated-grid-frequency-discovery-v1-seed.jsonl"],
  },
  { modelId: "xiaomi/mimo-v2.5", paths: ["evaluation/results/gated-grid-frequency-discovery-v1-mimo.jsonl"] },
] as const;

const discoveryBytes = await readFile(discoveryPath);
const discovery = z
  .object({ candidates: z.array(gatedGridFrequencyCandidateSchema).length(8) })
  .parse(JSON.parse(discoveryBytes.toString()));
const reservationBytes = await readFile(reservationPath);
const reservation = z
  .object({
    id: z.literal("gated-grid-frequency-confirmatory-v1"),
    generatorVersion: z.literal(gatedGridFrequencyVersion),
    status: z.literal("reserved-untouched-confirmatory-candidates"),
    candidates: z.array(gatedGridFrequencyCandidateSchema).length(16),
  })
  .parse(JSON.parse(reservationBytes.toString()));

function substantiveAttempt(runs: EvaluationRunRecord[], candidate: (typeof discovery.candidates)[number]) {
  for (const run of runs) {
    if (run.seed !== candidate.seed || run.emptyResponse) continue;
    if (run.status === "verified")
      return { correct: run.correct, basis: "frozen-scorer" as const, runId: run.id };
    if (run.status !== "pending-review" || run.finishReason !== "stop") continue;
    const decision = adjudicateExplicitDeclaration(run.rawResponse, candidate.answerOptions);
    if (!decision) continue;
    return {
      correct: decision.withinOptions && decision.claimedAnswer === candidate.expectedAnswer,
      basis: decision.basis,
      runId: run.id,
    };
  }
}

const discoveryEvidence = await Promise.all(
  cohorts.map(async ({ modelId, paths }) => {
    const files = await Promise.all(
      paths.map(async (path) => {
        const bytes = await readFile(resolve(path));
        return {
          path,
          sha256: sha256(new Uint8Array(bytes)),
          runs: bytes
            .toString()
            .split("\n")
            .filter(Boolean)
            .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
        };
      }),
    );
    const runs = files.flatMap((file) => file.runs).filter((run) => run.modelId === modelId);
    const answers = discovery.candidates.map((candidate) => substantiveAttempt(runs, candidate));
    const substantiveAnswers = answers.filter(Boolean).length;
    const correct = answers.filter((answer) => answer?.correct).length;
    if (substantiveAnswers !== 8 || correct >= 4)
      throw new Error(`${modelId} does not satisfy the five-route discovery promotion rule`);
    return {
      modelId,
      files: files.map(({ path, sha256: digest }) => ({ path, sha256: digest })),
      requests: runs.length,
      substantiveAnswers,
      correct,
      answerKeyBlindAdjudications: answers.filter((answer) => answer && answer.basis !== "frozen-scorer")
        .length,
    };
  }),
);

const output = resolve("evaluation/discovery/gated-grid-frequency-confirmatory-v1.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(
  output,
  `${JSON.stringify(
    {
      id: reservation.id,
      generatorVersion: reservation.generatorVersion,
      status: "frozen-confirmatory-holdout",
      frozenAt: "2026-09-01T14:40:00.000Z",
      derivedFrom: {
        discoveryPlanSha256: sha256(discoveryBytes),
        reservationSha256: sha256(reservationBytes),
        discoveryEvidence,
      },
      holdoutSeparation:
        "Exactly the 16 seed-disjoint, answer-balanced cases reserved before the five-route screen; no target gate, cell-frequency histogram, answer position, wrong-gate echo, event order, or visual phase was selected after model responses.",
      interventions: [
        {
          id: "native-video",
          description:
            "Forty flashes require a conditionally updated per-cell frequency histogram and exact multiplicity query.",
        },
        {
          id: "visible-target-histogram-control",
          description:
            "Target-gate counts persist per cell and the exact number currently equal to two is displayed.",
        },
      ],
      candidates: reservation.candidates,
    },
    null,
    2,
  )}\n`,
);
console.log({ output, candidates: reservation.candidates.length, discoveryEvidence });
