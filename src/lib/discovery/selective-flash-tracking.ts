import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const selectiveFlashVersion = "selective-flash-tracking-v1";
export const selectiveFlashAnswers = ["8", "9", "10", "11"] as const;

export const selectiveFlashCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("identity-conditioned-temporal-event-counting"),
  question: z.string(),
  answerOptions: z.array(z.enum(selectiveFlashAnswers)).length(4),
  expectedAnswer: z.enum(selectiveFlashAnswers),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    targetCount: z.number().int().min(4).max(16),
    flashDurationMs: z.number().int().min(67).max(500),
    distractorObjects: z.number().int().min(1).max(7),
    videoDurationMs: z.number().int().min(6000).max(20000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type SelectiveFlashCandidate = z.infer<typeof selectiveFlashCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function rotate<T>(values: readonly T[], amount: number) {
  return values.map((_, index) => values[(index + amount) % values.length]!);
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

export function createSelectiveFlashCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  targetCount: number;
  flashDurationMs?: number;
  distractorObjects?: number;
  videoDurationMs?: number;
  visualVariant?: number;
}) {
  const flashDurationMs = input.flashDurationMs ?? 133;
  const distractorObjects = input.distractorObjects ?? 4;
  const videoDurationMs = input.videoDurationMs ?? 12_000;
  const visualVariant = input.visualVariant ?? input.seed % 109;
  return selectiveFlashCandidateSchema.parse({
    id: stableId("sf", { ...input, flashDurationMs, distractorObjects, videoDurationMs, visualVariant }),
    cellId: stableId("cell", { flashDurationMs, distractorObjects, videoDurationMs }),
    split: input.split,
    seed: input.seed,
    failureModeId: "identity-conditioned-temporal-event-counting",
    question: "How many times does the RED-RINGED target disk flash yellow? Ignore every other disk.",
    answerOptions: rotate(selectiveFlashAnswers, input.seed % 4),
    expectedAnswer: String(input.targetCount),
    humanSolvability: "unverified",
    parameters: {
      targetCount: input.targetCount,
      flashDurationMs,
      distractorObjects,
      videoDurationMs,
      fps: 30,
      visualVariant,
    },
  });
}

export function createSelectiveFlashDiscoveryGrid() {
  const candidates: SelectiveFlashCandidate[] = [];
  let seed = 1_600_000;
  for (let replicate = 0; replicate < 2; replicate += 1) {
    for (const answer of selectiveFlashAnswers) {
      candidates.push(
        createSelectiveFlashCandidate({
          split: "discovery",
          seed,
          targetCount: Number(answer),
          visualVariant: 50 + replicate * 4 + Number(answer),
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

export function createSelectiveFlashHoldout() {
  const candidates: SelectiveFlashCandidate[] = [];
  let seed = 1_610_000;
  for (let replicate = 0; replicate < 4; replicate += 1) {
    for (const answer of selectiveFlashAnswers) {
      candidates.push(createSelectiveFlashCandidate({
        split: "confirmatory",
        seed: seed++,
        targetCount: Number(answer),
        flashDurationMs: 133,
        distractorObjects: 4,
        videoDurationMs: 12_000,
        visualVariant: 300 + replicate * 4 + Number(answer),
      }));
    }
  }
  return candidates;
}

function flashStarts(candidate: SelectiveFlashCandidate, object: number) {
  const random = rng(candidate.seed + object * 7919 + candidate.parameters.visualVariant * 101);
  const count = object === 0 ? candidate.parameters.targetCount : 7 + ((candidate.seed + object) % 6);
  const usable = candidate.parameters.videoDurationMs - 2600;
  return Array.from({ length: count }, (_, index) => {
    const base = 1400 + ((index + 0.5) * usable) / count;
    return Math.round(base + (random() - 0.5) * Math.min(260, usable / count / 2));
  });
}

export function targetFlashStarts(candidate: SelectiveFlashCandidate) {
  return flashStarts(candidate, 0);
}

function isFlashing(candidate: SelectiveFlashCandidate, object: number, timestampMs: number) {
  return flashStarts(candidate, object).some(
    (start) => timestampMs >= start && timestampMs < start + candidate.parameters.flashDurationMs,
  );
}

export function renderSelectiveFlashSvg(candidate: SelectiveFlashCandidate, timestampMs: number, control = false) {
  const objects = control ? 1 : candidate.parameters.distractorObjects + 1;
  const t = timestampMs / candidate.parameters.videoDurationMs;
  const disks = Array.from({ length: objects }, (_, object) => {
    const phase = (object / objects) * Math.PI * 2 + candidate.parameters.visualVariant * 0.17;
    // Smooth ping-pong motion avoids the identity-breaking teleport that a
    // modulo wrap would introduce at the edge of the canvas.
    const x = 90 + (0.5 - 0.5 * Math.cos((t * 2.7 + object / objects) * Math.PI * 2)) * 540;
    const y = 240 + Math.sin(t * Math.PI * (4 + (object % 2)) + phase) * (120 - object * 7);
    const flashing = control
      ? flashStarts(candidate, object).some((start) => timestampMs >= start && timestampMs < start + 500)
      : isFlashing(candidate, object, timestampMs);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="26" fill="${flashing ? "#f4d934" : "#555b58"}" stroke="${object === 0 ? "#e23e31" : "#f7f5ef"}" stroke-width="${object === 0 ? 8 : 3}"/>${object === 0 ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34" fill="none" stroke="#e23e31" stroke-width="2"/>` : ""}`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480"><rect width="100%" height="100%" fill="#e9e6dc"/><text x="24" y="38" font-family="Arial" font-size="22" font-weight="700">${control ? "CONTROL: COUNT THE LONG FLASHES" : "COUNT YELLOW FLASHES ON THE RED-RINGED DISK ONLY"}</text><path d="M0 420H720" stroke="#252928" opacity=".16"/>${disks}</svg>`;
}
