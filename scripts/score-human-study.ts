import { readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import admitted from "../src/data/admitted-families.json" with { type: "json" };
import study from "../src/data/human-study-manifest.json" with { type: "json" };

const responseSchema = z.object({
  studyCaseId: z.string(),
  candidateId: z.string(),
  catalogueId: z.string(),
  selectedAnswer: z.string(),
  mediaSha256: z.string().regex(/^[a-f0-9]{64}$/),
  responseLatencyMs: z.number().nonnegative(),
  presentationDurationMs: z.number().nonnegative(),
  visibilityInterruptions: z.number().int().nonnegative(),
  recordedAt: z.string().datetime(),
});
const packetSchema = z.object({
  schemaVersion: z.literal(1),
  protocolId: z.literal(study.protocolId),
  session: z.object({
    protocolId: z.literal(study.protocolId),
    sessionId: z.string().uuid(),
    blockId: z.string(),
    startedAt: z.string().datetime(),
    responses: z.array(responseSchema),
  }),
});
const sourceManifestSchema = z.object({
  cases: z.array(
    z.object({
      candidateId: z.string(),
      condition: z.string(),
      expectedAnswer: z.string(),
      answerOptions: z.array(z.string()),
      sha256: z.string(),
    }),
  ),
});

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function wilson(correct: number, total: number) {
  if (!total) return { lower95: null, upper95: null };
  const zScore = 1.959963984540054;
  const proportion = correct / total;
  const denominator = 1 + (zScore * zScore) / total;
  const centre = (proportion + (zScore * zScore) / (2 * total)) / denominator;
  const margin =
    (zScore * Math.sqrt((proportion * (1 - proportion)) / total + (zScore * zScore) / (4 * total * total))) /
    denominator;
  return { lower95: Math.max(0, centre - margin), upper95: Math.min(1, centre + margin) };
}

const inputDirectory = argument("--input");
const outputPath = argument("--output") ?? "evaluation/human-study-summary.json";
const allowPartial = process.argv.includes("--allow-partial");
if (!inputDirectory) throw new Error("Usage: npm run score:human-study -- --input <packet-directory>");

const blockById = new Map(study.blocks.map((block) => [block.blockId, block]));
const sourceByCandidate = new Map<
  string,
  { expectedAnswer: string; mediaSha256: string; answerOptions: string[] }
>();
for (const family of admitted.families) {
  const source = sourceManifestSchema.parse(
    JSON.parse(await readFile(resolve(`public/evaluations/${family.planId}/manifest.json`), "utf8")),
  );
  for (const candidate of source.cases.filter((candidate) => candidate.condition === family.nativeCondition))
    sourceByCandidate.set(candidate.candidateId, {
      expectedAnswer: candidate.expectedAnswer,
      mediaSha256: candidate.sha256,
      answerOptions: candidate.answerOptions,
    });
}

const packetNames = (await readdir(resolve(inputDirectory))).filter((name) => name.endsWith(".json"));
if (!packetNames.length) throw new Error(`No JSON response packets in ${resolve(inputDirectory)}`);
const packets = await Promise.all(
  packetNames.map(async (name) => ({
    name,
    packet: packetSchema.parse(JSON.parse(await readFile(resolve(inputDirectory, name), "utf8"))),
  })),
);
if (new Set(packets.map(({ packet }) => packet.session.sessionId)).size !== packets.length)
  throw new Error("Duplicate sessionId across response packets");

const scored = packets.flatMap(({ name, packet }) => {
  const { session } = packet;
  const block = blockById.get(session.blockId);
  if (!block) throw new Error(`${name}: unknown block ${session.blockId}`);
  if (!allowPartial && session.responses.length !== block.cases.length)
    throw new Error(`${name}: expected ${block.cases.length} responses, found ${session.responses.length}`);
  const expectedByStudyCase = new Map(block.cases.map((candidate) => [candidate.studyCaseId, candidate]));
  if (new Set(session.responses.map((response) => response.studyCaseId)).size !== session.responses.length)
    throw new Error(`${name}: duplicate studyCaseId`);
  return session.responses.map((response) => {
    const assigned = expectedByStudyCase.get(response.studyCaseId);
    if (!assigned || assigned.candidateId !== response.candidateId)
      throw new Error(`${name}: response ${response.studyCaseId} was not assigned to ${session.blockId}`);
    if (assigned.catalogueId !== response.catalogueId || assigned.mediaSha256 !== response.mediaSha256)
      throw new Error(`${name}: response metadata mismatch for ${response.studyCaseId}`);
    const source = sourceByCandidate.get(response.candidateId);
    if (!source || source.mediaSha256 !== response.mediaSha256)
      throw new Error(`${name}: source binding mismatch for ${response.studyCaseId}`);
    if (!source.answerOptions.includes(response.selectedAnswer))
      throw new Error(`${name}: selected answer is outside the assigned forced-choice set`);
    return {
      sessionId: session.sessionId,
      blockId: session.blockId,
      ...response,
      correct: response.selectedAnswer === source.expectedAnswer,
    };
  });
});

const families = admitted.families.map((family) => {
  const responses = scored.filter((response) => response.catalogueId === family.catalogueId);
  const correct = responses.filter((response) => response.correct).length;
  return {
    catalogueId: family.catalogueId,
    modality: family.modality,
    participants: new Set(responses.map((response) => response.sessionId)).size,
    uniqueItems: new Set(responses.map((response) => response.studyCaseId)).size,
    responses: responses.length,
    correct,
    accuracy: responses.length ? correct / responses.length : null,
    ...wilson(correct, responses.length),
    visibilityInterruptedResponses: responses.filter((response) => response.visibilityInterruptions > 0)
      .length,
  };
});

const totalCorrect = scored.filter((response) => response.correct).length;
const summary = {
  schemaVersion: 1,
  protocolId: study.protocolId,
  generatedAt: new Date().toISOString(),
  packetFiles: packets.length,
  participants: packets.length,
  responses: scored.length,
  correct: totalCorrect,
  accuracy: scored.length ? totalCorrect / scored.length : null,
  ...wilson(totalCorrect, scored.length),
  warning:
    "Wilson intervals are descriptive; use the preregistered crossed participant/item model for inference.",
  families,
};
await writeFile(resolve(outputPath), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary));
