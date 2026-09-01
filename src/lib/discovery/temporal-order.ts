import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const temporalOrderVersion = "temporal-order-v1";
export const temporalOrders = ["A-B-C-D", "B-D-A-C", "C-A-D-B", "D-C-B-A"] as const;

export const temporalOrderCandidateSchema = z.object({
  id: z.string(),
  cellId: z.string(),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("brief-event-temporal-ordering"),
  question: z.string(),
  answerOptions: z.array(z.enum(temporalOrders)).length(4),
  expectedAnswer: z.enum(temporalOrders),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    orderIndex: z.number().int().min(0).max(3),
    flashDurationMs: z.number().int().min(100).max(600),
    gapMs: z.number().int().min(400).max(1500),
    videoDurationMs: z.number().int().min(5000).max(12000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type TemporalOrderCandidate = z.infer<typeof temporalOrderCandidateSchema>;

function rng(seed: number) {
  let state = seed >>> 0;
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000);
}

function shuffle<T>(values: readonly T[], random: () => number) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export function createTemporalOrderCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  orderIndex: number;
  flashDurationMs?: number;
  gapMs?: number;
  visualVariant?: number;
}) {
  const flashDurationMs = input.flashDurationMs ?? 200;
  const gapMs = input.gapMs ?? 700;
  const videoDurationMs = 7000;
  const visualVariant = input.visualVariant ?? input.seed % 127;
  return temporalOrderCandidateSchema.parse({
    id: `to-${sha256(JSON.stringify({ ...input, flashDurationMs, gapMs, visualVariant })).slice(0, 16)}`,
    cellId: `cell-${sha256(JSON.stringify({ flashDurationMs, gapMs })).slice(0, 16)}`,
    split: input.split,
    seed: input.seed,
    failureModeId: "brief-event-temporal-ordering",
    question: "In what order do the four labeled disks flash yellow?",
    answerOptions: shuffle(temporalOrders, rng(input.seed + 7)),
    expectedAnswer: temporalOrders[input.orderIndex],
    humanSolvability: "unverified",
    parameters: { orderIndex: input.orderIndex, flashDurationMs, gapMs, videoDurationMs, fps: 30, visualVariant },
  });
}

export function createTemporalOrderDiscoveryGrid() {
  const candidates: TemporalOrderCandidate[] = [];
  let seed = 1_800_000;
  for (let replicate = 0; replicate < 2; replicate += 1)
    for (let orderIndex = 0; orderIndex < temporalOrders.length; orderIndex += 1)
      candidates.push(createTemporalOrderCandidate({ split: "discovery", seed: seed++, orderIndex, visualVariant: replicate * 4 + orderIndex }));
  return candidates;
}

export function temporalOrderSchedule(candidate: TemporalOrderCandidate) {
  const labels = temporalOrders[candidate.parameters.orderIndex].split("-");
  const random = rng(candidate.seed + candidate.parameters.visualVariant * 911);
  const first = 1500 + Math.round(random() * 300);
  return labels.map((label, index) => ({ label, startMs: first + index * candidate.parameters.gapMs }));
}

export function renderTemporalOrderSvg(candidate: TemporalOrderCandidate, timestampMs: number) {
  const schedule = temporalOrderSchedule(candidate);
  const positions: Record<string, [number, number]> = { A: [190, 250], B: [540, 250], C: [190, 480], D: [540, 480] };
  const disks = ["A", "B", "C", "D"].map((label) => {
    const [x, y] = positions[label]!;
    const event = schedule.find((entry) => entry.label === label)!;
    const active = timestampMs >= event.startMs && timestampMs < event.startMs + candidate.parameters.flashDurationMs;
    return `<circle cx="${x}" cy="${y}" r="72" fill="${active ? "#f4d934" : "#4f5653"}" stroke="#202322" stroke-width="5"/><text x="${x}" y="${y + 18}" text-anchor="middle" font-family="Arial" font-size="54" font-weight="700" fill="${active ? "#202322" : "#fff"}">${label}</text>`;
  }).join("");
  const ready = timestampMs < 1000 ? "GET READY" : timestampMs > 5200 ? "DONE" : "WATCH";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="640"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="55" text-anchor="middle" font-family="Arial" font-size="27" font-weight="700">REMEMBER THE ORDER OF THE YELLOW FLASHES</text><text x="360" y="100" text-anchor="middle" font-family="Arial" font-size="23" fill="#59605d">${ready}</text>${disks}</svg>`;
}
