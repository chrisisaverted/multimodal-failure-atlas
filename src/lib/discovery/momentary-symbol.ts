import { z } from "zod";
import { sha256 } from "../evaluation/hash";

export const momentarySymbols = ["triangle", "square", "diamond", "star"] as const;
export const momentarySymbolGeneratorVersion = "momentary-symbol-v1";

export const momentarySymbolCandidateSchema = z.object({
  id: z.string().min(1),
  cellId: z.string().min(1),
  mechanism: z.literal("momentary-evidence-acquisition"),
  split: z.enum(["discovery", "confirmatory"]),
  seed: z.number().int().nonnegative(),
  failureModeId: z.literal("brief-event-blindness"),
  question: z.string().min(1),
  answerOptions: z.array(z.enum(momentarySymbols)).length(momentarySymbols.length),
  expectedAnswer: z.enum(momentarySymbols),
  humanSolvability: z.literal("unverified"),
  parameters: z.object({
    symbol: z.enum(momentarySymbols),
    eventDurationMs: z.number().int().min(34).max(500),
    phaseMs: z.number().int().min(0).max(999),
    eventSecond: z.number().int().min(1).max(28),
    videoDurationMs: z.number().int().min(5000).max(30000),
    fps: z.literal(30),
    visualVariant: z.number().int().nonnegative(),
  }),
});

export type MomentarySymbolCandidate = z.infer<typeof momentarySymbolCandidateSchema>;

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

function rotate<T>(values: readonly T[], amount: number) {
  return values.map((_, index) => values[(index + amount) % values.length]!);
}

export function createMomentarySymbolCandidate(input: {
  split: "discovery" | "confirmatory";
  seed: number;
  symbol: (typeof momentarySymbols)[number];
  eventDurationMs: number;
  phaseMs: number;
  eventSecond: number;
  videoDurationMs?: number;
  visualVariant?: number;
}) {
  const videoDurationMs = input.videoDurationMs ?? 20_000;
  const visualVariant = input.visualVariant ?? input.seed % 11;
  const eventStartMs = input.eventSecond * 1000 + input.phaseMs;
  if (eventStartMs < 1000 || eventStartMs + input.eventDurationMs > videoDurationMs - 1000) {
    throw new Error("Momentary event must retain one second of context on both sides.");
  }
  const cell = {
    eventDurationMs: input.eventDurationMs,
    phaseMs: input.phaseMs,
    videoDurationMs,
  };
  const identity = { ...input, videoDurationMs, visualVariant, fps: 30 };
  return momentarySymbolCandidateSchema.parse({
    id: stableId("ms", identity),
    cellId: stableId("cell", cell),
    mechanism: "momentary-evidence-acquisition",
    split: input.split,
    seed: input.seed,
    failureModeId: "brief-event-blindness",
    question: "Which large black symbol appears briefly at the center of the video?",
    answerOptions: rotate(momentarySymbols, input.seed % momentarySymbols.length),
    expectedAnswer: input.symbol,
    humanSolvability: "unverified",
    parameters: {
      symbol: input.symbol,
      eventDurationMs: input.eventDurationMs,
      phaseMs: input.phaseMs,
      eventSecond: input.eventSecond,
      videoDurationMs,
      fps: 30,
      visualVariant,
    },
  });
}

export function createMomentarySymbolDiscoveryGrid() {
  const candidates: MomentarySymbolCandidate[] = [];
  const eventSeconds = [5, 9, 13, 17];
  let seed = 510_000;
  let cellIndex = 0;
  for (const eventDurationMs of [67, 100, 133]) {
    for (const phaseMs of [150, 250, 350]) {
      for (const [symbolIndex, symbol] of momentarySymbols.entries()) {
        candidates.push(
          createMomentarySymbolCandidate({
            split: "discovery",
            seed,
            symbol,
            eventDurationMs,
            phaseMs,
            eventSecond: eventSeconds[(symbolIndex + cellIndex) % eventSeconds.length]!,
          }),
        );
        seed += 1;
      }
      cellIndex += 1;
    }
  }
  return candidates;
}

export function createMomentarySymbolHoldout(
  winningCell: Pick<MomentarySymbolCandidate, "cellId" | "parameters">,
  excludedEventSeconds: number[] = [],
) {
  const candidates: MomentarySymbolCandidate[] = [];
  const eventSeconds = Array.from(
    { length: Math.floor(winningCell.parameters.videoDurationMs / 1000) - 3 },
    (_, index) => index + 2,
  )
    .filter((eventSecond) => !excludedEventSeconds.includes(eventSecond))
    .filter((eventSecond) =>
      [1, 2, 4].every(
        (sampleFps) => !eventWindowTouchesReferenceSampler(winningCell.parameters, eventSecond, sampleFps),
      ),
    )
    .slice(0, 4);
  if (eventSeconds.length !== 4) {
    throw new Error("Winning cell has fewer than four disjoint reference-sampler-safe event times.");
  }
  let seed = 920_000;
  for (let replicate = 0; replicate < 4; replicate += 1) {
    for (const [symbolIndex, symbol] of momentarySymbols.entries()) {
      candidates.push(
        createMomentarySymbolCandidate({
          split: "confirmatory",
          seed,
          symbol,
          eventDurationMs: winningCell.parameters.eventDurationMs,
          phaseMs: winningCell.parameters.phaseMs,
          eventSecond: eventSeconds[(symbolIndex + replicate) % eventSeconds.length]!,
          visualVariant: 20 + replicate * momentarySymbols.length + symbolIndex,
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

export function referenceUniformSampleIndices(videoDurationMs: number, sourceFps: number, sampleFps: number) {
  const totalFrames = Math.round((videoDurationMs / 1000) * sourceFps);
  const sampledFrames = Math.max(Math.round((totalFrames * sampleFps) / sourceFps), 1);
  if (sampledFrames === 1) return [0];
  return Array.from({ length: sampledFrames }, (_, index) =>
    Math.round((index * (totalFrames - 1)) / (sampledFrames - 1)),
  );
}

export function eventTouchesReferenceSampler(candidate: MomentarySymbolCandidate, sampleFps: number) {
  const parameters = candidate.parameters;
  return eventWindowTouchesReferenceSampler(parameters, parameters.eventSecond, sampleFps);
}

function eventWindowTouchesReferenceSampler(
  parameters: MomentarySymbolCandidate["parameters"],
  eventSecond: number,
  sampleFps: number,
) {
  const eventStartFrame = ((eventSecond * 1000 + parameters.phaseMs) / 1000) * parameters.fps;
  const eventEndFrame = eventStartFrame + (parameters.eventDurationMs / 1000) * parameters.fps;
  return referenceUniformSampleIndices(parameters.videoDurationMs, parameters.fps, sampleFps).some(
    (frame) => frame >= eventStartFrame && frame < eventEndFrame,
  );
}

function symbolMarkup(symbol: (typeof momentarySymbols)[number]) {
  if (symbol === "triangle") return '<path d="M90 29 126 91H54Z" fill="#11130f"/>';
  if (symbol === "square") return '<rect x="58" y="28" width="64" height="64" rx="2" fill="#11130f"/>';
  if (symbol === "diamond") return '<path d="M90 24 128 60 90 96 52 60Z" fill="#11130f"/>';
  return '<path d="m90 23 9 25 27-1-21 17 9 26-24-15-24 15 9-26-21-17 27 1Z" fill="#11130f"/>';
}

export function isMomentaryEventActive(candidate: MomentarySymbolCandidate, timestampMs: number) {
  const { eventSecond, phaseMs, eventDurationMs } = candidate.parameters;
  const start = eventSecond * 1000 + phaseMs;
  return timestampMs >= start && timestampMs < start + eventDurationMs;
}

export function renderMomentarySymbolSvg(candidate: MomentarySymbolCandidate, timestampMs: number) {
  const active = isMomentaryEventActive(candidate, timestampMs);
  const palette = [
    ["#e8e4d9", "#68706a"],
    ["#e4e8e2", "#6f6964"],
    ["#ece3dc", "#666d76"],
  ][candidate.parameters.visualVariant % 3]!;
  const theta = ((timestampMs / 1000) * 19 + candidate.parameters.visualVariant * 31) % 360;
  const radians = (theta * Math.PI) / 180;
  const orbitX = 90 + Math.cos(radians) * 67;
  const orbitY = 60 + Math.sin(radians) * 42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480" viewBox="0 0 180 120"><rect width="180" height="120" fill="${active ? "#f4dc36" : palette[0]}"/><circle cx="90" cy="60" r="45" fill="none" stroke="${palette[1]}" stroke-width="1" opacity=".22"/><circle cx="${orbitX.toFixed(2)}" cy="${orbitY.toFixed(2)}" r="2.4" fill="${palette[1]}" opacity=".5"/>${active ? symbolMarkup(candidate.parameters.symbol) : '<circle cx="90" cy="60" r="3" fill="#4b4e48"/><path d="M82 60h16M90 52v16" stroke="#4b4e48" stroke-width="1" opacity=".45"/>'}</svg>`;
}
