import { z } from "zod";

export const humanResponseSchema = z.object({
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

export interface HumanStudyCase {
  studyCaseId: string;
  candidateId: string;
  catalogueId: string;
  mediaSha256: string;
  question: string;
  answerOptions: string[];
}

export interface HumanStudyManifest {
  protocolId: string;
  blocks: Array<{ blockId: string; cases: HumanStudyCase[] }>;
}

export interface HumanStudyFamily {
  catalogueId: string;
  modality: string;
}

export interface HumanSourceBinding {
  expectedAnswer: string;
  mediaSha256: string;
  question: string;
  answerOptions: string[];
}

export interface NamedHumanPacket {
  name: string;
  packet: unknown;
}

export function humanPacketSchema(protocolId: string) {
  return z.object({
    schemaVersion: z.literal(1),
    protocolId: z.literal(protocolId),
    session: z.object({
      protocolId: z.literal(protocolId),
      sessionId: z.string().uuid(),
      blockId: z.string(),
      assignmentMode: z.enum(["quota-link", "random-demo"]).optional(),
      startedAt: z.string().datetime(),
      responses: z.array(humanResponseSchema),
    }),
  });
}

function sameStringSet(left: readonly string[], right: readonly string[]) {
  return (
    left.length === right.length &&
    new Set(left).size === left.length &&
    left.every((item) => right.includes(item))
  );
}

export function wilsonInterval(correct: number, total: number) {
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

export function scoreHumanStudy({
  study,
  families,
  sourceByCandidate,
  packets: packetInputs,
  allowPartial = false,
  generatedAt = new Date().toISOString(),
}: {
  study: HumanStudyManifest;
  families: HumanStudyFamily[];
  sourceByCandidate: ReadonlyMap<string, HumanSourceBinding>;
  packets: NamedHumanPacket[];
  allowPartial?: boolean;
  generatedAt?: string;
}) {
  if (!packetInputs.length) throw new Error("No JSON response packets");
  const packetSchema = humanPacketSchema(study.protocolId);
  const packets = packetInputs.map(({ name, packet }) => ({ name, packet: packetSchema.parse(packet) }));
  if (new Set(packets.map(({ packet }) => packet.session.sessionId)).size !== packets.length)
    throw new Error("Duplicate sessionId across response packets");

  const blockById = new Map(study.blocks.map((block) => [block.blockId, block]));
  if (blockById.size !== study.blocks.length) throw new Error("Duplicate blockId in study manifest");

  const studyCases = study.blocks.flatMap((block) => block.cases);
  const studyCaseIds = new Set(studyCases.map((candidate) => candidate.studyCaseId));
  if (studyCaseIds.size !== studyCases.length) throw new Error("Duplicate studyCaseId in study manifest");
  for (const assigned of studyCases) {
    const source = sourceByCandidate.get(assigned.candidateId);
    if (!source) throw new Error(`Study manifest has no sealed source for ${assigned.studyCaseId}`);
    if (source.mediaSha256 !== assigned.mediaSha256 || source.question !== assigned.question)
      throw new Error(`Study manifest source binding mismatch for ${assigned.studyCaseId}`);
    if (!sameStringSet(source.answerOptions, assigned.answerOptions))
      throw new Error(`Study manifest answer choices mismatch for ${assigned.studyCaseId}`);
    if (!source.answerOptions.includes(source.expectedAnswer))
      throw new Error(`Sealed answer is outside the forced-choice set for ${assigned.studyCaseId}`);
  }

  const scored = packets.flatMap(({ name, packet }) => {
    const { session } = packet;
    const block = blockById.get(session.blockId);
    if (!block) throw new Error(`${name}: unknown block ${session.blockId}`);
    if (!allowPartial && session.responses.length !== block.cases.length)
      throw new Error(`${name}: expected ${block.cases.length} responses, found ${session.responses.length}`);
    if (session.responses.length > block.cases.length)
      throw new Error(`${name}: too many responses for ${session.blockId}`);
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
      if (!assigned.answerOptions.includes(response.selectedAnswer))
        throw new Error(`${name}: selected answer is outside the assigned forced-choice set`);
      return {
        sessionId: session.sessionId,
        blockId: session.blockId,
        ...response,
        correct: response.selectedAnswer === source.expectedAnswer,
      };
    });
  });

  const familySummaries = families.map((family) => {
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
      ...wilsonInterval(correct, responses.length),
      visibilityInterruptedResponses: responses.filter((response) => response.visibilityInterruptions > 0)
        .length,
    };
  });

  const totalCorrect = scored.filter((response) => response.correct).length;
  const assignmentModes = {
    quotaLink: packets.filter(({ packet }) => packet.session.assignmentMode === "quota-link").length,
    randomDemo: packets.filter(({ packet }) => packet.session.assignmentMode === "random-demo").length,
    legacyUnrecorded: packets.filter(({ packet }) => packet.session.assignmentMode === undefined).length,
  };
  return {
    schemaVersion: 1 as const,
    protocolId: study.protocolId,
    generatedAt,
    packetFiles: packets.length,
    participants: packets.length,
    assignmentModes,
    responses: scored.length,
    correct: totalCorrect,
    accuracy: scored.length ? totalCorrect / scored.length : null,
    ...wilsonInterval(totalCorrect, scored.length),
    warning:
      "Wilson intervals are descriptive; use the preregistered crossed participant/item model for inference.",
    families: familySummaries,
  };
}
