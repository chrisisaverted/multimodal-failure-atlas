import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const temporalRelationsVersion = "temporal-relations-v1";
export const temporalRelationAnswers = ["A", "B", "C", "D"] as const;
export const temporalRelationTasks = ["duration-comparison", "synchrony-detection"] as const;

export const temporalRelationCandidateSchema = z.object({
  id: z.string(), cellId: z.string(), split: z.enum(["discovery", "confirmatory"]), seed: z.number().int().nonnegative(),
  failureModeId: z.enum(["visual-duration-comparison", "temporal-synchrony-detection"]),
  task: z.enum(temporalRelationTasks), question: z.string(), answerOptions: z.array(z.enum(temporalRelationAnswers)).length(4), expectedAnswer: z.enum(temporalRelationAnswers), humanSolvability: z.literal("unverified"),
  parameters: z.object({ correctIndex: z.number().int().min(0).max(3), videoDurationMs: z.literal(8000), fps: z.literal(30), visualVariant: z.number().int().nonnegative() }),
});
export type TemporalRelationCandidate = z.infer<typeof temporalRelationCandidateSchema>;

function rng(seed: number) { let state = seed >>> 0; return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 0x1_0000_0000); }
function shuffle<T>(values: readonly T[], random: () => number) { const result = [...values]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j]!, result[i]!]; } return result; }

export function createTemporalRelationCandidate(input: { task: typeof temporalRelationTasks[number]; split: "discovery" | "confirmatory"; seed: number; correctIndex: number; visualVariant?: number }) {
  const visualVariant = input.visualVariant ?? input.seed % 131;
  const failureModeId = input.task === "duration-comparison" ? "visual-duration-comparison" : "temporal-synchrony-detection";
  return temporalRelationCandidateSchema.parse({
    id: `tr-${sha256(JSON.stringify({ ...input, visualVariant })).slice(0, 16)}`,
    cellId: `cell-${sha256(input.task).slice(0, 16)}`,
    split: input.split, seed: input.seed, failureModeId, task: input.task,
    question: input.task === "duration-comparison" ? "Which labeled disk stays yellow for the longest single interval?" : "Which labeled pair flashes yellow at exactly the same times?",
    answerOptions: shuffle(temporalRelationAnswers, rng(input.seed + 9)), expectedAnswer: temporalRelationAnswers[input.correctIndex], humanSolvability: "unverified",
    parameters: { correctIndex: input.correctIndex, videoDurationMs: 8000, fps: 30, visualVariant },
  });
}

export function createTemporalRelationGrid(task: typeof temporalRelationTasks[number]) {
  const result: TemporalRelationCandidate[] = []; let seed = task === "duration-comparison" ? 1_900_000 : 1_910_000;
  for (let replicate = 0; replicate < 2; replicate++) for (let correctIndex = 0; correctIndex < 4; correctIndex++)
    result.push(createTemporalRelationCandidate({ task, split: "discovery", seed: seed++, correctIndex, visualVariant: replicate * 4 + correctIndex }));
  return result;
}

export function temporalRelationEvents(candidate: TemporalRelationCandidate) {
  const random = rng(candidate.seed + candidate.parameters.visualVariant * 3571);
  if (candidate.task === "duration-comparison") {
    const durations = shuffle([450, 700, 950], random);
    const byIndex = Array.from({ length: 4 }, (_, index) => ({
      label: temporalRelationAnswers[index], startMs: 1700 + Math.round(random() * 1800), durationMs: index === candidate.parameters.correctIndex ? 1450 : durations.shift()!,
    }));
    return byIndex;
  }
  const base = [1800, 3900, 5900];
  return Array.from({ length: 8 }, (_, object) => {
    const pair = Math.floor(object / 2); const member = object % 2;
    const offset = pair === candidate.parameters.correctIndex || member === 0 ? 0 : 220 + pair * 45;
    return { label: `${temporalRelationAnswers[pair]}${member + 1}`, starts: base.map((start) => start + pair * 70 + offset), durationMs: 230 };
  });
}

export function renderTemporalRelationSvg(candidate: TemporalRelationCandidate, timestampMs: number) {
  const title = candidate.task === "duration-comparison" ? "WHICH DISK STAYS YELLOW THE LONGEST?" : "WHICH PAIR FLASHES IN PERFECT SYNC?";
  if (candidate.task === "duration-comparison") {
    const events = temporalRelationEvents(candidate) as Array<{ label: string; startMs: number; durationMs: number }>;
    const disks = events.map((event, index) => { const x = 120 + index * 160; const active = timestampMs >= event.startMs && timestampMs < event.startMs + event.durationMs; return `<circle cx="${x}" cy="330" r="58" fill="${active ? "#f4d934" : "#4f5653"}" stroke="#202322" stroke-width="5"/><text x="${x}" y="348" text-anchor="middle" font-family="Arial" font-size="48" font-weight="700" fill="${active ? "#202322" : "#fff"}">${event.label}</text>`; }).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="520"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="58" text-anchor="middle" font-family="Arial" font-size="27" font-weight="700">${title}</text><text x="360" y="100" text-anchor="middle" font-family="Arial" font-size="20" fill="#59605d">Compare each complete yellow interval.</text>${disks}</svg>`;
  }
  const events = temporalRelationEvents(candidate) as Array<{ label: string; starts: number[]; durationMs: number }>;
  const disks = events.map((event, object) => { const pair = Math.floor(object / 2), member = object % 2; const x = 105 + pair * 170; const y = 250 + member * 150; const active = event.starts.some((start) => timestampMs >= start && timestampMs < start + event.durationMs); return `<circle cx="${x}" cy="${y}" r="50" fill="${active ? "#f4d934" : "#4f5653"}" stroke="#202322" stroke-width="4"/><text x="${x}" y="${y + 14}" text-anchor="middle" font-family="Arial" font-size="33" font-weight="700" fill="${active ? "#202322" : "#fff"}">${event.label}</text>`; }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540"><rect width="100%" height="100%" fill="#eeeae0"/><text x="360" y="58" text-anchor="middle" font-family="Arial" font-size="27" font-weight="700">${title}</text><text x="360" y="100" text-anchor="middle" font-family="Arial" font-size="20" fill="#59605d">Each column is one labeled pair.</text>${disks}</svg>`;
}
