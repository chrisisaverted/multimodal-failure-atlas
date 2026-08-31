import { sha256 } from "../evaluation/hash";
import { discoveryCandidateSchema, type DiscoveryCandidate } from "./schema";

export const discoveryGeneratorVersion = "lattice-counting-v1";

export interface LatticeCountingInput {
  split: "discovery" | "confirmatory";
  seed: number;
  count: number;
  flashDurationMs: number;
  intervalMs: number;
  phaseMs: number;
  visualVariant?: number;
  videoDurationMs?: number;
}

function stableId(prefix: string, value: unknown) {
  return `${prefix}-${sha256(JSON.stringify(value)).slice(0, 16)}`;
}

export function createLatticeCountingCandidate(input: LatticeCountingInput): DiscoveryCandidate {
  const videoDurationMs = input.videoDurationMs ?? 7600;
  const fps = 30;
  const visualVariant = input.visualVariant ?? input.seed % 7;
  const firstFlashAtMs = 600 + input.phaseMs;
  const lastFlashEndMs = firstFlashAtMs + (input.count - 1) * input.intervalMs + input.flashDurationMs;
  if (lastFlashEndMs > videoDurationMs - 300) {
    throw new Error(`Counted event falls outside the clip (${lastFlashEndMs}ms).`);
  }

  const cell = {
    flashDurationMs: input.flashDurationMs,
    intervalMs: input.intervalMs,
    phaseMs: input.phaseMs,
  };
  const identity = { ...input, visualVariant, videoDurationMs, fps };
  const distractors = [Math.max(1, input.count - 1), input.count + 1, input.count + 2];
  const options = [...new Set([input.count, ...distractors])].sort((left, right) => left - right).map(String);

  return discoveryCandidateSchema.parse({
    id: stableId("lc", identity),
    cellId: stableId("cell", cell),
    mechanism: "temporal-sampling-lattice",
    split: input.split,
    seed: input.seed,
    failureModeId: "repeated-event-undercount",
    question: "How many times does the central light flash bright yellow?",
    answerOptions: options,
    expectedAnswer: String(input.count),
    humanSolvability: "unverified",
    parameters: {
      count: input.count,
      flashDurationMs: input.flashDurationMs,
      intervalMs: input.intervalMs,
      phaseMs: input.phaseMs,
      videoDurationMs,
      fps,
      visualVariant,
    },
  });
}

export function createDiscoveryGrid() {
  const candidates: DiscoveryCandidate[] = [];
  let seed = 410_000;
  for (const flashDurationMs of [100, 233]) {
    for (const intervalMs of [400, 700]) {
      for (const phaseMs of [125, 375, 625]) {
        for (const count of [3, 5, 7, 9]) {
          candidates.push(
            createLatticeCountingCandidate({
              split: "discovery",
              seed,
              count,
              flashDurationMs,
              intervalMs,
              phaseMs,
            }),
          );
          seed += 1;
        }
      }
    }
  }
  return candidates;
}

export function createConfirmatoryCandidates(
  winningCells: Array<Pick<DiscoveryCandidate, "cellId" | "parameters">>,
) {
  const unique = new Map(winningCells.map((entry) => [entry.cellId, entry]));
  const candidates: DiscoveryCandidate[] = [];
  let seed = 910_000;
  for (const entry of unique.values()) {
    for (const count of [4, 6, 8, 10]) {
      candidates.push(
        createLatticeCountingCandidate({
          split: "confirmatory",
          seed,
          count,
          flashDurationMs: entry.parameters.flashDurationMs,
          intervalMs: entry.parameters.intervalMs,
          phaseMs: entry.parameters.phaseMs,
          visualVariant: 10 + (seed % 7),
          videoDurationMs: 8000,
        }),
      );
      seed += 1;
    }
  }
  return candidates;
}

export function renderLatticeCountingSvg(candidate: DiscoveryCandidate, timestampMs: number) {
  const { count, flashDurationMs, intervalMs, phaseMs, visualVariant } = candidate.parameters;
  const firstFlashAtMs = 600 + phaseMs;
  const active = Array.from({ length: count }, (_, index) => firstFlashAtMs + index * intervalMs).some(
    (start) => timestampMs >= start && timestampMs < start + flashDurationMs,
  );
  const background = ["#e9e5da", "#e6e8e1", "#ece4dc"][visualVariant % 3]!;
  const ring = active ? "#d9f43c" : "#73756c";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 140 100"><rect width="140" height="100" fill="${background}"/><path d="M0 82H140" stroke="#171915" opacity=".12"/><circle cx="70" cy="50" r="31" fill="none" stroke="${ring}" stroke-width="2" opacity="${active ? 0.55 : 0.22}"/><circle cx="70" cy="50" r="22" fill="${active ? "#d9f43c" : "#35382f"}"/><circle cx="70" cy="50" r="4" fill="${active ? "#fffbd1" : "#4a4d43"}"/></svg>`;
}
