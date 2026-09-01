import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import { adjudicateExplicitDeclaration } from "../src/lib/evaluation/adjudication";
import { evaluationRunSchema, type EvaluationRunRecord } from "../src/lib/evaluation/schema";

const modelIds = ["google/gemini-3.7-flash", "qwen/qwen3.8-max", "moonshotai/kimi-k3"] as const;
const expandedModelIdsByPlan = new Map([
  ["pair-collision-gated-confirmatory-v1", ["bytedance-seed/seed-2-1-turbo", "xiaomi/mimo-v2.5"]],
  ["gated-grid-frequency-confirmatory-v1", ["bytedance-seed/seed-2-1-turbo", "xiaomi/mimo-v2.5"]],
]);

const specs = [
  ["identity-conditioned-exact-counting", "precision-wire-count-confirmatory-v1"],
  ["topological-enclosure-depth", "enclosure-panels-dense-confirmatory-v1"],
  ["rotation-invariant-visual-correspondence", "rotation-correspondence-confirmatory-v1"],
  ["global-bilateral-symmetry-verification", "symmetry-confirmatory-v1"],
  ["occluded-3d-cube-enumeration", "cube-stack-confirmatory-v1"],
  ["dense-visual-boolean-composition", "xor-composition-confirmatory-v2"],
  ["dense-cross-image-change-localization", "change-localization-confirmatory-v2"],
  ["visual-maze-reachability", "maze-reachability-confirmatory-v1"],
  ["visual-graph-degree-topology", "euler-graph-confirmatory-v1"],
  ["global-visual-parity-verification", "parity-matrix-confirmatory-v3"],
  ["identity-conditioned-spatial-transition-counting", "zone-entry-confirmatory-v1"],
  ["identity-pair-interaction-counting", "pair-collision-gated-confirmatory-v1"],
  ["sequential-identity-permutation", "swap-tracking-confirmatory-v1"],
  ["identity-conditioned-temporal-event-counting", "selective-flash-confirmatory-v3"],
  ["temporal-pattern-counting", "transition-count-confirmatory-v1"],
  ["temporal-set-cardinality", "gated-grid-frequency-confirmatory-v1"],
  ["dynamic-route-turn-integration", "route-turn-confirmatory-v3"],
  ["dynamic-conservation-ledger", "conservation-confirmatory-v3"],
  ["dynamic-trajectory-topology", "hidden-trail-intersections-confirmatory-v1"],
  ["signed-temporal-state-accumulation", "signed-accumulator-confirmatory-v2"],
] as const;

const abandonedResultFiles = new Set([
  "conservation-confirmatory-v3-kimi.jsonl",
  "hidden-trail-intersections-confirmatory-v1-kimi.jsonl",
]);

const manifestSchema = z.object({
  id: z.string(),
  planSha256: z.string(),
  generatorVersion: z.string(),
  renderer: z.string(),
  fps: z.number(),
  cases: z.array(
    z.object({
      candidateId: z.string(),
      cellId: z.string(),
      condition: z.string(),
      seed: z.number().int(),
      artifact: z.string(),
      mimeType: z.enum(["image/png", "video/mp4"]),
      question: z.string(),
      answerOptions: z.array(z.string()),
      expectedAnswer: z.string(),
      difficulty: z.number(),
      humanSolvability: z.string().optional(),
    }),
  ),
});

function conditionOf(run: EvaluationRunRecord) {
  return (
    run.preprocessingNotes.find((note) => note.startsWith("Condition: "))?.slice(11) ?? run.inputCondition
  );
}

function wilsonInterval(correct: number, total: number) {
  if (!total) return { lower: 0, upper: 0 };
  const z = 1.959963984540054,
    p = correct / total,
    denominator = 1 + (z * z) / total;
  const centre = (p + (z * z) / (2 * total)) / denominator;
  const margin = (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denominator;
  return { lower: Math.max(0, centre - margin), upper: Math.min(1, centre + margin) };
}

function summarizeCondition(
  runs: EvaluationRunRecord[],
  condition: string,
  candidates: Array<{ seed: number; answerOptions: string[] }>,
) {
  const seeds = candidates.map(({ seed }) => seed);
  const optionsBySeed = new Map(candidates.map(({ seed, answerOptions }) => [seed, answerOptions]));
  const selected = runs.filter((run) => conditionOf(run) === condition && seeds.includes(run.seed));
  const bySeed = new Map<number, EvaluationRunRecord[]>();
  for (const run of selected) bySeed.set(run.seed, [...(bySeed.get(run.seed) ?? []), run]);
  const substantive: Array<{
    run: EvaluationRunRecord;
    adjudicated: boolean;
    claimedAnswer?: string;
  }> = [];
  for (const records of bySeed.values()) {
    const valid = records.filter((run) => run.status === "verified" && !run.emptyResponse);
    if (valid.length > 1)
      throw new Error(`More than one substantive answer for seed ${records[0]?.seed} under ${condition}`);
    if (valid.length === 1) {
      substantive.push({ run: valid[0]!, adjudicated: false });
      continue;
    }
    const adjudicated = records.flatMap((run) => {
      if (run.status !== "pending-review" || run.emptyResponse || run.finishReason !== "stop") return [];
      const options = optionsBySeed.get(run.seed);
      if (!options) throw new Error(`Missing answer options for seed ${run.seed} under ${condition}`);
      const decision = adjudicateExplicitDeclaration(run.rawResponse, options);
      return decision ? [{ run, claimedAnswer: decision.claimedAnswer }] : [];
    });
    if (adjudicated.length > 1)
      throw new Error(`More than one adjudicable answer for seed ${records[0]?.seed} under ${condition}`);
    if (adjudicated.length === 1) substantive.push({ ...adjudicated[0]!, adjudicated: true });
  }
  const correct = substantive.filter((entry) =>
    entry.adjudicated ? entry.claimedAnswer === entry.run.expectedAnswer : entry.run.correct,
  ).length;
  const adjudicatedRunIds = new Set(
    substantive.filter((entry) => entry.adjudicated).map((entry) => entry.run.id),
  );
  const interval = wilsonInterval(correct, substantive.length);
  return {
    condition,
    requests: selected.length,
    substantiveAnswers: substantive.length,
    adjudicatedAnswers: substantive.filter((entry) => entry.adjudicated).length,
    correct,
    solveRate: substantive.length ? correct / substantive.length : null,
    lower95: substantive.length ? interval.lower : null,
    upper95: substantive.length ? interval.upper : null,
    pendingReview: selected.filter((run) => run.status === "pending-review" && !adjudicatedRunIds.has(run.id))
      .length,
    emptyResponses: selected.filter((run) => run.emptyResponse).length,
    costUsd: selected.reduce((sum, run) => sum + run.costUsd, 0),
  };
}

const resultDirectory = resolve("evaluation/results");
const resultNames = await readdir(resultDirectory);
const families = [];
const allPublishedRuns: EvaluationRunRecord[] = [];

for (const [catalogueId, planId] of specs) {
  const manifest = manifestSchema.parse(
    JSON.parse(await readFile(resolve(`public/evaluations/${planId}/manifest.json`), "utf8")),
  );
  const names = resultNames.filter(
    (name) => name.startsWith(`${planId}-`) && name.endsWith(".jsonl") && !abandonedResultFiles.has(name),
  );
  if (!names.length) throw new Error(`No results found for ${planId}`);
  const runs = (
    await Promise.all(
      names.map(async (name) =>
        (await readFile(resolve(resultDirectory, name), "utf8"))
          .split("\n")
          .filter(Boolean)
          .map((line) => evaluationRunSchema.parse(JSON.parse(line))),
      ),
    )
  ).flat();
  const uniqueRuns = [...new Map(runs.map((run) => [run.id, run])).values()];
  if (uniqueRuns.some((run) => run.evaluationPlanId !== planId))
    throw new Error(`Result-plan mismatch in ${planId}`);
  allPublishedRuns.push(...uniqueRuns);

  const conditions = [...new Set(manifest.cases.map((candidate) => candidate.condition))];
  const nativeCondition = conditions.find((condition) => condition.startsWith("native"));
  const controlCondition = conditions.find((condition) => condition !== nativeCondition);
  if (!nativeCondition || !controlCondition)
    throw new Error(`${planId} must have one native and one control condition`);
  const nativeCases = manifest.cases.filter((candidate) => candidate.condition === nativeCondition);
  const controlCases = manifest.cases.filter((candidate) => candidate.condition === controlCondition);
  const models = modelIds.map((modelId) => {
    const modelRuns = uniqueRuns.filter((run) => run.modelId === modelId);
    if (!modelRuns.length) throw new Error(`Missing ${modelId} results for ${planId}`);
    return {
      modelId,
      modelVersion: modelRuns[0]!.modelVersion,
      upstreamProvider: modelRuns[0]!.upstreamProvider,
      native: summarizeCondition(modelRuns, nativeCondition, nativeCases),
      control: summarizeCondition(modelRuns, controlCondition, controlCases),
    };
  });
  const expandedModels = (expandedModelIdsByPlan.get(planId) ?? []).map((modelId) => {
    const modelRuns = uniqueRuns.filter((run) => run.modelId === modelId);
    if (!modelRuns.length) throw new Error(`Missing expanded ${modelId} results for ${planId}`);
    return {
      modelId,
      modelVersion: modelRuns[0]!.modelVersion,
      upstreamProvider: modelRuns[0]!.upstreamProvider,
      native: summarizeCondition(modelRuns, nativeCondition, nativeCases),
      control: summarizeCondition(modelRuns, controlCondition, controlCases),
    };
  });
  if (
    expandedModels.some(
      ({ native }) => native.substantiveAnswers < 16 || native.solveRate === null || native.solveRate >= 0.5,
    )
  )
    throw new Error(`${planId} does not satisfy its expanded-route confirmation gate`);
  const admitted = models.every(
    ({ native }) => native.substantiveAnswers >= 16 && native.solveRate !== null && native.solveRate < 0.5,
  );
  if (!admitted) throw new Error(`${planId} does not satisfy the 16-case below-half admission gate`);
  const sample = nativeCases[0]!;
  const difficultyValues = [...new Set(nativeCases.map((candidate) => candidate.difficulty))].sort(
    (left, right) => left - right,
  );
  families.push({
    catalogueId,
    planId,
    planSha256: manifest.planSha256,
    generatorVersion: manifest.generatorVersion,
    renderer: manifest.renderer,
    modality: sample.mimeType === "image/png" ? "image" : "video",
    nativeCondition,
    controlCondition,
    admitted,
    humanSolvability: sample.humanSolvability ?? "unverified",
    difficultySetting: {
      values: difficultyValues,
      label:
        difficultyValues.length === 1
          ? `${difficultyValues[0]}/100`
          : `${difficultyValues[0]}–${difficultyValues.at(-1)}/100 answer-balanced stratum`,
      nativeCases: nativeCases.length,
    },
    sample: {
      candidateId: sample.candidateId,
      seed: sample.seed,
      artifactPath: `/${sample.artifact.replace(/^public\//, "")}`,
      mimeType: sample.mimeType,
      question: sample.question,
      answerOptions: sample.answerOptions,
      expectedAnswer: sample.expectedAnswer,
      difficulty: sample.difficulty,
    },
    models,
    ...(expandedModels.length ? { expandedModels } : {}),
  });
}

const outputRuns = [...new Map(allPublishedRuns.map((run) => [run.id, run])).values()].sort(
  (a, b) => a.evaluatedAt.localeCompare(b.evaluatedAt) || a.id.localeCompare(b.id),
);
const generatedAt = outputRuns.reduce(
  (latest, run) => (run.evaluatedAt > latest ? run.evaluatedAt : latest),
  "1970-01-01T00:00:00.000Z",
);
const summary = {
  schemaVersion: 1,
  generatedAt,
  admissionRule:
    "Every prespecified route has at least 16 substantive answers and an observed native solve rate strictly below 50%.",
  families,
};
for (const [path, value] of [
  ["src/data/admitted-families.json", summary],
  ["src/data/admitted-runs.json", outputRuns],
] as const) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}
console.log({
  families: families.length,
  imageFamilies: families.filter((family) => family.modality === "image").length,
  videoFamilies: families.filter((family) => family.modality === "video").length,
  runs: outputRuns.length,
  generatedAt,
});
