import { describe, expect, it } from "vitest";
import { scoreHumanStudy, type HumanSourceBinding, type HumanStudyManifest } from "@/lib/human-study-scoring";

const protocolId = "test-protocol-v1";
const mediaA = "a".repeat(64);
const mediaB = "b".repeat(64);
const sessionId = "11111111-1111-4111-8111-111111111111";

function fixtures() {
  const study: HumanStudyManifest = {
    protocolId,
    blocks: [
      {
        blockId: "block-01",
        cases: [
          {
            studyCaseId: "study-a",
            candidateId: "candidate-a",
            catalogueId: "family-a",
            mediaSha256: mediaA,
            question: "Which letter?",
            answerOptions: ["B", "A"],
          },
          {
            studyCaseId: "study-b",
            candidateId: "candidate-b",
            catalogueId: "family-a",
            mediaSha256: mediaB,
            question: "How many?",
            answerOptions: ["2", "3"],
          },
        ],
      },
    ],
  };
  const sourceByCandidate = new Map<string, HumanSourceBinding>([
    [
      "candidate-a",
      {
        expectedAnswer: "A",
        mediaSha256: mediaA,
        question: "Which letter?",
        answerOptions: ["A", "B"],
      },
    ],
    [
      "candidate-b",
      {
        expectedAnswer: "2",
        mediaSha256: mediaB,
        question: "How many?",
        answerOptions: ["2", "3"],
      },
    ],
  ]);
  const packet = {
    schemaVersion: 1,
    protocolId,
    session: {
      protocolId,
      sessionId,
      blockId: "block-01",
      startedAt: "2026-09-01T00:00:00.000Z",
      responses: [
        {
          studyCaseId: "study-a",
          candidateId: "candidate-a",
          catalogueId: "family-a",
          selectedAnswer: "A",
          mediaSha256: mediaA,
          responseLatencyMs: 1_200,
          presentationDurationMs: 0,
          visibilityInterruptions: 0,
          recordedAt: "2026-09-01T00:00:02.000Z",
        },
        {
          studyCaseId: "study-b",
          candidateId: "candidate-b",
          catalogueId: "family-a",
          selectedAnswer: "3",
          mediaSha256: mediaB,
          responseLatencyMs: 2_400,
          presentationDurationMs: 5_000,
          visibilityInterruptions: 1,
          recordedAt: "2026-09-01T00:00:08.000Z",
        },
      ],
    },
  };
  return { study, sourceByCandidate, packet };
}

function scoreFixture(overrides: Partial<Parameters<typeof scoreHumanStudy>[0]> = {}) {
  const fixture = fixtures();
  return scoreHumanStudy({
    study: fixture.study,
    families: [{ catalogueId: "family-a", modality: "image" }],
    sourceByCandidate: fixture.sourceByCandidate,
    packets: [{ name: "participant.json", packet: fixture.packet }],
    generatedAt: "2026-09-01T01:00:00.000Z",
    ...overrides,
  });
}

describe("sealed human-study scoring", () => {
  it("scores valid packets without exposing participant rows", () => {
    const summary = scoreFixture();
    expect(summary).toMatchObject({
      protocolId,
      packetFiles: 1,
      participants: 1,
      responses: 2,
      correct: 1,
      accuracy: 0.5,
      generatedAt: "2026-09-01T01:00:00.000Z",
    });
    expect(summary.families[0]).toMatchObject({
      catalogueId: "family-a",
      participants: 1,
      uniqueItems: 2,
      responses: 2,
      correct: 1,
      visibilityInterruptedResponses: 1,
    });
    expect(summary).not.toHaveProperty("sessions");
    expect(summary.lower95).toBeLessThan(0.5);
    expect(summary.upper95).toBeGreaterThan(0.5);
  });

  it("permits declared partial analysis but rejects incomplete primary packets", () => {
    const { study, sourceByCandidate, packet } = fixtures();
    packet.session.responses.pop();
    const input = {
      study,
      families: [{ catalogueId: "family-a", modality: "image" }],
      sourceByCandidate,
      packets: [{ name: "partial.json", packet }],
    };
    expect(() => scoreHumanStudy(input)).toThrow("expected 2 responses, found 1");
    expect(scoreHumanStudy({ ...input, allowPartial: true }).responses).toBe(1);
  });

  it("rejects duplicate sessions and duplicate item responses", () => {
    const { study, sourceByCandidate, packet } = fixtures();
    expect(() =>
      scoreHumanStudy({
        study,
        families: [],
        sourceByCandidate,
        packets: [
          { name: "one.json", packet },
          { name: "two.json", packet: structuredClone(packet) },
        ],
      }),
    ).toThrow("Duplicate sessionId");

    packet.session.responses[1] = structuredClone(packet.session.responses[0]);
    expect(() =>
      scoreHumanStudy({
        study,
        families: [],
        sourceByCandidate,
        packets: [{ name: "duplicate.json", packet }],
      }),
    ).toThrow("duplicate studyCaseId");
  });

  it("rejects unassigned responses, metadata changes, and answers outside the shown choices", () => {
    const unassigned = fixtures();
    unassigned.packet.session.responses[0]!.candidateId = "candidate-b";
    expect(() =>
      scoreHumanStudy({
        study: unassigned.study,
        families: [],
        sourceByCandidate: unassigned.sourceByCandidate,
        packets: [{ name: "unassigned.json", packet: unassigned.packet }],
      }),
    ).toThrow("was not assigned");

    const altered = fixtures();
    altered.packet.session.responses[0]!.mediaSha256 = mediaB;
    expect(() =>
      scoreHumanStudy({
        study: altered.study,
        families: [],
        sourceByCandidate: altered.sourceByCandidate,
        packets: [{ name: "altered.json", packet: altered.packet }],
      }),
    ).toThrow("metadata mismatch");

    const outside = fixtures();
    outside.packet.session.responses[0]!.selectedAnswer = "C";
    expect(() =>
      scoreHumanStudy({
        study: outside.study,
        families: [],
        sourceByCandidate: outside.sourceByCandidate,
        packets: [{ name: "outside.json", packet: outside.packet }],
      }),
    ).toThrow("outside the assigned forced-choice set");
  });

  it("rejects drift between the answer-free instrument and sealed source", () => {
    const changedQuestion = fixtures();
    changedQuestion.study.blocks[0]!.cases[0]!.question = "A changed prompt";
    expect(() =>
      scoreHumanStudy({
        study: changedQuestion.study,
        families: [],
        sourceByCandidate: changedQuestion.sourceByCandidate,
        packets: [{ name: "question.json", packet: changedQuestion.packet }],
      }),
    ).toThrow("source binding mismatch");

    const changedChoices = fixtures();
    changedChoices.study.blocks[0]!.cases[0]!.answerOptions = ["A", "C"];
    expect(() =>
      scoreHumanStudy({
        study: changedChoices.study,
        families: [],
        sourceByCandidate: changedChoices.sourceByCandidate,
        packets: [{ name: "choices.json", packet: changedChoices.packet }],
      }),
    ).toThrow("answer choices mismatch");

    const invalidKey = fixtures();
    invalidKey.sourceByCandidate.get("candidate-a")!.expectedAnswer = "C";
    expect(() =>
      scoreHumanStudy({
        study: invalidKey.study,
        families: [],
        sourceByCandidate: invalidKey.sourceByCandidate,
        packets: [{ name: "key.json", packet: invalidKey.packet }],
      }),
    ).toThrow("Sealed answer is outside");
  });
});
